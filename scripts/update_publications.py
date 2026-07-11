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

# Manual publication metadata that is not available from Google Scholar.
MANUAL_PUBLICATION_METADATA = {
    'UniHash: Unifying Pointwise and Pairwise Hashing Paradigms for Seen and Unseen Category Retrieval': {
        'type': 'preprint',
        'recordType': 'Preprint',
        'tags': ['CV'],
        'firstAuthor': False,
        'url': 'https://arxiv.org/abs/2601.09828',
    },
    'Memory Dial: A Training Framework for Controllable Memorization in Language Models': {
        'type': 'peer-reviewed',
        'recordType': 'Conference Paper',
        'acceptanceRate': '18%',
        'tags': ['LLMs'],
        'firstAuthor': True,
        'url': 'https://arxiv.org/abs/2604.05074',
        'venue': 'Findings of the Association for Computational Linguistics: ACL 2026',
        'links': [
            {'label': 'View arXiv', 'url': 'https://arxiv.org/abs/2604.05074'},
            {'label': 'Official', 'url': 'https://aclanthology.org/2026.findings-acl.179/'},
        ],
    },
    'Stable and Explainable Personality Trait Evaluation in Large Language Models with Internal Activations': {
        'type': 'peer-reviewed',
        'recordType': 'Conference Paper',
        'acceptanceRate': '18%',
        'tags': ['LLMs'],
        'firstAuthor': False,
        'url': 'https://arxiv.org/abs/2601.09833',
        'venue': 'Findings of the Association for Computational Linguistics: ACL 2026',
        'links': [
            {'label': 'View arXiv', 'url': 'https://arxiv.org/abs/2601.09833'},
            {'label': 'Official', 'url': 'https://aclanthology.org/2026.findings-acl.803/'},
        ],
    },
    'Grounding Latent Algorithm Routing in Transformer Reasoning': {
        'authors': ['Xiangbo Zhang', 'Xiaoxu Ma'],
        'year': 2026,
        'venue': 'Conference on Language Modeling (COLM)',
        'type': 'peer-reviewed',
        'recordType': 'Conference Paper',
        'acceptanceRate': '29%',
        'tags': ['LLMs'],
        'firstAuthor': True,
    },
    'Logical Matrix Factorization towards Robust Stabilization of Boolean Control Networks with Function Perturbation': {
        'authors': ['Haitao Li', 'Wenrong Li', 'Guodong Zhao', 'Xiangbo Zhang', 'Yuanhua Wang'],
        'year': 2026,
        'venue': 'IFAC World Congress 2026',
        'type': 'peer-reviewed',
        'recordType': 'Invited Session Paper',
        'tags': ['Control Theory'],
        'firstAuthor': False,
    },
    'Input-Envelope-Output: Auditable Generative Music Rewards in Sensory-Sensitive Contexts': {
        'type': 'peer-reviewed',
        'recordType': 'Conference Paper',
        'venue': 'ACM Conference on Human Factors in Computing Systems (CHI)',
        'acceptanceRate': '38.4%',
        'tags': ['HCI'],
        'firstAuthor': False,
        'url': 'https://arxiv.org/abs/2602.22813',
        'links': [
            {'label': 'View arXiv', 'url': 'https://arxiv.org/abs/2602.22813'},
            {'label': 'Official', 'url': 'https://dl.acm.org/doi/10.1145/3772363.3798580'},
        ],
    },
    'Global Output Regulation for Uncertain Feedforward Nonlinear Systems With Unknown Nonlinear Growth Rate': {
        'type': 'peer-reviewed',
        'recordType': 'Journal Article',
        'acceptanceRate': '25%',
        'tags': ['Control Theory'],
        'firstAuthor': False,
        'url': 'https://onlinelibrary.wiley.com/doi/abs/10.1002/rnc.7862',
    },
    'Discrete Wavelet Transform-Based Capsule Network for Hyperspectral Image Classification': {
        'type': 'preprint',
        'recordType': 'Preprint',
        'tags': ['CV'],
        'firstAuthor': False,
        'url': 'https://arxiv.org/abs/2501.04643',
    },
    'State-Feedback Control of a Class of Nonlinear Systems with Neutral Delays': {
        'venue': '2024 International Annual Conference on Complex Systems and Intelligent Science (CSIS-IAC)',
        'year': 2024,
        'type': 'peer-reviewed',
        'recordType': 'Conference Paper',
        'tags': ['Control Theory'],
        'firstAuthor': True,
        'url': 'https://ieeexplore.ieee.org/abstract/document/10919404/',
    },
}

MANUAL_ONLY_PUBLICATIONS = [
    {
        'title': 'Grounding Latent Algorithm Routing in Transformer Reasoning',
        'authors': ['Xiangbo Zhang', 'Xiaoxu Ma'],
        'year': 2026,
        'venue': 'Conference on Language Modeling (COLM)',
        'type': 'peer-reviewed',
        'recordType': 'Conference Paper',
        'acceptanceRate': '29%',
        'tags': ['LLMs'],
        'firstAuthor': True,
        'citations': 0,
    },
    {
        'title': 'Logical Matrix Factorization towards Robust Stabilization of Boolean Control Networks with Function Perturbation',
        'authors': ['Haitao Li', 'Wenrong Li', 'Guodong Zhao', 'Xiangbo Zhang', 'Yuanhua Wang'],
        'year': 2026,
        'venue': 'IFAC World Congress 2026',
        'type': 'peer-reviewed',
        'recordType': 'Invited Session Paper',
        'tags': ['Control Theory'],
        'firstAuthor': False,
        'citations': 0,
    },
]


def split_authors(author_text: str) -> list[str]:
    if not author_text:
        return []
    return [p.strip() for p in re.split(r'\s+and\s+', author_text) if p.strip()]


def normalize_text(text: str) -> str:
    return re.sub(r'\s+', ' ', (text or '').strip()).casefold()


def get_manual_metadata(title: str) -> dict:
    normalized_title = normalize_text(title)
    for key_title, metadata in MANUAL_PUBLICATION_METADATA.items():
        if normalize_text(key_title) == normalized_title:
            return metadata
    return {}


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

        item = {
            'title': title,
            'authors': authors,
            'year': year,
            'venue': venue,
            'url': url,
            'citations': int(filled.get('num_citations', 0) or 0),
        }
        item.update(get_manual_metadata(title))
        items.append(item)

    seen_titles = {normalize_text(item.get('title', '')) for item in items}
    for manual_item in MANUAL_ONLY_PUBLICATIONS:
        title = manual_item.get('title', '')
        if title and normalize_text(title) not in seen_titles:
            items.append(dict(manual_item))

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
