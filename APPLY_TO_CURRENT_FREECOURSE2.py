from pathlib import Path
import sys

root = Path(sys.argv[1] if len(sys.argv)>1 else ".")
target = root / "freecourse2" / "index.html"
if not target.exists():
    raise SystemExit("freecourse2/index.html not found in: " + str(root.resolve()))

html = target.read_text(encoding="utf-8")
tag = '<script src="/freecourse2-tracking-v300.js?v=20260929-v300"></script>'
if tag in html:
    print("V300 tracker is already installed.")
elif "</body>" in html.lower():
    pos = html.lower().rfind("</body>")
    html = html[:pos] + tag + "\n" + html[pos:]
    target.write_text(html, encoding="utf-8")
    print("Installed V300 tracker into freecourse2/index.html")
else:
    html += "\n" + tag + "\n"
    target.write_text(html, encoding="utf-8")
    print("Installed V300 tracker at end of freecourse2/index.html")
