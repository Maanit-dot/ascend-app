"""
Code Assistant module for JARVIS: generates, explains, debugs, and optimizes code snippets.
"""
from __future__ import annotations

import logging
import re
from typing import Any, Dict

logger = logging.getLogger("ascend.tools.code")


def format_code_response(
    language: str,
    code: str,
    explanation: str,
    complexity: str = "",
) -> Dict[str, Any]:
    """
    Creates a structured code card response object.
    """
    clean_lang = language.lower().strip() or "python"
    clean_code = re.sub(r"^```[a-zA-Z]*\n?", "", code.strip())
    clean_code = re.sub(r"\n?```$", "", clean_code).strip()

    return {
        "type": "CODE_ASSIST",
        "language": clean_lang,
        "code": clean_code,
        "explanation": explanation.strip(),
        "complexity": complexity.strip(),
    }
