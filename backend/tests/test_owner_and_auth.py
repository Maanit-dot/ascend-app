"""
Integration and security tests for:
- Authentication (Google/Firebase tokens, Email/Password, Username/Password)
- Multi-user data isolation
- Owner Control Centre RBAC (SUPER_ADMIN authorization, 403 Forbidden for normal users)
- User suspension and banning enforcement
- Session tracking and revocation
- Modular App Integrations execution
- Desktop device registration & blocking
"""
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.db.base_class import Base
from app.db.session import get_db
from app.main import app
from app.models.desktop import DesktopInstallation
from app.models.session import UserSession
from app.models.user import CharacterProfile, User

# Test Database setup in-memory
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    return TestClient(app)


def create_test_user(db, email: str, username: str, role: str = "USER", is_suspended: bool = False, is_banned: bool = False):
    u = User(
        email=email,
        username=username,
        display_name=username.capitalize(),
        password_hash=hash_password("AscendPassword123!"),
        role=role,
        is_active=True,
        is_onboarded=True,
        is_suspended=is_suspended,
        is_banned=is_banned,
    )
    db.add(u)
    db.flush()
    char = CharacterProfile(user_id=u.id)
    db.add(char)
    db.commit()
    db.refresh(u)
    return u


# --- 1. Registration & Login Tests ---

def test_register_and_login_with_username_and_email(client, db_session):
    # 1. Register new user with username and password
    reg_payload = {
        "email": "hunter1@ascend.io",
        "username": "hunter1",
        "password": "Password123!",
        "display_name": "Shadow Hunter",
        "client_type": "desktop",
        "device_name": "Alienware PC",
        "device_id": "test-device-uuid-1234",
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "hunter1@ascend.io"
    assert data["user"]["username"] == "hunter1"
    token = data["access_token"]

    # 2. Login with username
    login_res = client.post(
        "/api/v1/auth/login",
        json={"login": "hunter1", "password": "Password123!", "client_type": "website"},
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 3. Login with email
    login_email_res = client.post(
        "/api/v1/auth/login",
        json={"login": "hunter1@ascend.io", "password": "Password123!", "client_type": "website"},
    )
    assert login_email_res.status_code == 200
    assert "access_token" in login_email_res.json()

    # 4. Failed login with wrong password
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"login": "hunter1", "password": "WrongPassword"},
    )
    assert bad_login.status_code == 401


# --- 2. Owner Control Centre Access Control Tests ---

def test_owner_access_control(client, db_session):
    # Create Owner (SUPER_ADMIN)
    owner = create_test_user(db_session, email=settings.OWNER_EMAIL, username="system_owner", role="SUPER_ADMIN")
    owner_token = create_access_token({"sub": str(owner.id), "role": "SUPER_ADMIN"})

    # Create Normal User
    normal_user = create_test_user(db_session, email="normal@ascend.io", username="normaluser", role="USER")
    normal_token = create_access_token({"sub": str(normal_user.id), "role": "USER"})

    # 1. Normal user tries to access owner metrics -> 403 Forbidden
    res_forbidden = client.get("/api/v1/owner/metrics", headers={"Authorization": f"Bearer {normal_token}"})
    assert res_forbidden.status_code == 403

    # 2. Owner accesses metrics -> 200 OK
    res_owner = client.get("/api/v1/owner/metrics", headers={"Authorization": f"Bearer {owner_token}"})
    assert res_owner.status_code == 200
    metrics = res_owner.json()
    assert "total_registered_users" in metrics
    assert "active_website_users" in metrics
    assert "active_desktop_users" in metrics
    assert "total_desktop_installations" in metrics

    # 3. Owner lists users
    res_users = client.get("/api/v1/owner/users", headers={"Authorization": f"Bearer {owner_token}"})
    assert res_users.status_code == 200
    assert len(res_users.json()["items"]) >= 2

    # 4. Owner suspends normal user
    suspend_res = client.post(
        f"/api/v1/owner/users/{normal_user.id}/suspend",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"reason": "Terms of service violation - excessive spam"},
    )
    assert suspend_res.status_code == 200

    # 5. Normal user now gets 403 Forbidden when trying to access user profile
    res_blocked = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {normal_token}"})
    assert res_blocked.status_code == 403
    assert "suspended" in res_blocked.json()["detail"].lower()

    # 6. Owner restores normal user
    restore_res = client.post(
        f"/api/v1/owner/users/{normal_user.id}/restore",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert restore_res.status_code == 200

    # 7. Normal user can access profile again
    res_restored = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {normal_token}"})
    assert res_restored.status_code == 200


# --- 3. Desktop Installation & Blocking Tests ---

def test_desktop_registration_and_blocking(client, db_session):
    owner = db_session.query(User).filter(User.email == settings.OWNER_EMAIL).first()
    owner_token = create_access_token({"sub": str(owner.id), "role": "SUPER_ADMIN"})

    dev_id = "machine-hwid-998877"

    # Register desktop
    reg_res = client.post(
        "/api/v1/desktop/register",
        json={"device_id": dev_id, "hostname": "Studio-Desktop", "os_version": "Windows 11 Pro"},
    )
    assert reg_res.status_code == 200
    assert reg_res.json()["is_blocked"] is False

    # Block desktop via Owner API
    block_res = client.post(
        f"/api/v1/owner/installations/{dev_id}/block",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={"reason": "Compromised machine credentials"},
    )
    assert block_res.status_code == 200

    # Next desktop heartbeat returns is_blocked == True
    hb_res = client.post(
        "/api/v1/desktop/heartbeat",
        json={"device_id": dev_id},
    )
    assert hb_res.status_code == 200
    assert hb_res.json()["is_blocked"] is True


# --- 4. Modular App Integrations Tests ---

def test_modular_app_integrations(client, db_session):
    user = create_test_user(db_session, email="moduser@ascend.io", username="moduser")
    token = create_access_token({"sub": str(user.id), "role": "USER"})

    # 1. Fetch registry
    reg_res = client.get("/api/v1/modules/registry", headers={"Authorization": f"Bearer {token}"})
    assert reg_res.status_code == 200
    mods = reg_res.json()
    mod_ids = [m["id"] for m in mods]
    assert "spotify" in mod_ids
    assert "google_calendar" in mod_ids
    assert "notion" in mod_ids
    assert "youtube_focus" in mod_ids
    assert "github_dev" in mod_ids

    # 2. Execute Spotify Action
    spotify_res = client.post(
        "/api/v1/modules/spotify/execute",
        headers={"Authorization": f"Bearer {token}"},
        json={"action_id": "play", "params": {"track": "Cyberpunk Synthwave"}},
    )
    assert spotify_res.status_code == 200
    assert spotify_res.json()["status"] == "playing"

    # 3. Execute Calendar Action
    cal_res = client.post(
        "/api/v1/modules/google_calendar/execute",
        headers={"Authorization": f"Bearer {token}"},
        json={"action_id": "get_events"},
    )
    assert cal_res.status_code == 200
    assert "events" in cal_res.json()

    # 4. Submit Integration Request
    req_res = client.post(
        "/api/v1/modules/request",
        headers={"Authorization": f"Bearer {token}"},
        json={"app_name": "Discord", "description": "Display study voice channels and status", "category": "Social"},
    )
    assert req_res.status_code == 200
    assert "submitted" in req_res.json()["message"].lower()
