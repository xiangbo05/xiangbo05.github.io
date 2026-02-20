<<<<<<< HEAD
# Academic Personal Website

Current structure:

- Home: About, Education, Projects, Publications, Service, CV
- Projects page
- Publications page

## Local preview

```bash
cd /Users/xiangbozhang/Personal_Web
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Assets

- Avatar: `assets/img/avatar.png`
- CV PDF: `assets/docs/Xiangbo_CV_Jan11.pdf`

## Publications auto-update (Google Scholar)

- Scholar source: `https://scholar.google.com/citations?user=jVJaA-QAAAAJ&hl=en`
- Data files used by pages: `assets/data/publications.json` and `assets/data/publications.js`
- Fetch script: `scripts/update_publications.py`
- GitHub Actions workflow: `.github/workflows/update-publications.yml`

Run locally:

```bash
python3 scripts/update_publications.py
```

## Deploy to GitHub Pages

1. Create repo `xiangbozhang.github.io` (recommended)
2. Push code:

```bash
git init
git add .
git commit -m "Update personal academic website"
git branch -M main
git remote add origin git@github.com:xiangbozhang/xiangbozhang.github.io.git
git push -u origin main
```

3. GitHub: `Settings -> Pages`
4. Set `Deploy from a branch`, branch `main`, folder `/ (root)`
5. Open `https://xiangbozhang.github.io`
=======
# xiangbo05.github.io
>>>>>>> origin/main
