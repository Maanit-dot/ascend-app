"""
Import every model here so Alembic's autogenerate can discover all tables
via `Base.metadata` in a single place.
"""
from app.models.user import User, CharacterProfile  # noqa: F401
from app.models.quest import (  # noqa: F401
    QuestTemplate,
    QuestInstance,
    QuestLog,
    SubjectQuestionLog,
)
from app.models.boss import Boss, BossParticipation  # noqa: F401
from app.models.inventory import ItemDefinition, UserInventoryItem  # noqa: F401
from app.models.achievement import (  # noqa: F401
    AchievementDefinition,
    UserAchievement,
    Title,
    UserTitle,
)
from app.models.story import (  # noqa: F401
    Notification,
    NotificationType,
    StoryChapter,
    StoryProgress,
)
from app.models.social import HunterFriend, HunterChatMessage  # noqa: F401
from app.models.session import UserSession  # noqa: F401
from app.models.desktop import DesktopInstallation  # noqa: F401
from app.models.audit import SystemAuditLog  # noqa: F401
from app.models.system import SystemConfig  # noqa: F401
from app.models.integration import AppIntegration  # noqa: F401
