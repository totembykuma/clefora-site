"""Construit linkedin/flux.xml : un article RSS par post dont la date est arrivée (heure de Paris).
Un Zap Zapier gratuit (RSS → page LinkedIn) publie chaque nouvel article ; le guid par jour évite les doublons."""
import json
from datetime import datetime
from email.utils import format_datetime
from xml.sax.saxutils import escape
from zoneinfo import ZoneInfo

BASE = "https://clefora.fr"
data = json.load(open("linkedin/posts.json", encoding="utf-8"))
paris = ZoneInfo("Europe/Paris")
now = datetime.now(paris)
items = []
for p in sorted(data["posts"], key=lambda p: p["date"], reverse=True):
    quand = datetime.fromisoformat(f"{p['date']}T{data['heure']}").replace(tzinfo=paris)
    if quand > now:
        continue
    items.append(f"<item><title>{escape(p['texte'].split(chr(10), 1)[0])}</title><link>{BASE}/</link>"
                 f"<guid isPermaLink=\"false\">clefora-linkedin-{p['date']}</guid><pubDate>{format_datetime(quand)}</pubDate>"
                 f"<description>{escape(p['texte'])}</description></item>")
    if len(items) == 10:
        break
open("linkedin/flux.xml", "w", encoding="utf-8").write(
    '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Clefora · posts LinkedIn</title>'
    f"<link>{BASE}/</link><description>Posts du jour</description>" + "".join(items) + "</channel></rss>\n")
print(len(items), "post(s) dans le flux")
