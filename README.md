# nianiakoudis-site

## Deploy to GitHub Pages

This repository is configured with a GitHub Actions workflow:
`.github/workflows/deploy-gh-pages.yml`.

### One-time GitHub setup

1. Push this repository to GitHub.
2. Go to `Settings -> Pages`.
3. In `Build and deployment`, set `Source` to `GitHub Actions`.
4. Push to `main` (or run workflow manually from `Actions` tab).

### Notes

- The workflow auto-builds the Blazor WebAssembly app and deploys `wwwroot`.
- It auto-sets `<base href>`:
  - `/<repo-name>/` for project pages
  - `/` for `<owner>.github.io` repositories
- It creates `404.html` from `index.html` so client-side routes work on refresh.
