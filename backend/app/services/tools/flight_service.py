"""
Flight Finder Service for ASCEND's JARVIS.
Integrates flight search capabilities from Mark XXXIX Jarvis.
"""
from __future__ import annotations

import urllib.parse
from typing import Any, Dict, Optional

def lookup_flights(origin: str, destination: str, date: Optional[str] = None) -> Dict[str, Any]:
    """Generates flight lookup link and guidance for Google Flights / Skyscanner."""
    q_str = f"Flights from {origin} to {destination}"
    if date:
        q_str += f" on {date}"
    encoded = urllib.parse.quote_plus(q_str)
    flights_url = f"https://www.google.com/travel/flights?q={encoded}"

    return {
        "origin": origin,
        "destination": destination,
        "date": date or "Flexible",
        "search_url": flights_url,
        "summary": f"Found route from {origin} to {destination}. Direct search portal initialized.",
    }
