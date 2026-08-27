"""
YouTube Search and Study Playlist finder for JARVIS.
"""
from __future__ import annotations

import logging
import re
import urllib.parse
from typing import Any, Dict, List
import httpx

logger = logging.getLogger("ascend.tools.youtube")


async def search_youtube(query: str, max_results: int = 3) -> Dict[str, Any]:
    """
    Searches YouTube for videos/audio playlists matching the query.
    Returns direct video titles, video IDs, thumbnails, and links.
    """
    clean_query = query.strip()
    if not clean_query:
        clean_query = "lofi hip hop study beats"

    encoded = urllib.parse.quote_plus(clean_query)
    results: List[Dict[str, str]] = []

    try:
        url = f"https://www.youtube.com/results?search_query={encoded}"
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Accept-Language": "en-US,en;q=0.9",
                },
            )
            if resp.status_code == 200:
                # Extract video IDs and titles using regex on ytInitialData
                video_ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', resp.text)
                titles = re.findall(r'"title":\{"runs":\[\{"text":"([^"]+)"\}\]', resp.text)

                seen_ids = set()
                idx = 0
                for vid in video_ids:
                    if vid not in seen_ids and len(results) < max_results:
                        seen_ids.add(vid)
                        title = titles[idx] if idx < len(titles) else f"YouTube Video ({vid})"
                        results.append({
                            "title": title,
                            "video_id": vid,
                            "url": f"https://www.youtube.com/watch?v={vid}",
                            "thumbnail": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                        })
                        idx += 1
    except Exception as exc:
        logger.warning("YouTube search failed: %s", exc)

    if not results:
        # Fallback to standard YouTube search link
        results.append({
            "title": f"YouTube: {clean_query}",
            "video_id": "",
            "url": f"https://www.youtube.com/results?search_query={encoded}",
            "thumbnail": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop",
        })

    summary_lines = [f"Found YouTube media for **{clean_query}**:"]
    for r in results:
        summary_lines.append(f"• **[{r['title']}]({r['url']})**")

    return {
        "query": clean_query,
        "results": results,
        "summary": "\n".join(summary_lines),
    }
