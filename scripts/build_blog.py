#!/usr/bin/env python3
"""Génère le blog (SEO) : blog/index.html + un fichier par article, et met à jour sitemap.xml.

Usage : python3 scripts/build_blog.py  (depuis la racine du dépôt)
En-tête, formulaire et pied de page sont repris de proprietaires.html : relancer après
toute modification de cette page. Pour ajouter un article : compléter ARTICLES ci-dessous.
Règle : aucun chiffre sans source officielle ou sans être un tarif Clefora.
"""
import json, re, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = "https://clefora.fr/"
TODAY = datetime.date.today().isoformat()

# slug, titre, description, image, date de publication, chapeau, corps HTML
ARTICLES = [
("regle-120-jours-paris",
 "Règle des 120 jours à Paris : ce qui change avec les 90 jours",
 "Louer sa résidence principale sur Airbnb à Paris : la limite est passée de 120 à 90 nuits par an. Numéro d’enregistrement, résidence secondaire, alternatives.",
 "salon-moulures", "2026-11-03",
 "Vous avez entendu parler de la « règle des 120 jours » ? À Paris, elle ne s’applique plus telle quelle : depuis le 1<sup>er</sup> janvier 2025, la Ville limite la location de courte durée d’une résidence principale à 90 nuits par an.",
 """
<h2>D’où vient la règle des 120 jours</h2>
<p>Au niveau national, la loi permet de louer sa <strong>résidence principale</strong> en meublé de tourisme, c’est-à-dire à une clientèle de passage, dans la limite de 120 jours par année civile. Au-delà, le logement n’est plus considéré comme votre résidence principale, puisque vous devez l’occuper au moins huit mois par an.</p>
<p>La loi du 19 novembre 2024, dite loi Le Meur, a permis aux communes d’abaisser ce plafond jusqu’à 90 jours. Paris l’a fait : la limite y est de <strong>90 nuits par an</strong> depuis le 1<sup>er</sup> janvier 2025.</p>

<h2>Ce que vous devez faire concrètement</h2>
<ul>
<li><strong>Déclarer votre meublé</strong> auprès de la Ville et obtenir un numéro d’enregistrement, à afficher sur chaque annonce.</li>
<li><strong>Compter vos nuits</strong> : les plateformes bloquent les réservations au-delà du plafond, mais le total s’apprécie toutes plateformes confondues.</li>
<li><strong>Vérifier votre copropriété et votre bail</strong> : le règlement de copropriété peut encadrer la location touristique, et un locataire doit avoir l’accord écrit de son propriétaire.</li>
</ul>
<p>Les contrôles sont réels et les amendes élevées : la Ville de Paris publie régulièrement ses actions. Pour le détail officiel, consultez la page <a href="https://www.paris.fr/pages/location-limitee-a-90-jours-paris-serre-la-vis-sur-les-meubles-touristiques-29653" rel="noopener" target="_blank">Paris.fr sur la limite des 90 jours</a>.</p>

<h2>Et pour une résidence secondaire ?</h2>
<p>Un logement qui n’est pas votre résidence principale ne peut pas être loué en courte durée à Paris sans <strong>autorisation de changement d’usage</strong>, assortie le plus souvent d’une obligation de compensation. En pratique, cette voie est longue et coûteuse pour un particulier.</p>

<h2>L’alternative : le bail mobilité</h2>
<p>Le bail mobilité n’est pas une location touristique : c’est un bail d’habitation meublé de 1 à 10 mois, pour des locataires en mission, en stage ou en formation. Il n’entre donc pas dans le plafond des 90 nuits et convient aussi bien à une résidence secondaire qu’à un appartement que vous n’occupez pas. Nous l’expliquons dans notre <a href="/blog/bail-mobilite-paris">guide du bail mobilité à Paris</a>.</p>
<p>Beaucoup de propriétaires combinent les deux : courte durée pendant leurs absences, dans la limite légale, et bail mobilité le reste de l’année.</p>
"""),

("bail-mobilite-paris",
 "Bail mobilité à Paris : le guide pour les propriétaires",
 "Bail mobilité à Paris : durée de 1 à 10 mois, locataires éligibles, pas de dépôt de garantie, encadrement des loyers. Tout ce qu’un propriétaire doit savoir.",
 "chambre-claire", "2026-11-03",
 "Créé par la loi ELAN en 2018, le bail mobilité permet de louer un meublé pour quelques mois à des professionnels et étudiants de passage. À Paris, c’est souvent la meilleure façon de rentabiliser un appartement sans les contraintes de la location touristique.",
 """
<h2>Les règles essentielles</h2>
<ul>
<li><strong>Durée</strong> : de 1 à 10 mois. Le bail peut être prolongé une fois par avenant, sans dépasser 10 mois au total. Il n’est pas renouvelable avec le même locataire.</li>
<li><strong>Logement</strong> : obligatoirement meublé, avec la liste d’équipements prévue par la réglementation.</li>
<li><strong>Locataires éligibles</strong> : personnes en formation professionnelle, études supérieures, stage, apprentissage, service civique, mutation ou mission temporaire. La situation doit figurer dans le bail.</li>
<li><strong>Dépôt de garantie</strong> : interdit. Le locataire peut en revanche bénéficier de la garantie Visale.</li>
<li><strong>Préavis</strong> : le locataire peut partir à tout moment avec un mois de préavis. Le propriétaire, lui, ne peut pas résilier avant le terme.</li>
<li><strong>Loyer</strong> : à Paris, l’encadrement des loyers s’applique au bail mobilité comme aux autres baux d’habitation.</li>
</ul>
<p>Source officielle et modèle de contrat : <a href="https://www.anil.org/bail-mobilite/" rel="noopener" target="_blank">ANIL, le bail mobilité</a>.</p>

<h2>Pourquoi c’est intéressant à Paris</h2>
<p>Le bail mobilité échappe au plafond de 90 nuits imposé aux meublés de tourisme (voir notre article sur <a href="/blog/regle-120-jours-paris">la règle des 120 jours</a>) et ne demande pas de changement d’usage. Il convient donc aussi à une résidence secondaire. La demande est portée par les entreprises, les hôpitaux, les universités et les écoles, toute l’année.</p>

<h2>Les points de vigilance</h2>
<ul>
<li>Respecter le loyer de référence majoré de votre quartier.</li>
<li>Soigner l’état des lieux, puisqu’il n’y a pas de dépôt de garantie.</li>
<li>Prévoir la rotation : changement de locataire, ménage, linge et remise en état entre deux baux.</li>
</ul>
<p>C’est précisément ce que prend en charge une conciergerie : recherche des locataires, dossiers, états des lieux, ménage hôtelier entre deux séjours.</p>
"""),

("combien-prend-une-conciergerie-airbnb",
 "Combien prend une conciergerie Airbnb à Paris ?",
 "Commission d’une conciergerie Airbnb : sur quoi elle est calculée, quels frais s’ajoutent, les questions à poser avant de signer. Avec les honoraires Clefora.",
 "salon-portrait", "2026-11-03",
 "Une conciergerie se rémunère presque toujours par une commission sur vos revenus locatifs. Mais deux offres au même pourcentage peuvent vous laisser des revenus très différents : tout dépend de la base de calcul et des frais qui s’ajoutent.",
 """
<h2>Sur quoi la commission est calculée</h2>
<p>Demandez toujours si le pourcentage s’applique :</p>
<ul>
<li>au <strong>montant payé par le voyageur</strong>, frais de ménage compris ;</li>
<li>au <strong>montant versé par la plateforme</strong>, après sa propre commission ;</li>
<li>ou au <strong>loyer net</strong>, hors frais de ménage.</li>
</ul>
<p>Le même pourcentage n’a pas du tout le même poids selon la base retenue.</p>

<h2>Les frais qui s’ajoutent souvent</h2>
<ul>
<li>Frais de mise en service ou de création d’annonce.</li>
<li>Séance photo.</li>
<li>Ménage et linge facturés à part, au propriétaire ou au voyageur.</li>
<li>Consommables (café, produits d’accueil), petites réparations, remise des clés.</li>
<li>Durée d’engagement minimale et frais de résiliation.</li>
</ul>

<h2>Les questions à poser avant de signer</h2>
<ol>
<li>Quel pourcentage, et sur quelle base exacte ?</li>
<li>Quels frais en plus, et qui les paie ?</li>
<li>Qui fait le ménage : une équipe interne formée, ou des sous-traitants différents à chaque séjour ?</li>
<li>Gérez-vous aussi le bail mobilité, pour les périodes hors courte durée ?</li>
<li>Comment suis-je informé des réservations et des versements ?</li>
</ol>

<h2>Nos honoraires</h2>
<p>Chez Clefora, nous avons choisi la simplicité : <strong>20 % en courte durée, 15 % en bail mobilité, rien d’autre</strong>. Clefora fait partie de Made for You, qui loue et accueille les voyageurs, et de Capital Nettoyage, qui assure un ménage de standard hôtelier entre chaque séjour.</p>
<p>Pour voir ce que cela donne pour votre appartement, faites le calcul sur notre <a href="/simulateur">simulateur de revenus</a>.</p>
"""),

("courte-duree-ou-bail-mobilite",
 "Courte durée ou bail mobilité : que choisir pour son appartement à Paris ?",
 "Airbnb ou bail mobilité à Paris : réglementation, revenus, disponibilité du logement, gestion. Comparatif pour choisir la bonne formule, ou combiner les deux.",
 "sejour", "2026-11-03",
 "Vous voulez louer votre appartement parisien meublé, mais vous hésitez entre les voyageurs de passage et les locataires de quelques mois. Les deux formules répondent à des situations différentes, et peuvent se combiner.",
 """
<h2>La courte durée, pour une résidence principale</h2>
<p>La location touristique (Airbnb, Booking…) rapporte généralement plus par nuit, mais à Paris elle est réservée à votre <strong>résidence principale</strong>, dans la limite de <strong>90 nuits par an</strong> (voir <a href="/blog/regle-120-jours-paris">la règle des 120 jours</a>). Elle demande une gestion intense : messages, arrivées, ménage et linge à chaque départ.</p>
<p><strong>Idéal si</strong> vous vous absentez régulièrement (week-ends, vacances, déplacements) et voulez rentabiliser ces périodes.</p>

<h2>Le bail mobilité, pour un logement disponible plusieurs mois</h2>
<p>Bail d’habitation meublé de 1 à 10 mois, il s’adresse aux professionnels et étudiants en mission. Il n’est pas soumis au plafond des 90 nuits et n’exige pas de changement d’usage : il convient donc aussi à une résidence secondaire ou à un appartement vacant. Le loyer suit l’encadrement parisien. Détails dans notre <a href="/blog/bail-mobilite-paris">guide du bail mobilité</a>.</p>
<p><strong>Idéal si</strong> l’appartement n’est pas votre résidence principale, ou si vous voulez des revenus réguliers avec moins de rotations.</p>

<h2>En résumé</h2>
<dl class="terms">
<div><dt>Courte durée</dt><dd>Résidence principale, 90 nuits par an maximum, revenus par nuit plus élevés, gestion à chaque séjour.</dd></div>
<div><dt>Bail mobilité</dt><dd>Tout meublé, de 1 à 10 mois, loyer encadré, revenus plus réguliers, peu de rotations.</dd></div>
</dl>

<h2>Combiner les deux</h2>
<p>Pour une résidence principale, la combinaison est souvent la plus rentable : courte durée pendant vos absences, bail mobilité quand vous partez plusieurs mois. Il faut alors une équipe qui sache gérer les deux, et enchaîner sans temps mort.</p>
<p>C’est ce que fait Clefora avec Made for You et Capital Nettoyage : 20 % en courte durée, 15 % en bail mobilité. Comparez les deux formules pour votre bien sur le <a href="/simulateur">simulateur</a>.</p>
"""),
]

src = (ROOT / "proprietaires.html").read_text(encoding="utf-8")
head_tpl = src.split("<main>")[0]
form = re.search(r'(<section class="s rdv" id="rendez-vous">.*?</section>)', src, re.S).group(1)
footer = src[src.index("<footer>"):]

def esc(s): return s.replace("&", "&amp;").replace('"', "&quot;")
def strip(s): return re.sub(r"<[^>]+>", "", s)
def absolute(html):  # pages dans /blog/ : liens et ressources en chemin absolu
    return re.sub(r'((?:href|src)=")(?!https?:|/|#|mailto:|tel:)', r"\1/", html)

ORG = {"@type": "ProfessionalService", "@id": BASE + "#org", "name": "Clefora", "url": BASE,
       "parentOrganization": [{"@type": "Organization", "name": "Made for You"}, {"@type": "Organization", "name": "Capital Nettoyage"}]}

def head(path, title, desc, img, graph):
    h = head_tpl
    url = BASE + path
    h = re.sub(r"<title>.*?</title>", f"<title>{title} · Clefora</title>", h)
    h = re.sub(r'(<meta (?:name|property)="(?:description|og:description)" content=")[^"]*', lambda m: m.group(1) + esc(desc), h)
    h = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + esc(title), h)
    h = h.replace(BASE + "proprietaires", url)
    h = re.sub(r'(og:image" content="https://clefora.fr/media/)[^"]*', lambda m: m.group(1) + img + ".jpg", h)
    if graph[0]["@type"] == "BlogPosting":
        h = h.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="article">')
    ld = {"@context": "https://schema.org", "@graph": graph + [ORG]}
    h = re.sub(r'<script type="application/ld\+json">.*?</script>', lambda m: '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + "</script>", h, flags=re.S)
    return absolute(h.replace(' aria-current="page"', ""))

def crumbs(*items):
    return {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(items)]}

def hero(img, caps, h1):
    return (f'<main>\n  <section class="stage page-hero" aria-label="{esc(strip(caps))}">\n    <img src="/media/{img}.jpg" alt="" fetchpriority="high">\n'
            f'    <div class="in">\n      <span class="caps late d1" style="animation-delay:.3s">{caps}</span>\n'
            f'      <h1 class="late post-h1" style="animation-delay:.6s">{h1}</h1>\n    </div>\n  </section>\n')

def fr_date(d):
    m = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
    y, mo, da = d.split("-")
    return f"{int(da)} {m[int(mo) - 1]} {y}"

CTA = ('  <aside class="wrap post-cta rv"><span class="caps rose">Votre appartement</span>'
       '<p>Combien rapporterait votre bien en courte durée ou en bail mobilité ?</p>'
       '<p><a class="btn" href="/simulateur">Simuler mes revenus</a> <a class="btn" href="#rendez-vous">Demander une estimation</a></p></aside>\n')

def article(slug, title, desc, img, date, lede, body):
    path = f"blog/{slug}"
    others = "".join(f'<li><a href="/blog/{s}">{t}</a></li>' for s, t, *_ in ARTICLES if s != slug)
    graph = [{"@type": "BlogPosting", "headline": title, "description": desc, "datePublished": date, "dateModified": TODAY,
              "image": f"{BASE}media/{img}.jpg", "url": BASE + path, "inLanguage": "fr-FR",
              "author": {"@id": BASE + "#org"}, "publisher": {"@id": BASE + "#org"}, "mainEntityOfPage": BASE + path},
             crumbs(("Accueil", BASE), ("Conseils", BASE + "blog/"), (title, BASE + path))]
    html = (hero(img, f'<a href="/blog/">Conseils</a> · {fr_date(date)}', title)
      + f'  <article class="s wrap prose">\n    <p class="chapo">{lede}</p>\n{body.strip()}\n'
      + '    <p class="sign">Clefora fait partie de Made for You et Capital Nettoyage. Ces informations sont générales : vérifiez votre situation auprès de la Ville de Paris ou d’un professionnel du droit.</p>\n  </article>\n'
      + CTA
      + f'  <nav class="wrap areas rv" aria-label="Autres articles"><span class="caps rose">À lire aussi</span><ul class="post-more">{others}</ul><p><a href="/blog/">Tous les conseils</a> · <a href="/conciergerie-paris">Nos secteurs</a></p></nav>\n\n  '
      + absolute(form) + "\n</main>\n")
    return head(path, title, desc, img, graph) + html + absolute(footer)

def hub():
    title, desc = "Conseils aux propriétaires parisiens", "Règle des 90 jours, bail mobilité, honoraires de conciergerie : nos conseils pour louer votre appartement à Paris en toute sérénité."
    cards = "".join(f'<li class="rv"><a href="/blog/{s}"><img src="/media/{img}.jpg" alt="" loading="lazy" decoding="async"><span class="caps">{fr_date(d)}</span><h2>{t}</h2><p>{de}</p></a></li>'
                    for s, t, de, img, d, *_ in ARTICLES)
    graph = [{"@type": "Blog", "name": "Conseils Clefora", "url": BASE + "blog/", "publisher": {"@id": BASE + "#org"},
              "blogPost": [{"@type": "BlogPosting", "headline": t, "url": f"{BASE}blog/{s}"} for s, t, *_ in ARTICLES]},
             crumbs(("Accueil", BASE), ("Conseils", BASE + "blog/"))]
    html = (hero("salon-arrondi", "Conseils · Propriétaires", "Louer à Paris, <em>en connaissance de cause</em>.")
      + '  <section class="s wrap manifest">\n    <p class="big rv">Réglementation, bail mobilité, honoraires : <em>les réponses claires aux questions que se posent les propriétaires.</em></p>\n'
      + '    <p class="rv lede">Clefora fait partie de Made for You et Capital Nettoyage.</p>\n  </section>\n'
      + f'  <section class="wrap" style="padding-bottom:clamp(96px,14vw,180px)"><ul class="posts">{cards}</ul></section>\n'
      + CTA + "\n  " + absolute(form) + "\n</main>\n")
    return head("blog/", title, desc, "salon-arrondi", graph) + html + absolute(footer)

(ROOT / "blog").mkdir(exist_ok=True)
(ROOT / "blog" / "index.html").write_text(hub(), encoding="utf-8")
for a in ARTICLES:
    (ROOT / "blog" / f"{a[0]}.html").write_text(article(*a), encoding="utf-8")

sm = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
sm = re.sub(r"<url><loc>https://clefora.fr/blog/[^<]*</loc><lastmod>[^<]*</lastmod></url>\n", "", sm)
add = f"<url><loc>{BASE}blog/</loc><lastmod>{TODAY}</lastmod></url>\n" + "".join(f"<url><loc>{BASE}blog/{a[0]}</loc><lastmod>{TODAY}</lastmod></url>\n" for a in ARTICLES)
(ROOT / "sitemap.xml").write_text(sm.replace("</urlset>", add + "</urlset>"), encoding="utf-8")
print(len(ARTICLES) + 1, "pages blog générées")
