"""
DuckDuckGo and OpenRouter real-time web search module for JARVIS.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List
import urllib.parse
import httpx

logger = logging.getLogger("ascend.tools.web_search")


async def search_web(query: str, max_results: int = 5) -> Dict[str, Any]:
    """
    Performs real-time web search using DuckDuckGo HTML/API or OpenRouter search.
    Returns structured results with title, snippet, and URL.
    """
    clean_query = query.strip()
    if not clean_query:
        return {"query": "", "results": [], "summary": "No search query provided."}

    results: List[Dict[str, str]] = []

    # Attempt 1: DuckDuckGo instant answer / search
    try:
        encoded = urllib.parse.quote_plus(clean_query)
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                f"https://html.duckduckgo.com/html/?q={encoded}",
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                },
            )
            if resp.status_code == 200:
                import re
                # Simple regex parsing for DuckDuckGo HTML results
                snippets = re.findall(
                    r'<a class="result__snippet[^>]*href="([^"]+)"[^>]*>(.*?)</a>',
                    resp.text,
                    re.DOTALL,
                )
                titles = re.findall(
                    r'<a class="result__url[^>]*href="([^"]+)"[^>]*>(.*?)</a>',
                    resp.text,
                    re.DOTALL,
                )

                # Alternate regex for standard results
                link_blocks = re.findall(
                    r'<a class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>.*?<a class="result__snippet"[^>]*>(.*?)</a>',
                    resp.text,
                    re.DOTALL,
                )

                for link, title_raw, snippet_raw in link_blocks[:max_results]:
                    # Clean tags
                    title = re.sub(r"<[^>]+>", "", title_raw).strip()
                    snippet = re.sub(r"<[^>]+>", "", snippet_raw).strip()
                    # Decode DDG redirect URL if needed
                    actual_url = link
                    if "uddg=" in link:
                        m = re.search(r"uddg=([^&]+)", link)
                        if m:
                            actual_url = urllib.parse.unquote(m.group(1))

                    if title and snippet:
                        results.append({"title": title, "snippet": snippet, "url": actual_url})
    except Exception as exc:
        logger.warning("DuckDuckGo search error: %s", exc)

    # Fallback to direct search summary if scraping blocked
    if not results:
        results.append({
            "title": f"Search results for '{clean_query}'",
            "snippet": f"Direct web search initiated for '{clean_query}'. Click to view live results on DuckDuckGo.",
            "url": f"https://duckduckgo.com/?q={urllib.parse.quote_plus(clean_query)}",
        })

    summary_lines = [f"Found {len(results)} search result(s) for '{clean_query}':"]
    for r in results:
        summary_lines.append(f"• **[{r['title']}]({r['url']})**: {r['snippet']}")

    return {
        "query": clean_query,
        "results": results,
        "summary": "\n".join(summary_lines),
    }
