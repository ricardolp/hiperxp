import json
import re
from pathlib import Path

p = Path(
    r"C:\Users\ricar\.cursor\projects\d-Projetos-hiperxp\agent-transcripts"
    r"\db986df5-55bd-47c2-b5c0-ccc00e64c662"
    r"\db986df5-55bd-47c2-b5c0-ccc00e64c662.jsonl"
)
out = Path("tools/_badge-script-extract.txt")
chunks = []
for line in p.open(encoding="utf-8"):
    if "ImageDraw" not in line or "python -c" not in line:
        continue
    if "badge" not in line.lower() and "LANCZOS" not in line:
        continue
    # pull command field
    try:
        obj = json.loads(line)
    except Exception:
        continue
    msg = obj.get("message", {})
    content = msg.get("content", [])
    if not isinstance(content, list):
        continue
    for part in content:
        if part.get("type") != "tool_use":
            continue
        cmd = (part.get("input") or {}).get("command") or ""
        if "ImageDraw" in cmd and ("badge" in cmd.lower() or "ellipse" in cmd):
            chunks.append(cmd)

out.write_text("\n\n=====\n\n".join(chunks[:3]), encoding="utf-8")
print("wrote", out, "chunks", len(chunks))
