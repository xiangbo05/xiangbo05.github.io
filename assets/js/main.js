(() => {
  const menuBtn = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  const themeToggle = document.querySelector('.theme-toggle');
  const themeStorageKey = 'preferred-theme';

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeToggle) {
      const isDark = theme === 'dark';
      themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      themeToggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
  };

  const getStoredTheme = () => {
    try {
      const stored = localStorage.getItem(themeStorageKey);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch (_) {
      return null;
    }
    return null;
  };

  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = getStoredTheme() || (prefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      try {
        localStorage.setItem(themeStorageKey, nextTheme);
      } catch (_) {
        // no-op: storage may be blocked
      }
    });
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('open');
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    revealElements.forEach((el) => {
      observer.observe(el);
      if (el.getBoundingClientRect().top <= window.innerHeight * 0.95) {
        el.classList.add('visible');
        observer.unobserve(el);
      }
    });
  } else {
    revealElements.forEach((el) => el.classList.add('visible'));
  }

  const sectionLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
  if (sectionLinks.length > 0) {
    const sectionMap = sectionLinks
      .map((link) => {
        const id = link.getAttribute('href')?.slice(1) || '';
        return {
          link,
          section: id ? document.getElementById(id) : null
        };
      })
      .filter((item) => item.section);

    const setActive = () => {
      const offsetY = window.scrollY + 120;
      let current = sectionMap[0];

      sectionMap.forEach((item) => {
        if (item.section.offsetTop <= offsetY) {
          current = item;
        }
      });

      sectionLinks.forEach((link) => link.classList.remove('active'));
      if (current?.link) {
        current.link.classList.add('active');
      }
    };

    setActive();
    window.addEventListener('scroll', setActive, { passive: true });
  }

  const now = new Date();
  const currentYear = document.getElementById('current-year');
  const lastUpdated = document.getElementById('last-updated');

  if (currentYear) {
    currentYear.textContent = String(now.getFullYear());
  }

  if (lastUpdated) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
    lastUpdated.textContent = formatter.format(now);
  }
})();
