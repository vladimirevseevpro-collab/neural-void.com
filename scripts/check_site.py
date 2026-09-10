"""Check deploy artifact boundaries, local assets, links and SEO documents."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from build_site import OUT


class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
        self.ids = set()
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        for key in ('src', 'href'):
            if key in attrs:
                self.refs.append((tag, attrs[key]))


def main():
    problems = []
    docs = {}
    for page in OUT.rglob('*.html'):
        doc = Document()
        doc.feed(page.read_text(encoding='utf-8'))
        docs[page] = doc
    for page, doc in docs.items():
        # Foldwink is an existing immutable app build, not authored in this change.
        if page.relative_to(OUT).parts[0] == 'foldwink':
            continue
        for tag, raw in doc.refs:
            url = urlsplit(raw)
            if url.scheme or url.netloc or raw == '#':
                continue
            dest = (OUT / unquote(url.path).lstrip('/')) if url.path.startswith('/') else page.parent / unquote(url.path)
            if not url.path:
                dest = page
            if dest.is_dir():
                dest /= 'index.html'
            if not dest.exists() and dest.suffix == '':
                dest = dest.with_suffix('.html')
            if not dest.exists():
                problems.append(f'{page.relative_to(OUT)}: missing {raw}')
            elif url.fragment and dest in docs and unquote(url.fragment) not in docs[dest].ids:
                problems.append(f'{page.relative_to(OUT)}: missing anchor {raw}')
    for path in OUT.rglob('*'):
        if path.is_file() and (any(x.startswith('.') for x in path.relative_to(OUT).parts) or path.suffix in {'.py','.ts','.tsx','.toml','.md'}):
            problems.append(f'Non-public file: {path.relative_to(OUT)}')
    tree = ET.parse(OUT / 'sitemap.xml')
    for loc in tree.findall('.//{*}loc'):
        url = urlsplit(loc.text)
        if url.netloc != 'neural-void.com':
            problems.append(f'Unexpected sitemap host: {loc.text}')
        target = OUT / url.path.lstrip('/')
        if target.is_dir(): target /= 'index.html'
        if not target.is_file(): problems.append(f'Missing sitemap page: {loc.text}')
    if 'Sitemap: https://neural-void.com/sitemap.xml' not in (OUT / 'robots.txt').read_text():
        problems.append('Missing robots sitemap declaration')
    if '/src/main.tsx' in (OUT / 'foldwink/index.html').read_text():
        problems.append('Foldwink development entrypoint in production bundle')
    syntax_checks = 0
    for page in docs:
        if page.relative_to(OUT).parts[0] == 'foldwink':
            continue
        text = page.read_text(encoding='utf-8')
        for index, (attrs, code) in enumerate(re.findall(r'<script\b([^>]*)>(.*?)</script>', text, re.S | re.I)):
            if not code.strip() or 'application/ld+json' in attrs:
                continue
            scratch = OUT.parent / 'syntax-check.js'
            scratch.write_text(code, encoding='utf-8')
            result = subprocess.run(['node', '--check', str(scratch)], capture_output=True, text=True)
            syntax_checks += 1
            if result.returncode:
                problems.append(f'{page.relative_to(OUT)} inline script {index}: {result.stderr}')
    for script in sorted(OUT.rglob('*.js')):
        if script.relative_to(OUT).parts[0] == 'foldwink':
            continue
        result = subprocess.run(['node', '--check', str(script)], capture_output=True, text=True)
        syntax_checks += 1
        if result.returncode:
            problems.append(f'{script.relative_to(OUT)}: {result.stderr}')
    print(json.dumps({'html_pages': len(docs), 'javascript_syntax_checks': syntax_checks, 'problems': problems}, indent=2))
    raise SystemExit(bool(problems))


if __name__ == '__main__': main()
