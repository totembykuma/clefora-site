"""Alertes acheteurs : envoie un e-mail aux conciergeries abonnées quand un lead de leur département
apparaît dans bourse.js. Lancé par .github/workflows/alertes.yml après chaque mise à jour de la bourse.

Secrets GitHub (jamais dans le code public) :
  ALERTES_ABONNES  une ligne par abonné : e-mail;départements  (ex. contact@x.fr;75,92,93  ou  y@z.fr;*)
  SMTP_USER        adresse Gmail d'envoi (ex. clefora.leads@gmail.com)
  SMTP_PASS        mot de passe d'application Gmail (16 caractères)
Usage : python3 scripts/alertes_leads.py <commit avant> [--test]
        python3 scripts/alertes_leads.py <commit avant> --export abonnes.txt sortie.json
        (sans SMTP : écrit les e-mails à envoyer en JSON, pour un envoi via la boîte Gmail connectée à Claude)
"""
import json, os, re, smtplib, subprocess, sys, html, time
from email.message import EmailMessage
from email.utils import formataddr, make_msgid

SITE = "https://clefora.fr/partenaires"
STRIPE = "https://buy.stripe.com/cNi28r62UaN55o9cVmgMw00"


def leads(src):
    m = re.search(r"var leads=(\[.*?\]),SHOW", src, re.S)
    return {l["id"]: l for l in json.loads(m.group(1))} if m else {}


def dep(cp):
    return cp[:3] if cp.startswith("97") else cp[:2]


def abonnes(txt):
    out = []
    for ligne in txt.splitlines():
        if ";" not in ligne or ligne.strip().startswith("#"):
            continue
        mail, deps = ligne.split(";", 1)
        mail = mail.strip().lower()
        if re.fullmatch(r"[^\s@]+@[^\s@]+\.[a-z]{2,}", mail):
            out.append((mail, {d.strip().upper() for d in deps.split(",") if d.strip()}))
    return out


def corps(liste, mail):
    desab = f"mailto:{os.environ['SMTP_USER']}?subject=D%C3%A9sabonnement%20alertes%20Clefora&body={mail}"
    lignes = "".join(
        f'<tr><td style="padding:18px 0;border-bottom:1px solid #e4dcd6;font:28px Georgia,serif;color:#4A1E26">{html.escape(l["cp"])}</td>'
        f'<td style="padding:18px 16px;border-bottom:1px solid #e4dcd6;font:13px Helvetica,Arial,sans-serif;color:#6b6260">Reçu le {html.escape(l["date"])}<br>{html.escape(l["src"])} · 79 €</td>'
        f'<td style="padding:18px 0;border-bottom:1px solid #e4dcd6;text-align:right"><a href="{STRIPE}?client_reference_id=lead-{int(l["id"])}" '
        f'style="font:600 11px Helvetica,Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#4A1E26">Acheter · N° {int(l["id"])}</a></td></tr>'
        for l in liste)
    n = len(liste)
    return f"""<!doctype html><html><body style="margin:0;background:#F2EEEA">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2EEEA"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #e4dcd6">
<tr><td style="background:#4A1E26;padding:28px 36px;font:22px Georgia,serif;letter-spacing:.3em;color:#F2EEEA">CLEFORA</td></tr>
<tr><td style="padding:36px">
<p style="margin:0 0 6px;font:600 10px Helvetica,Arial,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#8C4A55">Alerte bourse</p>
<p style="margin:0 0 24px;font:30px/1.2 Georgia,serif;color:#2B2B2B">{n} propriétaire{'s' if n > 1 else ''} <i>près de chez vous</i>.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e4dcd6">{lignes}</table>
<p style="margin:28px 0 0;font:14px/1.6 Helvetica,Arial,sans-serif;color:#6b6260">Chaque contact est qualifié et confié à une seule conciergerie : le premier paiement l’emporte.
<a href="{SITE}" style="color:#4A1E26">Voir la bourse</a> · <a href="https://clefora.fr/conditions-leads" style="color:#4A1E26">Conditions de vente</a></p>
</td></tr>
<tr><td style="padding:20px 36px;border-top:1px solid #e4dcd6;font:11.5px/1.6 Helvetica,Arial,sans-serif;color:#9a908d">
Vous recevez cette alerte car vous l’avez demandée sur clefora.fr. <a href="{desab}" style="color:#8C4A55">Se désabonner</a>.<br>
Clefora · fait partie de Made for You et Capital Nettoyage · Paris</td></tr>
</table></td></tr></table></body></html>""", desab


def main():
    avant, test = sys.argv[1], "--test" in sys.argv
    neuf = leads(open("bourse.js", encoding="utf-8").read())
    try:
        ancien = leads(subprocess.run(["git", "show", f"{avant}:bourse.js"], capture_output=True, text=True, check=True).stdout)
    except subprocess.CalledProcessError:
        ancien = neuf  # commit précédent introuvable : on n'envoie rien plutôt que de tout renvoyer
    nouveaux = [l for i, l in neuf.items() if i not in ancien and re.fullmatch(r"\d{5}", l["cp"]) and l["cp"] != "88888"]
    if test and not nouveaux:
        nouveaux = list(neuf.values())[:2]
    print(f"{len(nouveaux)} nouveau(x) lead(s)")
    if not nouveaux:
        return
    if "--export" in sys.argv:
        i = sys.argv.index("--export")
        os.environ.setdefault("SMTP_USER", "william@capitalnettoyage.fr")
        out = []
        for mail, deps in abonnes(open(sys.argv[i + 1], encoding="utf-8").read()):
            choix = [l for l in nouveaux if "*" in deps or dep(l["cp"]) in deps]
            if choix:
                page, _ = corps(choix, mail)
                n = len(choix)
                out.append({"to": mail, "subject": f"{n} nouveau{'x' if n > 1 else ''} propriétaire{'s' if n > 1 else ''} dans votre secteur · Clefora", "html": page,
                            "text": "Nouveaux propriétaires disponibles :\n" + "\n".join(f"- {l['cp']} (reçu le {l['date']}), N° {l['id']}" for l in choix) + f"\n\nVoir la bourse : {SITE}\nSe désabonner : répondez « désabonnement »."})
        json.dump(out, open(sys.argv[i + 2], "w", encoding="utf-8"), ensure_ascii=False)
        print(f"{len(out)} e-mail(s) écrit(s) dans {sys.argv[i + 2]}")
        return
    if not os.environ.get("SMTP_USER") or not os.environ.get("SMTP_PASS"):
        print("SMTP_USER / SMTP_PASS absents : aucun envoi.")
        return
    liste = abonnes(os.environ.get("ALERTES_ABONNES", ""))
    if test:
        liste = [(os.environ["SMTP_USER"], {"*"})]
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
        s.login(os.environ["SMTP_USER"], os.environ["SMTP_PASS"])
        envoyes = 0
        for mail, deps in liste:
            choix = [l for l in nouveaux if "*" in deps or dep(l["cp"]) in deps]
            if not choix:
                continue
            page, desab = corps(choix, mail)
            m = EmailMessage()
            m["Subject"] = f"{len(choix)} nouveau{'x' if len(choix) > 1 else ''} propriétaire{'s' if len(choix) > 1 else ''} dans votre secteur · Clefora"
            m["From"] = formataddr(("Clefora", os.environ["SMTP_USER"]))
            m["To"] = mail
            m["Message-ID"] = make_msgid(domain="clefora.fr")
            m["List-Unsubscribe"] = f"<{desab}>"
            m.set_content("Nouveaux propriétaires disponibles :\n" + "\n".join(f"- {l['cp']} (reçu le {l['date']}), N° {l['id']}" for l in choix) + f"\n\nVoir la bourse : {SITE}\nSe désabonner : répondez « désabonnement ».")
            m.add_alternative(page, subtype="html")
            s.send_message(m)
            envoyes += 1
            time.sleep(1)
    print(f"{envoyes} alerte(s) envoyée(s)")


if __name__ == "__main__":
    main()
