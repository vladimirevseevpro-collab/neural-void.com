"""Assemble public assets only; preserve the committed Foldwink production build."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.release' / 'public'
PAGES = {'atlassian', 'jira-dlp-firewall', 'lab', 'privacy', 'security',
         'smart-defaults-dod', 'sprint-scope-guard', 'support', 'terms', 'verbum'}
TOP = {'index.html', '404.html', '_headers', '_redirects', 'robots.txt', 'sitemap.xml'}
EXTENSIONS = {'.html', '.css', '.js', '.json', '.webmanifest', '.svg', '.png', '.jpg',
              '.jpeg', '.webp', '.ico', '.woff', '.woff2', '.wav', '.mp3', '.ogg'}


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()


def public_target(name):
    path = Path(name)
    if name in TOP:
        return path
    if name.startswith('site/foldwink/'):
        relative = path.relative_to('site')
        if path.suffix.lower() in EXTENSIONS and not any(p.startswith('.') for p in relative.parts):
            return relative
    if path.parts[0] in PAGES | {'assets'} and path.suffix.lower() in EXTENSIONS:
        return path
    return None


def main():
    # Fixed, verified descendant only; never accept an arbitrary deletion target.
    assert OUT.resolve() == ROOT.resolve() / '.release' / 'public'
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    manifest = {}
    for name in git('ls-files').splitlines():
        target = public_target(name)
        if target is None:
            continue
        source = ROOT / name
        if source.is_symlink() or not source.is_file():
            raise RuntimeError(f'Invalid public source: {name}')
        dest = OUT / target
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, dest)
    # Existing visitors may still have the formerly immutable shared assets cached.
    for asset in ('assets/css/style.css', 'assets/js/main.js'):
        version = hashlib.sha256((OUT / asset).read_bytes()).hexdigest()[:12]
        for page in OUT.rglob('*.html'):
            if page.relative_to(OUT).parts[0] == 'foldwink':
                continue
            content = page.read_text(encoding='utf-8')
            content = content.replace('/' + asset + '"', '/' + asset + '?v=' + version + '"')
            page.write_text(content, encoding='utf-8')
    for dest in sorted(OUT.rglob('*')):
        if dest.is_file():
            manifest[dest.relative_to(OUT).as_posix()] = hashlib.sha256(dest.read_bytes()).hexdigest()
    release = {'commit': git('rev-parse', 'HEAD'), 'source_dirty': bool(git('status', '--porcelain')),
               'asset_manifest_sha256': hashlib.sha256(json.dumps(manifest, sort_keys=True).encode()).hexdigest()}
    (OUT / 'release.json').write_text(json.dumps(release, indent=2) + '\n', encoding='utf-8')
    (OUT.parent / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'output': str(OUT), 'files': len(manifest), **release}))


if __name__ == '__main__':
    main()
