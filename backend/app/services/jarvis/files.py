"""File manager: search, browse, organize, move, rename, and manage folders safely."""
from __future__ import annotations

import os
import re
import shutil
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    import send2trash
    _SEND2TRASH_OK = True
except ImportError:
    _SEND2TRASH_OK = False

SAFE_ROOTS: Dict[str, Path] = {
    "desktop": Path.home() / "Desktop",
    "documents": Path.home() / "Documents",
    "downloads": Path.home() / "Downloads",
    "pictures": Path.home() / "Pictures",
    "music": Path.home() / "Music",
    "videos": Path.home() / "Videos",
}

CATEGORY_RULES: Dict[str, set[str]] = {
    "Images": {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".svg", ".webp", ".ico"},
    "Documents": {".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt", ".md"},
    "Spreadsheets": {".xls", ".xlsx", ".csv", ".tsv"},
    "Videos": {".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv"},
    "Music": {".mp3", ".wav", ".flac", ".aac", ".m4a", ".ogg"},
    "Archives": {".zip", ".rar", ".7z", ".tar", ".gz"},
    "Installers": {".exe", ".msi"},
    "Code": {".py", ".js", ".ts", ".html", ".css", ".java", ".cpp", ".json"},
}

_DRIVE_PATTERN = re.compile(r"^[a-zA-Z](:\\?)?$")


def resolve_location(loc: Optional[str]) -> Path:
    """Resolve alias or absolute path to real directory."""
    if not loc:
        return Path.home() / "Desktop"
    key = loc.strip().lower()
    if key in SAFE_ROOTS:
        return SAFE_ROOTS[key]
    if _DRIVE_PATTERN.match(key):
        return Path(f"{key[0]}:\\")
    p = Path(loc).expanduser()
    if p.exists():
        return p
    return Path.home() / "Desktop"


def list_files(path: Optional[str] = None, show_hidden: bool = False) -> List[Dict[str, Any]]:
    """List directory contents with file metadata."""
    target = resolve_location(path)
    if not target.exists() or not target.is_dir():
        return []

    items = []
    try:
        for entry in sorted(target.iterdir()):
            if not show_hidden and entry.name.startswith("."):
                continue
            is_dir = entry.is_dir()
            size = entry.stat().st_size if not is_dir else 0
            mtime = entry.stat().st_mtime
            items.append({
                "name": entry.name,
                "path": str(entry),
                "is_dir": is_dir,
                "size_bytes": size,
                "size_str": format_size(size) if not is_dir else "Folder",
                "modified": time.strftime("%Y-%m-%d %H:%M", time.localtime(mtime)),
            })
    except PermissionError:
        pass
    return items


def search_files(query: str, root: Optional[str] = None, max_matches: int = 40) -> List[Dict[str, Any]]:
    """Search for files by name query within given root folder or across safe roots."""
    roots = [resolve_location(root)] if root else list(SAFE_ROOTS.values())
    q_lower = query.lower().strip()
    results = []
    start_time = time.time()

    for r in roots:
        if not r.exists():
            continue
        try:
            for dirpath, dirnames, filenames in os.walk(r, followlinks=False):
                if time.time() - start_time > 6.0:  # Timeout safety
                    break
                # Filter out system bookkeeping
                dirnames[:] = [d for d in dirnames if d.lower() not in ("$recycle.bin", "system volume information", "node_modules", ".git")]
                for f in filenames:
                    if q_lower in f.lower():
                        full_path = Path(dirpath) / f
                        try:
                            st = full_path.stat()
                            results.append({
                                "name": f,
                                "path": str(full_path),
                                "size_str": format_size(st.st_size),
                                "modified": time.strftime("%Y-%m-%d %H:%M", time.localtime(st.st_mtime)),
                            })
                            if len(results) >= max_matches:
                                return results
                        except Exception:
                            continue
        except Exception:
            continue

    return results


def find_folders(query: str, root: Optional[str] = None) -> List[Dict[str, Any]]:
    """Search for subdirectories by name."""
    target_root = resolve_location(root)
    q_lower = query.lower().strip()
    results = []
    try:
        for dirpath, dirnames, _ in os.walk(target_root, followlinks=False):
            for d in dirnames:
                if q_lower in d.lower():
                    fp = Path(dirpath) / d
                    results.append({"name": d, "path": str(fp)})
                    if len(results) >= 30:
                        return results
    except Exception:
        pass
    return results


def create_folder(location: Optional[str], folder_name: str) -> Dict[str, Any]:
    """Create a new folder."""
    base = resolve_location(location)
    new_dir = base / folder_name.strip()
    try:
        new_dir.mkdir(parents=True, exist_ok=True)
        return {"status": "success", "path": str(new_dir), "message": f"Created folder: {new_dir.name}"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to create folder: {e}"}


def create_file(location: Optional[str], filename: str, content: str = "") -> Dict[str, Any]:
    """Create and write content to a file."""
    base = resolve_location(location)
    fpath = base / filename.strip()
    try:
        fpath.write_text(content, encoding="utf-8")
        return {"status": "success", "path": str(fpath), "message": f"File created: {fpath.name}"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to create file: {e}"}


def rename_item(old_path: str, new_name: str) -> Dict[str, Any]:
    """Rename file or folder."""
    src = Path(old_path)
    if not src.exists():
        return {"status": "error", "message": f"Path does not exist: {old_path}"}
    dst = src.parent / new_name.strip()
    try:
        src.rename(dst)
        return {"status": "success", "new_path": str(dst), "message": f"Renamed to {dst.name}."}
    except Exception as e:
        return {"status": "error", "message": f"Rename failed: {e}"}


def organize_folder(location: Optional[str] = None) -> Dict[str, Any]:
    """Organize loose files in a folder into category subfolders."""
    target = resolve_location(location)
    if not target.exists() or not target.is_dir():
        return {"status": "error", "message": "Invalid directory."}

    moved_count = 0
    errors = []

    try:
        for entry in list(target.iterdir()):
            if entry.is_file() and not entry.name.startswith("."):
                ext = entry.suffix.lower()
                target_cat = "Other"
                for cat, exts in CATEGORY_RULES.items():
                    if ext in exts:
                        target_cat = cat
                        break

                dest_dir = target / target_cat
                dest_dir.mkdir(exist_ok=True)
                try:
                    shutil.move(str(entry), str(dest_dir / entry.name))
                    moved_count += 1
                except Exception as e:
                    errors.append(f"{entry.name}: {e}")

        return {
            "status": "success",
            "moved_files": moved_count,
            "location": str(target),
            "message": f"Organized {moved_count} files into categories.",
            "errors": errors,
        }
    except Exception as e:
        return {"status": "error", "message": f"Folder organization failed: {e}"}


def delete_item(path: str) -> Dict[str, Any]:
    """Safely move file or folder to Recycle Bin."""
    p = Path(path)
    if not p.exists():
        return {"status": "error", "message": "Item does not exist."}
    try:
        if _SEND2TRASH_OK:
            send2trash.send2trash(str(p))
            return {"status": "success", "message": f"Moved {p.name} to Recycle Bin."}
        else:
            if p.is_dir():
                shutil.rmtree(p)
            else:
                p.unlink()
            return {"status": "success", "message": f"Deleted {p.name}."}
    except Exception as e:
        return {"status": "error", "message": f"Deletion failed: {e}"}


def format_size(bytes_size: int) -> str:
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if bytes_size < 1024:
            return f"{bytes_size:.1f} {unit}"
        bytes_size /= 1024
    return f"{bytes_size:.1f} TB"


def get_disk_usage(path: Optional[str] = None) -> Dict[str, Any]:
    p = resolve_location(path)
    usage = shutil.disk_usage(str(p))
    return {
        "path": str(p),
        "total_gb": round(usage.total / (1024**3), 1),
        "used_gb": round(usage.used / (1024**3), 1),
        "free_gb": round(usage.free / (1024**3), 1),
        "percent": round((usage.used / usage.total) * 100, 1),
    }
