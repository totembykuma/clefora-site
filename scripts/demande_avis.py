#!/usr/bin/env python3
"""E-mail de demande d'avis Google, à envoyer après chaque signature.

Usage : python3 scripts/demande_avis.py "Prénom" email@client.fr "Made for You" [--relance]
Écrit sur la sortie un JSON {to, subject, html, text}, à envoyer depuis la boîte Gmail connectée
(un destinataire par message). Le lien Google est lu dans avis.js (LIEN_AVIS_GOOGLE).
"""
import html, json, pathlib, re, sys

args = [a for a in sys.argv[1:] if not a.startswith("--")]
relance = "--relance" in sys.argv
if len(args) != 3:
    sys.exit(__doc__)
prenom, mail, maison = args
lien = re.search(r'LIEN_AVIS_GOOGLE\s*=\s*"([^"]*)"', (pathlib.Path(__file__).parent.parent / "avis.js").read_text()).group(1)
if not lien:
    sys.exit("LIEN_AVIS_GOOGLE est vide dans avis.js : ajouter le lien de la fiche Google d'abord.")

if relance:
    sujet = "Votre avis compte beaucoup pour nous · Clefora"
    intro = f"Je me permets un petit rappel : si vous avez une minute, votre avis sur votre mise en relation avec {maison} nous aiderait beaucoup."
else:
    sujet = "Merci pour votre confiance · Clefora"
    intro = f"Merci de nous avoir fait confiance. Votre contrat avec {maison} est signé, et nous espérons que cette mise en relation vous a été utile."
corps = "Pourriez-vous nous laisser un avis sur Google ? Cela prend une minute et aide d'autres propriétaires et hôteliers à nous trouver."
e = html.escape
page = f"""<!doctype html><html><body style="margin:0;background:#F2EEEA">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2EEEA"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4dcd6">
<tr><td style="background:#4A1E26;padding:28px 36px;font:24px Georgia,serif;letter-spacing:8px;color:#F2EEEA">CLEFORA</td></tr>
<tr><td style="padding:36px;font:15px/1.7 Helvetica,Arial,sans-serif;color:#2B2B2B">
<p style="margin:0 0 16px">Bonjour {e(prenom)},</p>
<p style="margin:0 0 16px">{e(intro)}</p>
<p style="margin:0 0 28px">{e(corps)}</p>
<p style="margin:0 0 28px"><a href="{e(lien)}" style="display:inline-block;background:#4A1E26;color:#F2EEEA;text-decoration:none;padding:16px 28px;font:12px Helvetica,Arial,sans-serif;letter-spacing:3px;text-transform:uppercase">Laisser un avis Google</a></p>
<p style="margin:0">Merci, et à bientôt,<br>William · Clefora<br><span style="color:#6B6262;font-size:13px">Clefora fait partie de Made for You et Capital Nettoyage.</span></p>
</td></tr></table></td></tr></table></body></html>"""
texte = f"Bonjour {prenom},\n\n{intro}\n\n{corps}\n\n{lien}\n\nMerci, et à bientôt,\nWilliam · Clefora\nClefora fait partie de Made for You et Capital Nettoyage."
print(json.dumps({"to": mail, "subject": sujet, "html": page, "text": texte}, ensure_ascii=False))
