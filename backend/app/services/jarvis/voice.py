"""Voice processing: Speech-to-text, Text-to-speech, and Wake-word controls."""
from __future__ import annotations

import base64
import io
import logging
import os
import tempfile
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger("ascend.jarvis.voice")

_WAKEWORD_ENABLED = False


def is_wakeword_enabled() -> bool:
    return _WAKEWORD_ENABLED


def set_wakeword_enabled(enabled: bool) -> bool:
    global _WAKEWORD_ENABLED
    _WAKEWORD_ENABLED = enabled
    return _WAKEWORD_ENABLED


def synthesize_speech(text: str) -> bytes:
    """Synthesize text into WAV audio bytes using pyttsx3 or fallback."""
    try:
        import pyttsx3
        engine = pyttsx3.init()
        engine.setProperty("rate", 185)
        fd, tmp_path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        try:
            engine.save_to_file(text, tmp_path)
            engine.runAndWait()
            with open(tmp_path, "rb") as f:
                return f.read()
        finally:
            engine.stop()
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
    except Exception as e:
        logger.warning("pyttsx3 synthesis failed: %s", e)

    # Return empty bytes if TTS is not available on this platform/driver
    return b""


def synthesize_speech_base64(text: str) -> str:
    """Synthesize text and return base64 encoded audio."""
    raw = synthesize_speech(text)
    if raw:
        return base64.b64encode(raw).decode("ascii")
    return ""


def transcribe_audio_bytes(wav_bytes: bytes) -> str:
    """Transcribe audio WAV bytes into text."""
    # 1. Try faster-whisper if available
    try:
        from faster_whisper import WhisperModel
        model = WhisperModel("small.en", device="cpu", compute_type="int8")
        segments, _ = model.transcribe(io.BytesIO(wav_bytes), language="en", vad_filter=True)
        return " ".join([s.text.strip() for s in segments]).strip()
    except Exception:
        pass

    return ""


def transcribe_partial(pcm_bytes: bytes) -> str:
    """Fast rolling partial transcription for live WebSocket captioning."""
    if len(pcm_bytes) < 1600:  # < 100ms at 16kHz
        return ""
    try:
        import numpy as np
        from faster_whisper import WhisperModel
        pcm_int16 = np.frombuffer(pcm_bytes, dtype=np.int16)
        audio_float32 = pcm_int16.astype(np.float32) / 32768.0
        model = WhisperModel("tiny.en", device="cpu", compute_type="int8")
        segments, _ = model.transcribe(
            audio_float32,
            language="en",
            beam_size=1,
            without_timestamps=True,
            condition_on_previous_text=False
        )
        return " ".join([s.text.strip() for s in segments]).strip()
    except Exception:
        return ""
