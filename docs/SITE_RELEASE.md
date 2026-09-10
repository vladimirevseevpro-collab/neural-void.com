# Marketing site release procedure

## Source and public boundary

The canonical marketing sources are the repository-root HTML pages and `assets/`.
`site/` is a historical mirror; only its committed **Foldwink production build** is
used by this release pipeline. Do not deploy the whole repository or the root
`foldwink/` development project. Do not rebuild or replace the game as part of a
marketing-site change.

```
python scripts/build_site.py
python scripts/check_site.py
python scripts/serve_site.py
```

The first command recreates only `.release/public/`, using an explicit public
allowlist of tracked files. It also writes a local SHA-256 manifest and public
`release.json` identifying the commit and whether the source was dirty.
Only `.release/public/` may be uploaded. Source files, secrets, reports, tooling,
archives and other products' workspaces are excluded.

## Acceptance

From a clean committed source, build and run the checks. Deploy a preview on the
existing Cloudflare Pages project `neural-void-site`, using a non-main branch and
the exact Git commit as deployment metadata. Inspect the actual preview at
1440×900, 1024×768 and 390×844, zoom 100%, including header, hero, catalog and
footer. Check representative product, support, security and 404 pages.

Exercise scope demo/reset, mobile navigation/Escape/resize, keyboard focus,
anchor links, language controls, Verbum FAQ, and product/pilot destinations.
Check overflow, clipping, text wrapping and focus visually as well as in DOM.
Mail links do not establish inbox deliverability; no test email is sent unless
separately authorized. A simulated demo does not establish product performance.

Record the preview URL, tested commit, checks, screenshots and any deferred
gates in a release evidence record before production. Existing application
functionality and independent certifications are outside this marketing patch.

## Deploy and identify

Use the existing Cloudflare credentials through environment variables only.
Do not save tokens in scripts, reports, Git, or command arguments.

```
npx wrangler@4.130.0 pages deploy .release/public --project-name=neural-void-site --branch=site-acceptance-20260910 --commit-hash=<verified-commit>
```

After preview acceptance, deploy the same artifact with `--branch=main`.
Confirm success through the Cloudflare API and compare the deployment commit
with `/release.json`. Check production key pages, robots, sitemap, missing-path
HTTP 404, and no-store/revalidation headers. Shared CSS/JS filenames must never
be cached as immutable because their contents change between releases.

## Rollback, backup and monitoring

Before deployment record the existing production deployment ID and URL. Retain
that Cloudflare deployment and the Git commit. Roll back through Cloudflare Pages
to the recorded successful production deployment if navigation, asset loading or
the product entrypoints regress. Verify `/`, product links, Foldwink and HTTP
status after rollback. The marketing site has no application database or form
storage; restoring it requires the Git/public asset artifact, not a database
restore. Existing app storage is outside this release.

For post-release monitoring, inspect Cloudflare deployment status plus HTTP and
browser smoke checks. This procedure does not create an unattended uptime monitor
or promise 24/7 staffing. Record the observed result and any remaining limitations.
