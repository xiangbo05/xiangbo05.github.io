(() => {
  const selectedMount = document.getElementById('selected-publications-list');
  const allMount = document.getElementById('all-publications-list');

  if (!selectedMount && !allMount) {
    return;
  }

  loadPublications()
    .then((resp) => {
      const data = resp;
      const publications = Array.isArray(data.publications) ? data.publications.slice() : [];
      publications.sort((a, b) => {
        const ay = Number(a.year || 0);
        const by = Number(b.year || 0);
        if (ay !== by) {
          return by - ay;
        }
        return String(a.title || '').localeCompare(String(b.title || ''));
      });

      if (selectedMount) {
        selectedMount.innerHTML = publications.slice(0, 4).map(renderCard).join('');
      }

      if (allMount) {
        const preprints = publications.filter(isPreprint);
        const published = publications.filter((item) => !isPreprint(item));
        allMount.innerHTML = [
          { title: 'Published Papers', items: published },
          { title: 'Preprints', items: preprints }
        ]
          .map((group) => renderTypeSection(group.title, group.items))
          .filter(Boolean)
          .join('');
      }
    })
    .catch(() => {
      const fallback =
        '<div class="card contact-card"><p>Publications could not be loaded automatically. Please visit <a href="https://scholar.google.com/citations?user=jVJaA-QAAAAJ&amp;hl=en" target="_blank" rel="noreferrer">Google Scholar</a>.</p></div>';
      if (selectedMount) {
        selectedMount.innerHTML = fallback;
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

  function groupByYear(items) {
    return items.reduce((acc, item) => {
      const y = String(item.year || 'Unknown');
      if (!acc[y]) {
        acc[y] = [];
      }
      acc[y].push(item);
      return acc;
    }, {});
  }

  function isPreprint(item) {
    const venue = String(item.venue || '').toLowerCase();
    return venue.includes('arxiv');
  }

  function renderTypeSection(title, items) {
    if (!items.length) {
      return '';
    }

    const grouped = groupByYear(items);
    const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

    return `
      <section class="pub-type">
        <h2 class="pub-type-title">${escapeHtml(title)}</h2>
        ${years
          .map((year) => {
            return `
              <section class="pub-year">
                <h3>${escapeHtml(year)}</h3>
                <div class="paper-grid">
                  ${grouped[year].map(renderCard).join('')}
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

    const venueParts = [item.year, item.venue].filter(Boolean);
    const venue = venueParts.join(' | ');

    const paperLink = item.url
      ? `<a href="${escapeAttr(item.url)}" target="_blank" rel="noreferrer">[Paper]</a>`
      : '';

    return `
      <article class="paper-card">
        <h3>${escapeHtml(item.title || '')}</h3>
        <p class="authors">${authorHtml}</p>
        <p class="venue">${escapeHtml(venue)}</p>
        <div class="paper-links">${paperLink}</div>
      </article>
    `;
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
    return String(value).replace(/"/g, '&quot;');
  }
})();
