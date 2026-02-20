#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path


SCHOLAR_USER_ID = os.getenv('SCHOLAR_USER_ID', 'jVJaA-QAAAAJ')
OUT_PATH = Path('assets/data/publications.json')
OUT_JS_PATH = Path('assets/data/publications.js')

# Manual metadata fixes.
TITLE_OVERRIDES = {
    'State-Feedback Control of a Class of Nonlinear Systems with Neutral Delays': {
        'venue': '2024 International Annual Conference on Complex Systems and Intelligent Science (CSIS-IAC)',
        'year': 2024,
    }
}


def split_authors(author_text: str) -> list[str]:
    if not author_text:
        return []
    return [p.strip() for p in re.split(r'\s+and\s+', author_text) if p.strip()]


def normalize_text(text: str) -> str:
    return re.sub(r'\s+', ' ', (text or '').strip()).casefold()


def fetch_publications() -> dict:
    from scholarly import scholarly  # imported lazily for cleaner local failures

    author = scholarly.search_author_id(SCHOLAR_USER_ID)
    author = scholarly.fill(author, sections=['publications'])

    items = []
    for pub in author.get('publications', []):
        filled = scholarly.fill(pub)
        bib = filled.get('bib', {})

        title = (bib.get('title') or '').strip()
        if not title:
            continue

        year_raw = bib.get('pub_year')
        try:
            year = int(year_raw)
        except Exception:
            year = None

        venue = (bib.get('venue') or bib.get('journal') or bib.get('booktitle') or '').strip()
        authors = split_authors(bib.get('author', ''))
        url = (filled.get('pub_url') or filled.get('eprint_url') or '').strip()

        # Apply title-based overrides.
        for key_title, override in TITLE_OVERRIDES.items():
            if normalize_text(title) == normalize_text(key_title):
                venue = override.get('venue', venue)
                year = override.get('year', year)
                break

        items.append(
            {
                'title': title,
                'authors': authors,
                'year': year,
                'venue': venue,
                'url': url,
                'citations': int(filled.get('num_citations', 0) or 0),
            }
        )

    items.sort(key=lambda x: (x.get('year') or 0, x.get('title') or ''), reverse=True)

    return {
        'scholar_user_id': SCHOLAR_USER_ID,
        'scholar_url': f'https://scholar.google.com/citations?user={SCHOLAR_USER_ID}&hl=en',
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'publications': items,
    }


def main() -> int:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    try:
        data = fetch_publications()
    except Exception as exc:
        # Keep the current JSON if fetch fails in CI (e.g., temporary block).
        if OUT_PATH.exists():
            print(f'[warn] failed to refresh Scholar data: {exc}')
            print('[warn] keeping existing publications.json')
            return 0
        raise

    OUT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    js_body = 'window.PUBLICATIONS_DATA = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n'
    OUT_JS_PATH.write_text(js_body, encoding='utf-8')
    print(f'[ok] wrote {OUT_PATH} and {OUT_JS_PATH} with {len(data.get("publications", []))} publications')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
