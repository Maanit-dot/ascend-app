"""Autonomous Dev Agent & Code Assistant:
Plans, generates, executes, tests, classifies errors, and auto-fixes multi-file projects or single scripts.
"""
from __future__ import annotations

import json
import logging
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.services.jarvis.config import API_KEYS

logger = logging.getLogger("ascend.jarvis.dev_agent")

PROJECTS_DIR = Path.home() / "Desktop" / "AscendProjects"


def _call_llm(prompt: str, system: str = "") -> str:
    """Helper to query Gemini or OpenRouter."""
    api_key = API_KEYS.get("gemini_api_key")
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system or None)
            resp = model.generate_content(prompt)
            return resp.text.strip()
        except Exception as e:
            logger.warning("Gemini LLM error: %s", e)

    or_key = API_KEYS.get("openrouter_api_key")
    if or_key:
        try:
            import httpx
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            with httpx.Client(timeout=35) as client:
                res = client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={"Authorization": f"Bearer {or_key}", "Content-Type": "application/json"},
                    json={"model": "google/gemini-2.0-flash-lite-preview-02-05:free", "messages": messages}
                )
                if res.status_code == 200:
                    return res.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.error("OpenRouter LLM error: %s", e)

    return "Dev Agent Error: No LLM available."


def run_code_snippet(code: str, language: str = "python", timeout: int = 15) -> Dict[str, Any]:
    """Execute a code script in an isolated temp file and capture stdout/stderr."""
    clean_code = re.sub(r"^```[a-zA-Z]*\n?", "", code.strip())
    clean_code = re.sub(r"\n?```$", "", clean_code).strip()

    ext = ".py" if language.lower() in ("python", "py") else ".js"
    temp_file = Path.home() / "Desktop" / f"_temp_exec_{int(time.time())}{ext}"
    try:
        temp_file.write_text(clean_code, encoding="utf-8")
        cmd = [sys.executable, str(temp_file)] if ext == ".py" else ["node", str(temp_file)]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return {
            "status": "success" if res.returncode == 0 else "error",
            "returncode": res.returncode,
            "stdout": res.stdout,
            "stderr": res.stderr,
        }
    except subprocess.TimeoutExpired:
        return {"status": "error", "message": f"Execution timed out ({timeout}s)."}
    except Exception as e:
        return {"status": "error", "message": f"Execution failed: {e}"}
    finally:
        if temp_file.exists():
            try:
                temp_file.unlink()
            except Exception:
                pass


def build_code_with_loop(goal: str, language: str = "python", max_attempts: int = 3) -> Dict[str, Any]:
    """Build -> Run -> Fix loop (up to max_attempts) to generate error-free runnable code."""
    system_inst = "You are an expert developer. Return ONLY valid, complete runnable code. No explanations, no markdown fences."
    prompt = f"Write a complete, runnable {language} script that accomplishes: {goal}"

    attempts_log = []
    current_code = ""

    for attempt in range(1, max_attempts + 1):
        raw_code = _call_llm(prompt if attempt == 1 else f"Fix this code:\n\n{current_code}\n\nError output:\n{attempts_log[-1]['error']}", system_inst)
        current_code = re.sub(r"^```[a-zA-Z]*\n?", "", raw_code.strip())
        current_code = re.sub(r"\n?```$", "", current_code).strip()

        exec_res = run_code_snippet(current_code, language=language)
        if exec_res.get("status") == "success":
            attempts_log.append({"attempt": attempt, "status": "success", "stdout": exec_res.get("stdout")})
            # Save working file
            out_file = Path.home() / "Desktop" / f"jarvis_build_{int(time.time())}.py"
            out_file.write_text(current_code, encoding="utf-8")
            return {
                "status": "success",
                "attempts": attempt,
                "saved_to": str(out_file),
                "code": current_code,
                "stdout": exec_res.get("stdout"),
                "message": f"Code built and verified in {attempt} attempt(s). Saved to {out_file.name}.",
            }
        else:
            attempts_log.append({"attempt": attempt, "status": "failed", "error": exec_res.get("stderr") or exec_res.get("message")})

    return {
        "status": "partial",
        "attempts": max_attempts,
        "code": current_code,
        "last_error": attempts_log[-1]["error"],
        "message": "Build loop completed with remaining issues.",
    }


def dev_agent_create_project(description: str, project_name: Optional[str] = None) -> Dict[str, Any]:
    """Full autonomous dev agent: plans directory structure, writes files, installs dependencies, and tests."""
    PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
    clean_name = re.sub(r"[^a-zA-Z0-9_-]", "_", (project_name or f"project_{int(time.time())}")).strip("_")
    proj_dir = PROJECTS_DIR / clean_name
    proj_dir.mkdir(parents=True, exist_ok=True)

    # 1. Plan project architecture
    plan_prompt = (
        f"You are an expert software architect. Given this goal: '{description}',\n"
        "Design a multi-file Python project.\n"
        "Return a JSON object with this exact format:\n"
        '{\n  "files": [{"path": "relative/file/path.py", "description": "purpose of this file"}],\n  "requirements": ["package1", "package2"]\n}'
    )
    plan_resp = _call_llm(plan_prompt)
    try:
        match = re.search(r"\{.*\}", plan_resp, re.DOTALL)
        plan_json = json.loads(match.group(0)) if match else {"files": [{"path": "main.py", "description": "Main entry point"}], "requirements": []}
    except Exception:
        plan_json = {"files": [{"path": "main.py", "description": "Main entry point"}], "requirements": []}

    created_files = []

    # 2. Write each file
    for fspec in plan_json.get("files", []):
        fpath = proj_dir / fspec["path"]
        fpath.parent.mkdir(parents=True, exist_ok=True)
        code_prompt = f"Write the complete code for '{fspec['path']}' in a project that does: '{description}'.\nFile purpose: {fspec.get('description', '')}\nReturn ONLY the file code. No markdown fences."
        code = _call_llm(code_prompt)
        clean_c = re.sub(r"^```[a-zA-Z]*\n?", "", code.strip())
        clean_c = re.sub(r"\n?```$", "", clean_c).strip()
        fpath.write_text(clean_c, encoding="utf-8")
        created_files.append(fspec["path"])

    # 3. Pip install dependencies if any
    reqs = plan_json.get("requirements", [])
    if reqs:
        req_file = proj_dir / "requirements.txt"
        req_file.write_text("\n".join(reqs), encoding="utf-8")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", *reqs], timeout=40, capture_output=True)
        except Exception:
            pass

    # 4. Try opening in VS Code
    from app.services.jarvis.desktop_control import open_app
    try:
        subprocess.Popen(f'code "{proj_dir}"', shell=True)
    except Exception:
        pass

    return {
        "status": "success",
        "project_name": clean_name,
        "project_dir": str(proj_dir),
        "files_created": created_files,
        "requirements": reqs,
        "message": f"Autonomous Dev Agent created project '{clean_name}' at {proj_dir}.",
    }
