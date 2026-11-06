"""Universal File Processor for ASCEND JARVIS.
Processes Images, PDFs, Word docs, Spreadsheets, JSON/XML, Code, Audio, Video, PPTX, and Archives.
"""
from __future__ import annotations

import csv
import json
import logging
import os
import shutil
import subprocess
import zipfile
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.services.jarvis.config import API_KEYS

logger = logging.getLogger("ascend.jarvis.file_processor")

try:
    from PIL import Image
    _PIL_OK = True
except ImportError:
    _PIL_OK = False


def detect_file_type(path: Path) -> str:
    ext = path.suffix.lower().lstrip(".")
    image_exts = {"jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "svg", "ico"}
    video_exts = {"mp4", "avi", "mov", "mkv", "wmv", "flv", "webm", "m4v"}
    audio_exts = {"mp3", "wav", "ogg", "m4a", "aac", "flac", "wma"}
    code_exts = {"py", "js", "ts", "jsx", "tsx", "html", "css", "java", "cpp", "c", "cs", "go", "rs", "rb", "php", "sql", "yaml", "toml", "sh"}
    archive_exts = {"zip", "rar", "tar", "gz", "7z"}

    if ext in image_exts:
        return "image"
    if ext in video_exts:
        return "video"
    if ext in audio_exts:
        return "audio"
    if ext in code_exts:
        return "code"
    if ext in archive_exts:
        return "archive"
    if ext == "pdf":
        return "pdf"
    if ext in ("docx", "doc"):
        return "docx"
    if ext in ("txt", "md", "log", "rst"):
        return "text"
    if ext in ("csv", "tsv"):
        return "csv"
    if ext in ("xlsx", "xls"):
        return "excel"
    if ext in ("json", "xml"):
        return ext
    if ext in ("pptx", "ppt"):
        return "pptx"
    return "unknown"


def _call_ai_text(prompt: str, content: str) -> str:
    """Helper for LLM text analysis."""
    api_key = API_KEYS.get("gemini_api_key")
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            resp = model.generate_content(f"{prompt}\n\nCONTENT:\n{content[:25000]}")
            return resp.text.strip()
        except Exception as e:
            logger.warning("Gemini text call failed: %s", e)

    or_key = API_KEYS.get("openrouter_api_key")
    if or_key:
        try:
            import httpx
            payload = {
                "model": "google/gemini-2.0-flash-lite-preview-02-05:free",
                "messages": [
                    {"role": "user", "content": f"{prompt}\n\nCONTENT:\n{content[:25000]}"}
                ]
            }
            with httpx.Client(timeout=30) as client:
                res = client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={"Authorization": f"Bearer {or_key}", "Content-Type": "application/json"},
                    json=payload
                )
                if res.status_code == 200:
                    return res.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.error("OpenRouter call failed: %s", e)

    return "AI processing unavailable: No valid API key configured."


def process_image(path: Path, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
    if not _PIL_OK:
        return {"status": "error", "message": "Pillow not installed."}

    act = action.lower()
    img = Image.open(path)

    if act in ("describe", "ocr", "analyze", "read"):
        from app.services.jarvis.vision import analyze_image_with_ai
        prompt = {
            "describe": "Describe this image in detail.",
            "ocr": "Extract all text visible in this image accurately.",
            "analyze": "Analyze this image thoroughly: key elements, text, and structure.",
        }.get(act, "Describe this image.")
        if params.get("instruction"):
            prompt = params["instruction"]
        res = analyze_image_with_ai(img, prompt)
        return {"status": "success", "result": res, "file": path.name}

    if act == "resize":
        w = params.get("width") or int(img.width * float(params.get("scale", 0.5)))
        h = params.get("height") or int(img.height * float(params.get("scale", 0.5)))
        resized = img.resize((int(w), int(h)), Image.LANCZOS)
        out = path.parent / f"{path.stem}_resized{path.suffix}"
        resized.save(out)
        return {"status": "success", "output_path": str(out), "message": f"Resized to {w}x{h}."}

    if act == "convert":
        fmt = (params.get("format") or "png").lower().lstrip(".")
        out = path.parent / f"{path.stem}.{fmt}"
        rgb = img.convert("RGB") if fmt in ("jpg", "jpeg") else img
        rgb.save(out)
        return {"status": "success", "output_path": str(out), "message": f"Converted to {fmt}."}

    return {"status": "success", "result": f"Image dimensions: {img.width}x{img.height}, format: {img.format}."}


def process_pdf(path: Path, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
    text = ""
    # Try pypdf or PyPDF2 if installed
    try:
        import pypdf
        reader = pypdf.PdfReader(str(path))
        pages_text = [p.extract_text() or "" for p in reader.pages]
        text = "\n\n".join(pages_text)
    except Exception:
        pass

    if not text:
        text = f"[PDF file: {path.name}, size: {path.stat().st_size} bytes]"

    prompt = params.get("instruction") or "Summarize the key points, sections, and insights of this document."
    analysis = _call_ai_text(prompt, text)
    return {"status": "success", "file": path.name, "result": analysis}


def process_text_or_code(path: Path, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
    try:
        content = path.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        return {"status": "error", "message": f"Could not read file: {e}"}

    act = action.lower()
    prompt = params.get("instruction") or {
        "explain": "Explain what this code/document does in clear, structured points.",
        "review": "Review this code for security, edge cases, and performance optimizations.",
        "fix": "Identify bugs or syntax errors and provide corrected code.",
        "optimize": "Optimize this code for speed and readability.",
        "summarize": "Summarize this document concisely.",
    }.get(act, "Analyze this document.")

    res = _call_ai_text(prompt, content)
    return {"status": "success", "file": path.name, "result": res}


def process_csv(path: Path, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
    try:
        rows = []
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.reader(f)
            for i, row in enumerate(reader):
                if i < 100:  # Sample preview
                    rows.append(row)
        sample = "\n".join([", ".join(r) for r in rows[:40]])
        prompt = params.get("instruction") or "Provide summary statistics, column analysis, and anomalies in this data."
        res = _call_ai_text(prompt, sample)
        return {"status": "success", "file": path.name, "result": res, "row_count_sampled": len(rows)}
    except Exception as e:
        return {"status": "error", "message": f"CSV processing error: {e}"}


def process_archive(path: Path, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
    act = action.lower()
    if not zipfile.is_zipfile(str(path)):
        return {"status": "error", "message": "Only standard zip archives currently supported directly."}

    with zipfile.ZipFile(str(path), "r") as z:
        if act == "extract":
            dest = params.get("destination") or path.parent / path.stem
            z.extractall(str(dest))
            return {"status": "success", "message": f"Extracted archive to {dest}."}
        filelist = z.namelist()
        return {"status": "success", "files": filelist[:50], "total_files": len(filelist)}


def process_file_action(file_path: str, action: str = "auto", params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Universal dispatcher for file actions."""
    p = Path(file_path)
    if not p.exists():
        return {"status": "error", "message": f"File does not exist: {file_path}"}

    params = params or {}
    ftype = detect_file_type(p)

    if ftype == "image":
        return process_image(p, action, params)
    elif ftype == "pdf":
        return process_pdf(p, action, params)
    elif ftype in ("text", "docx", "code", "json", "xml"):
        return process_text_or_code(p, action, params)
    elif ftype in ("csv", "excel"):
        return process_csv(p, action, params)
    elif ftype == "archive":
        return process_archive(p, action, params)

    return {"status": "info", "file_type": ftype, "message": f"Detected {ftype} file ({p.name})."}
