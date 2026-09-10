# Neural Void — Site

Static product site at https://neural-void.com, hosted by Cloudflare Pages (`neural-void-site`).

Marketing pages live at the repository root, with shared CSS and JavaScript in `assets/`. The committed production game is preserved from `site/foldwink/`; root `foldwink/` contains development sources.

## Build and check

```powershell
python scripts/build_site.py
python scripts/check_site.py
python scripts/serve_site.py
```

The allowlisted deployment artifact is `.release/public`. Shared marketing asset URLs receive content versions to refresh previously cached CSS and JavaScript.

Deployment, preview acceptance, rollback and evidence requirements are documented in [docs/SITE_RELEASE.md](docs/SITE_RELEASE.md). Deploy only the generated artifact from a clean commit. Do not deploy the repository root.
