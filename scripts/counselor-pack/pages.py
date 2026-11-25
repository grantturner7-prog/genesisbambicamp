"""Finds the page each sheet starts on in the PDF, for the contents list."""
import subprocess, re, json, sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from content import thu, fri, sat, sun, front
pdf = os.path.abspath(HERE + '/../../docs/planning/camp-wow-counselor-pack.pdf')
n = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout).group(1))
titles = {s['id']: s['title'] for s in [front.ROUTINE] + thu.SHEETS + fri.SHEETS + sat.SHEETS + sun.SHEETS + sun.RAIN}
txt = [subprocess.run(['pdftotext', '-f', str(i), '-l', str(i), '-layout', pdf, '-'], capture_output=True, text=True).stdout for i in range(1, n + 1)]
pages = {}
for sid, t in titles.items():
    for i, pg in enumerate(txt):
        if i > 4 and any(l.strip().startswith(t[:40]) for l in pg.split('\n')[:14]):
            pages[sid] = i + 1
            break
old = json.load(open(HERE + '/out/pages.json')) if os.path.exists(HERE + '/out/pages.json') else {}
json.dump(pages, open(HERE + '/out/pages.json', 'w'))
print('pages', n, '| sheets found', len(pages), 'of', len(titles), '| changed' if old != pages else '| stable')
