"""JARVIS AI System Assistant, Telemetry, Desktop Control, and Automations API Router for ASCEND."""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User

from app.services.jarvis.ai_core import process_user_turn, get_pending_confirmation
from app.services.jarvis.telemetry import get_telemetry, get_top_processes
from app.services.jarvis.desktop_control import (
    list_available_apps,
    open_app,
    close_app,
    switch_window,
    control_volume,
    control_brightness,
    open_task_manager,
    window_action,
    system_power,
    set_wallpaper,
)
from app.services.jarvis.files import (
    list_files,
    search_files,
    create_folder,
    create_file,
    rename_item,
    organize_folder,
    delete_item,
    get_disk_usage,
)
from app.services.jarvis.file_processor import process_file_action
from app.services.jarvis.vision import process_vision_query
from app.services.jarvis.routines import routine_store, execute_routine
from app.services.jarvis.memory import (
    fact_memory,
    long_term_memory,
    conversation_memory,
    is_memory_enabled,
    set_memory_enabled,
)
from app.services.jarvis.security import permission_manager, Scope
from app.services.jarvis.activity_log import action_log
from app.services.jarvis.voice import (
    synthesize_speech_base64,
    transcribe_audio_bytes,
    transcribe_partial,
    is_wakeword_enabled,
    set_wakeword_enabled,
)
from fastapi import WebSocket, WebSocketDisconnect
from app.services.jarvis.config import get_api_key_status, save_api_keys
from app.services.jarvis.dev_agent import run_code_snippet, build_code_with_loop, dev_agent_create_project

router = APIRouter(prefix="/jarvis", tags=["jarvis"])


# --- Request/Response Models ---
class JarvisCommandRequest(BaseModel):
    command: str = Field(min_length=1, max_length=2000)
    confirmation_answer: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = None


class JarvisCommandResponse(BaseModel):
    reply: str
    action: Optional[Dict[str, Any]] = None
    audio_base64: Optional[str] = None
    confirmation_required: Optional[bool] = None
    confirmation: Optional[Dict[str, Any]] = None


# ─── 1. CONVERSATION & COMMANDS ──────────────────────────────────
@router.post("/command", response_model=JarvisCommandResponse)
def handle_command(
    payload: JarvisCommandRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JarvisCommandResponse:
    """Process natural language command turn with ASCEND context and tool actions."""
    res = process_user_turn(
        db=db,
        user=current_user,
        command=payload.command,
        confirmation_answer=payload.confirmation_answer,
    )
    return JarvisCommandResponse(
        reply=res["reply"],
        action=res.get("action"),
        audio_base64=res.get("audio_base64"),
        confirmation_required=res.get("confirmation_required"),
        confirmation=res.get("confirmation"),
    )


# ─── 2. SYSTEM TELEMETRY & PROCESSES ────────────────────────────
@router.get("/telemetry")
def read_system_telemetry() -> Dict[str, Any]:
    """Sample live CPU, GPU (NVIDIA), RAM, Storage, Network, and Battery metrics."""
    return get_telemetry()


@router.get("/processes")
def read_top_processes(limit: int = 15) -> List[Dict[str, Any]]:
    """Get active top processes sorted by resource consumption."""
    return get_top_processes(limit=limit)


# ─── 3. DESKTOP & APPLICATION CONTROL ───────────────────────────
@router.get("/apps")
def get_available_apps() -> Dict[str, Any]:
    """List all indexed Start Menu and whitelisted applications."""
    return {"apps": list_available_apps()}


@router.post("/launch-app")
def launch_application(payload: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    app_name = payload.get("app", "")
    if not app_name:
        raise HTTPException(status_code=400, detail="Missing app name")
    return open_app(app_name)


@router.post("/close-app")
def terminate_application(payload: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    app_name = payload.get("app", "")
    if not app_name:
        raise HTTPException(status_code=400, detail="Missing app name")
    return close_app(app_name)


@router.post("/switch-window")
def switch_active_window(payload: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    target = payload.get("target", "")
    return switch_window(target)


@router.post("/volume")
def set_audio_volume(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    action = payload.get("action", "up")
    value = payload.get("value")
    return control_volume(action=action, value=value)


@router.post("/brightness")
def set_screen_brightness(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    action = payload.get("action", "up")
    value = payload.get("value")
    return control_brightness(action=action, value=value)


@router.post("/task-manager")
def launch_task_manager() -> Dict[str, Any]:
    return open_task_manager()


@router.post("/window")
def manipulate_window(payload: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    action = payload.get("action", "minimize")
    return window_action(action)


@router.post("/power")
def control_power(payload: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    action = payload.get("action", "lock")
    return system_power(action)


@router.post("/wallpaper")
def change_wallpaper(payload: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    path_or_url = payload.get("image", "")
    return set_wallpaper(path_or_url)


# ─── 4. AUTOMATION ROUTINES ─────────────────────────────────────
@router.get("/routines")
def list_routines() -> Dict[str, Any]:
    return {"routines": routine_store.all()}


@router.post("/routines")
def create_routine(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    name = payload.get("name", "New Routine")
    steps = payload.get("steps", [])
    desc = payload.get("description", "")
    quest = payload.get("linked_quest")
    xp = payload.get("xp_bonus", 0)
    created = routine_store.create(name=name, steps=steps, description=desc, linked_quest=quest, xp_bonus=xp)
    return {"status": "success", "routine": created}


@router.put("/routines/{routine_id}")
def update_routine(routine_id: str, payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    name = payload.get("name", "Updated Routine")
    steps = payload.get("steps", [])
    desc = payload.get("description", "")
    quest = payload.get("linked_quest")
    xp = payload.get("xp_bonus", 0)
    upd = routine_store.update(routine_id, name=name, steps=steps, description=desc, linked_quest=quest, xp_bonus=xp)
    if not upd:
        raise HTTPException(status_code=404, detail="Routine not found")
    return {"status": "success", "routine": upd}


@router.delete("/routines/{routine_id}")
def delete_routine(routine_id: str) -> Dict[str, Any]:
    deleted = routine_store.delete(routine_id)
    return {"status": "success", "deleted": deleted}


@router.post("/routines/{routine_id}/run")
def run_routine(
    routine_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    return execute_routine(routine_id, db=db, user=current_user)


# ─── 5. MEMORY MANAGEMENT ───────────────────────────────────────
@router.get("/memory")
def get_memory() -> Dict[str, Any]:
    return {
        "enabled": is_memory_enabled(),
        "facts": fact_memory.all(),
        "long_term": long_term_memory.load(),
    }


@router.post("/memory/fact")
def add_fact(payload: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    key = payload.get("key", "").strip()
    value = payload.get("value", "").strip()
    if not key or not value:
        raise HTTPException(status_code=400, detail="Key and value required.")
    fact_memory.remember(key, value)
    return {"status": "success", "key": key, "value": value}


@router.delete("/memory/fact/{key}")
def delete_fact(key: str) -> Dict[str, Any]:
    deleted = fact_memory.forget(key)
    return {"status": "success", "deleted": deleted}


@router.post("/memory/toggle")
def toggle_memory(payload: Dict[str, bool] = Body(...)) -> Dict[str, Any]:
    en = payload.get("enabled", True)
    set_memory_enabled(en)
    return {"status": "success", "enabled": en}


# ─── 6. ACTIVITY LOG ────────────────────────────────────────────
@router.get("/actions")
def get_activity_log(limit: int = 30) -> Dict[str, Any]:
    return {"actions": action_log.recent(limit=limit)}


# ─── 7. SECURITY & PERMISSIONS ──────────────────────────────────
@router.get("/permissions")
def get_permissions() -> Dict[str, Any]:
    return {"permissions": permission_manager.all_statuses()}


@router.post("/permissions")
def set_permission(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    scope = payload.get("scope", "")
    granted = payload.get("granted", True)
    if granted:
        permission_manager.grant(scope)
    else:
        permission_manager.revoke(scope)
    return {"scope": scope, "granted": permission_manager.is_granted(scope)}


# ─── 8. FILE SYSTEM & UNIVERSAL FILE PROCESSOR ──────────────────
@router.post("/files/list")
def browse_files(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    path = payload.get("path")
    return {"files": list_files(path)}


@router.post("/files/search")
def search_system_files(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    query = payload.get("query", "")
    root = payload.get("root")
    return {"results": search_files(query, root=root)}


@router.post("/files/create-folder")
def make_folder(payload: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    loc = payload.get("location")
    name = payload.get("name", "New Folder")
    return create_folder(loc, name)


@router.post("/files/organize")
def organize_files(payload: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    loc = payload.get("location")
    return organize_folder(loc)


@router.post("/files/delete")
def remove_file(payload: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    path = payload.get("path", "")
    return delete_item(path)


@router.post("/files/process")
def process_file(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    fpath = payload.get("file_path", "")
    action = payload.get("action", "auto")
    params = payload.get("params", {})
    return process_file_action(file_path=fpath, action=action, params=params)


# ─── 9. SCREEN & CAMERA VISION ──────────────────────────────────
@router.post("/vision/scan")
def run_vision_scan(payload: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    angle = payload.get("angle", "screen")
    instruction = payload.get("instruction", "Describe what is visible.")
    return process_vision_query(angle=angle, instruction=instruction)


# ─── 10. VOICE SYNTHESIS & WAKE WORD ────────────────────────────
@router.post("/voice/synthesize")
def synthesize_audio(payload: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    text = payload.get("text", "")
    b64 = synthesize_speech_base64(text)
    return {"audio_base64": b64}


@router.post("/voice/transcribe")
def transcribe_audio(payload: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    import base64
    b64_audio = payload.get("audio_base64", "")
    if not b64_audio:
        return {"transcript": ""}
    raw_bytes = base64.b64decode(b64_audio)
    transcript = transcribe_audio_bytes(raw_bytes)
    return {"transcript": transcript}


@router.websocket("/ws/voice/live")
async def voice_live_ws(websocket: WebSocket) -> None:
    """Live partial transcription channel streaming raw 16-bit PCM chunks."""
    await websocket.accept()
    buffer = bytearray()
    try:
        while True:
            data = await websocket.receive_bytes()
            buffer.extend(data)
            if len(buffer) > 32000 * 8:
                buffer = buffer[-32000 * 4:]
            partial = transcribe_partial(bytes(buffer))
            if partial:
                await websocket.send_json({"event": "partial_transcript", "text": partial})
    except WebSocketDisconnect:
        pass
    except Exception:
        pass


@router.get("/voice/wakeword")
def check_wakeword() -> Dict[str, Any]:
    return {"enabled": is_wakeword_enabled()}


@router.post("/voice/wakeword")
def set_wakeword(payload: Dict[str, bool] = Body(...)) -> Dict[str, Any]:
    en = payload.get("enabled", False)
    set_wakeword_enabled(en)
    return {"enabled": en}


# ─── 11. DEV AGENT & CODE RUNNER ────────────────────────────────
@router.post("/dev/run")
def execute_code(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    code = payload.get("code", "")
    lang = payload.get("language", "python")
    return run_code_snippet(code, language=lang)


@router.post("/dev/build")
def build_code(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    goal = payload.get("goal", "")
    lang = payload.get("language", "python")
    return build_code_with_loop(goal, language=lang)


@router.post("/dev/project")
def generate_project(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    desc = payload.get("description", "")
    name = payload.get("name")
    return dev_agent_create_project(description=desc, project_name=name)


# ─── 12. API KEYS CONFIGURATION ─────────────────────────────────
@router.get("/config/api-keys")
def read_api_key_status() -> Dict[str, Any]:
    """Get non-sensitive status of configured LLM API keys."""
    return get_api_key_status()


@router.post("/config/api-keys")
def update_api_keys(payload: Dict[str, str] = Body(...)) -> Dict[str, Any]:
    """Save Gemini and/or OpenRouter API keys securely into persistent data directory."""
    g_key = payload.get("gemini_api_key")
    o_key = payload.get("openrouter_api_key")
    return save_api_keys(gemini_key=g_key, openrouter_key=o_key)
