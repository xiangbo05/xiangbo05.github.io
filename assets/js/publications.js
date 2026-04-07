(() => {
  const selectedMount = document.getElementById('selected-publications-list');
  const dashboardMount = document.getElementById('publication-dashboard');
  const controlsMount = document.getElementById('publication-controls');
  const allMount = document.getElementById('all-publications-list');

  if (!selectedMount && !dashboardMount && !controlsMount && !allMount) {
    return;
  }

  const TOPIC_ORDER = ['LLMs', 'CV', 'HCI', 'Control Theory'];

  const state = {
    tag: 'all'
  };
  let allPublications = [];

  loadPublications()
    .then((resp) => {
      allPublications = Array.isArray(resp.publications) ? resp.publications.slice().map(normalizePublication) : [];
      allPublications.sort(sortPublications);

      if (controlsMount) {
        controlsMount.addEventListener('click', handleToolbarClick);
      }

      render();
    })
    .catch(() => {
      const fallback =
        '<div class="contact-card"><p>Publications could not be loaded automatically. Please visit <a href="https://scholar.google.com/citations?user=jVJaA-QAAAAJ&amp;hl=en" target="_blank" rel="noreferrer">Google Scholar</a>.</p></div>';

      if (selectedMount) {
        selectedMount.innerHTML = fallback;
      }
      if (dashboardMount) {
        dashboardMount.innerHTML = fallback;
      }
      if (controlsMount) {
        controlsMount.innerHTML = '';
      }
      if (allMount) {
        allMount.innerHTML = fallback;
      }
    });

  async function loadPublications() {
    try {
      const resp = await fetch('assets/data/publications.json', { cache: 'no-store' });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      return await resp.json();
    } catch (_) {
      if (window.PUBLICATIONS_DATA && Array.isArray(window.PUBLICATIONS_DATA.publications)) {
        return window.PUBLICATIONS_DATA;
      }
      throw _;
    }
  }

  function render() {
    if (selectedMount) {
      selectedMount.innerHTML = allPublications.slice(0, 4).map(renderCard).join('');
    }

    if (dashboardMount) {
      dashboardMount.innerHTML = renderDashboard(allPublications);
    }

    const filteredPublications = getFilteredPublications(allPublications);

    if (controlsMount) {
      controlsMount.innerHTML = renderControls(allPublications, filteredPublications);
    }

    if (allMount) {
      allMount.innerHTML = renderResults(filteredPublications);
    }
  }

  function handleToolbarClick(event) {
    const button = event.target.closest('button[data-tag]');
    if (!button) {
      return;
    }

    if (button.dataset.tag) {
      state.tag = button.dataset.tag;
      render();
    }
  }

  function normalizePublication(item) {
    const venue = String(item.venue || '');
    const inferredType = venue.toLowerCase().includes('arxiv') ? 'preprint' : 'peer-reviewed';

    return {
      ...item,
      type: item.type || inferredType,
      recordType: item.recordType || (inferredType === 'preprint' ? 'Preprint' : 'Publication'),
      tags: Array.isArray(item.tags) ? item.tags : [],
      firstAuthor: Boolean(item.firstAuthor),
      links: normalizeLinks(item.links, item.url)
    };
  }

  function getFilteredPublications(items) {
    return items.filter((item) => {
      if (state.tag !== 'all' && !item.tags.includes(state.tag)) {
        return false;
      }

      return true;
    });
  }

  function groupByYear(items) {
    return items.reduce((acc, item) => {
      const year = String(item.year || 'Unknown');
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(item);
      return acc;
    }, {});
  }

  function getAllTags(items) {
    const available = new Set(items.flatMap((item) => item.tags || []));
    return TOPIC_ORDER.filter((tag) => available.has(tag));
  }

  function renderDashboard(items) {
    const peerReviewed = items.filter((item) => item.type === 'peer-reviewed').length;
    const preprints = items.filter((item) => item.type === 'preprint').length;
    const grouped = groupByYear(items);
    const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));
    const maxCount = years.reduce((max, year) => Math.max(max, grouped[year].length), 1);

    return `
      <section class="pub-dashboard">
        <div class="stats-grid stats-grid-publications">
          <article class="stat-card stat-card-emphasis">
            <span class="stat-number">${peerReviewed}</span>
            <span class="stat-label">Peer-Reviewed Papers</span>
          </article>
          <article class="stat-card">
            <span class="stat-number">${preprints}</span>
            <span class="stat-label">Preprints</span>
          </article>
        </div>
        <article class="timeline-card">
          <div class="section-heading">
            <h2>Publication Timeline</h2>
            <p>${items.length} total records</p>
          </div>
          <div class="timeline-list">
            ${years
              .map((year) => {
                const count = grouped[year].length;
                const width = Math.max((count / maxCount) * 100, 14);
                return `
                  <div class="timeline-row">
                    <span class="timeline-year">${escapeHtml(year)}</span>
                    <div class="timeline-track" aria-label="${escapeHtml(year)} publications">
                      <span class="timeline-bar" style="width: ${width}%">
                        <span class="timeline-value">${count}</span>
                      </span>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </article>
      </section>
    `;
  }

  function renderControls(items, filteredItems) {
    const tags = getAllTags(items);
    const topicButtons = [
      `<button type="button" class="filter-chip ${state.tag === 'all' ? 'active' : ''}" data-tag="all">All Publications</button>`,
      ...tags.map(
        (tag) =>
          `<button type="button" class="filter-chip ${state.tag === tag ? 'active' : ''}" data-tag="${escapeAttr(
            tag
          )}">${escapeHtml(tag)}</button>`
      )
    ].join('');

    return `
      <article class="publication-toolbar">
        <div class="toolbar-head">
          <div>
            <h2>Browse Publications</h2>
            <p>${filteredItems.length} shown of ${items.length} records</p>
          </div>
        </div>
        <div class="filter-group" aria-label="Filter by topic">
          ${topicButtons}
        </div>
      </article>
    `;
  }

  function renderResults(items) {
    if (!items.length) {
      return `
        <article class="empty-state">
          <h2>No publications match this filter.</h2>
          <p>Try another research area.</p>
        </article>
      `;
    }

    const grouped = groupByYear(items);
    const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

    return `
      <section class="publication-results">
        ${years
          .map((year) => {
            const yearItems = grouped[year];
            const label = yearItems.length === 1 ? 'publication' : 'publications';
            return `
              <section class="pub-year-block">
                <div class="pub-year-header">
                  <h2>${escapeHtml(year)}</h2>
                  <p>${yearItems.length} ${label}</p>
                </div>
                <div class="publication-list">
                  ${yearItems.map(renderCard).join('')}
                </div>
              </section>
            `;
          })
          .join('')}
      </section>
    `;
  }

  function renderCard(item) {
    const authors = Array.isArray(item.authors) ? item.authors : [];
    const authorHtml = authors
      .map((name) => (isSelf(name) ? `<strong>${escapeHtml(name)}</strong>` : escapeHtml(name)))
      .join(', ');
    const badges = [
      `<span class="badge ${item.type === 'preprint' ? 'badge-preprint' : 'badge-reviewed'}">${
        item.type === 'preprint' ? 'Preprint' : 'Peer Reviewed'
      }</span>`
    ];
    const tags = Array.isArray(item.tags) ? item.tags : [];

    if (item.firstAuthor) {
      badges.push('<span class="badge badge-first-author">First Author</span>');
    }
    if (item.status) {
      badges.push(`<span class="badge badge-status">${escapeHtml(item.status)}</span>`);
    }
    if (item.acceptanceRate) {
      badges.push(`<span class="badge badge-accent">Acceptance Rate ${escapeHtml(item.acceptanceRate)}</span>`);
    }

    const paperLinks = Array.isArray(item.links)
      ? item.links
          .map(
            (link) =>
              `<a href="${escapeAttr(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`
          )
          .join('')
      : '';
    const meta = [item.recordType, item.year].filter(Boolean).map(escapeHtml).join(' • ');

    return `
      <article class="publication-card">
        <div class="publication-badges">
          ${badges.join('')}
        </div>
        <h3>${escapeHtml(item.title || '')}</h3>
        <p class="authors">${authorHtml}</p>
        <p class="publication-venue">${escapeHtml(item.venue || '')}</p>
        <p class="publication-meta">${meta}</p>
        <div class="tag-row">
          ${tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('')}
        </div>
        <div class="paper-links">${paperLinks}</div>
      </article>
    `;
  }

  function normalizeLinks(links, fallbackUrl) {
    const normalized = Array.isArray(links)
      ? links
          .map((link) => {
            const url = String(link?.url || '').trim();
            if (!url) {
              return null;
            }

            const label = String(link?.label || '').trim() || getPaperLinkLabel(url);
            return { label, url };
          })
          .filter(Boolean)
      : [];

    if (normalized.length) {
      return normalized;
    }

    const url = String(fallbackUrl || '').trim();
    return url ? [{ label: getPaperLinkLabel(url), url }] : [];
  }

  function getPaperLinkLabel(url) {
    if (/programs\.sigchi\.org/i.test(url)) {
      return 'Official program';
    }
    return /arxiv\.org/i.test(url) ? 'View arXiv' : 'View paper';
  }

  function sortPublications(a, b) {
    const ay = Number(a.year || 0);
    const by = Number(b.year || 0);
    if (ay !== by) {
      return by - ay;
    }

    if (a.type !== b.type) {
      return a.type === 'peer-reviewed' ? -1 : 1;
    }

    return String(a.title || '').localeCompare(String(b.title || ''));
  }

  function isSelf(name) {
    return /xiangbo\s+zhang/i.test(name);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }
})();
