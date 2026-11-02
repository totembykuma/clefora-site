#!/usr/bin/env python3
"""Génère les pages locales « Conciergerie à … » (SEO) à partir de proprietaires.html.

Usage : python3 scripts/build_quartiers.py  (depuis la racine du dépôt)
Produit conciergerie-paris.html (page d'accueil des quartiers), une page par
arrondissement et par commune proche, et met à jour sitemap.xml.
Relancer après toute modification de proprietaires.html (en-tête, formulaire, pied de page).
"""
import json, re, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = "https://clefora.fr/"
TODAY = datetime.date.today().isoformat()
IMGS = ["salon-arrondi", "salon-moulures", "salon-portrait", "sejour", "chambre-claire", "chambre-bleue", "suite", "entree"]

# slug, nom affiché, code(s) postal(aux), quartiers, métro, public visé
ARR = [
 ("1er", "75001", "le Louvre, le Palais-Royal, les Halles et la place Vendôme", "lignes 1, 4, 7 et 14 (Châtelet, Louvre-Rivoli, Tuileries)", "Au cœur de Paris, chaque nuit se loue à des voyageurs venus pour les musées, les maisons de couture et les grands hôtels voisins."),
 ("2e", "75002", "la Bourse, le Sentier, Montorgueil et les passages couverts", "lignes 3, 4, 8 et 9 (Bourse, Sentier, Grands Boulevards)", "Quartier d’affaires le jour et de restaurants le soir, il attire autant les cadres en mission que les couples en week-end."),
 ("3e", "75003", "le Haut Marais, Arts-et-Métiers et le Temple", "lignes 3, 4, 8 et 11 (Arts et Métiers, Temple, Filles du Calvaire)", "Galeries, créateurs et cafés : le Haut Marais séduit une clientèle internationale qui cherche un Paris authentique."),
 ("4e", "75004", "le Marais, l’île Saint-Louis, l’île de la Cité et Saint-Paul", "lignes 1, 7 et 11 (Saint-Paul, Hôtel de Ville, Pont Marie)", "Entre Seine et hôtels particuliers, les appartements du 4e comptent parmi les plus demandés de la capitale."),
 ("5e", "75005", "le Quartier latin, le Panthéon, Mouffetard et le Jardin des Plantes", "lignes 7 et 10 (Place Monge, Cardinal Lemoine, Maubert-Mutualité)", "Universités et grandes écoles y font vivre le bail mobilité toute l’année, les touristes la courte durée."),
 ("6e", "75006", "Saint-Germain-des-Prés, l’Odéon et le jardin du Luxembourg", "lignes 4, 10 et 12 (Saint-Germain-des-Prés, Odéon, Saint-Sulpice)", "Adresse littéraire et élégante, le 6e accueille une clientèle exigeante qui attend un appartement irréprochable."),
 ("7e", "75007", "les Invalides, le Gros-Caillou, la tour Eiffel et Saint-Thomas-d’Aquin", "lignes 8, 10, 12 et 13 (École Militaire, Rue du Bac, Varenne)", "Ambassades, ministères et vue sur la tour Eiffel : le 7e se loue à des familles et à des voyageurs d’affaires de passage."),
 ("8e", "75008", "les Champs-Élysées, le faubourg Saint-Honoré, la Madeleine et le parc Monceau", "lignes 1, 8, 9, 12, 13 et 14 (George V, Madeleine, Miromesnil)", "Sièges sociaux et maisons de luxe y amènent une clientèle d’affaires fidèle, idéale en bail mobilité comme en courte durée."),
 ("9e", "75009", "l’Opéra, Saint-Georges, la rue des Martyrs et South Pigalle", "lignes 2, 7 et 12 (Saint-Georges, Notre-Dame-de-Lorette, Cadet)", "Entre grands magasins et adresses gourmandes, le 9e plaît aux jeunes actifs comme aux visiteurs du monde entier."),
 ("10e", "75010", "le canal Saint-Martin, le faubourg Saint-Denis et les gares du Nord et de l’Est", "lignes 2, 4, 5 et 7 (Jacques Bonsergent, Château d’Eau, Gare de l’Est)", "La proximité des gares en fait un quartier recherché par les voyageurs européens et les salariés en mission."),
 ("11e", "75011", "Oberkampf, Bastille, Charonne et République", "lignes 2, 3, 5, 8 et 9 (Oberkampf, Parmentier, Voltaire)", "Vivant et bien desservi, le 11e se loue toute l’année, aussi bien aux touristes qu’aux professionnels en bail mobilité."),
 ("12e", "75012", "Bercy, Aligre, Daumesnil et la gare de Lyon", "lignes 1, 6, 8 et 14 (Gare de Lyon, Ledru-Rollin, Daumesnil)", "Avec la gare de Lyon et le bois de Vincennes, le 12e attire familles, congressistes et voyageurs en transit."),
 ("13e", "75013", "la Butte-aux-Cailles, les Gobelins et Paris Rive Gauche", "lignes 5, 6, 7 et 14 (Place d’Italie, Corvisart, Bibliothèque François-Mitterrand)", "Universités, hôpitaux et nouveaux bureaux y créent une forte demande en bail mobilité."),
 ("14e", "75014", "Montparnasse, Denfert-Rochereau, Alésia et Pernety", "lignes 4, 6 et 13 (Denfert-Rochereau, Alésia, Pernety)", "Quartier de vie au calme, le 14e convient aux séjours longs : chercheurs, médecins et étudiants internationaux."),
 ("15e", "75015", "Commerce, Vaugirard, Convention et Beaugrenelle", "lignes 6, 8, 10, 12 et 13 (Commerce, Vaugirard, Convention)", "Le plus grand arrondissement de Paris offre une demande régulière, portée par les salons de la porte de Versailles."),
 ("16e", "75016", "Passy, le Trocadéro, la Muette et Auteuil", "lignes 6, 9 et 10 (Passy, Trocadéro, La Muette)", "Appartements de standing, vue sur la Seine : le 16e attire une clientèle internationale prête à payer l’excellence."),
 ("17e", "75017", "les Batignolles, les Ternes et la plaine Monceau", "lignes 2, 3, 13 et 14 (Rome, Brochant, Pont Cardinet, Ternes)", "Village recherché et proche du quartier d’affaires, le 17e se prête autant à la courte durée qu’au bail mobilité."),
 ("18e", "75018", "Montmartre, les Abbesses, Lamarck et la Goutte-d’Or", "lignes 2, 4, 12, 13 et 14 (Abbesses, Lamarck-Caulaincourt, Marcadet-Poissonniers)", "Montmartre reste l’un des quartiers les plus réservés de Paris, été comme hiver."),
 ("19e", "75019", "les Buttes-Chaumont, le bassin de la Villette et Belleville", "lignes 2, 5, 7, 7 bis et 11 (Buttes Chaumont, Laumière, Jourdain)", "Parc, canal et salles de concert : le 19e séduit une clientèle jeune et des familles en séjour."),
 ("20e", "75020", "Belleville, Ménilmontant, Gambetta et le Père-Lachaise", "lignes 2, 3, 9 et 11 (Gambetta, Pyrénées, Ménilmontant)", "Ateliers d’artistes et vues sur Paris : le 20e offre des loyers attractifs et une demande en hausse."),
]
COM = [
 ("boulogne-billancourt", "Boulogne-Billancourt", "92100", "lignes 9 et 10 (Marcel Sembat, Boulogne-Jean Jaurès, Pont de Saint-Cloud)", "Sièges de groupes et studios de télévision y entretiennent une demande forte en bail mobilité."),
 ("neuilly-sur-seine", "Neuilly-sur-Seine", "92200", "ligne 1 (Les Sablons, Pont de Neuilly)", "À deux pas de La Défense et des Champs-Élysées, Neuilly accueille cadres internationaux et familles en séjour."),
 ("levallois-perret", "Levallois-Perret", "92300", "ligne 3 (Anatole France, Louise Michel, Pont de Levallois)", "Bureaux et appartements récents : Levallois convient parfaitement aux salariés en mission."),
 ("clichy", "Clichy", "92110", "lignes 13 et 14 (Mairie de Clichy, Porte de Clichy)", "Désormais reliée à la ligne 14, Clichy est à quelques minutes du centre de Paris."),
 ("saint-ouen", "Saint-Ouen", "93400", "lignes 13 et 14 (Mairie de Saint-Ouen, Garibaldi)", "Puces, nouveaux quartiers et ligne 14 : Saint-Ouen attire une clientèle curieuse et des professionnels."),
 ("montreuil", "Montreuil", "93100", "ligne 9 (Croix de Chavaux, Mairie de Montreuil, Robespierre)", "Ville d’artistes aux portes de l’est parisien, Montreuil offre de grandes surfaces très demandées."),
 ("vincennes", "Vincennes", "94300", "ligne 1 (Bérault, Château de Vincennes)", "Château, bois et centre-ville commerçant : Vincennes séduit les familles pour des séjours longs."),
 ("montrouge", "Montrouge", "92120", "ligne 4 (Mairie de Montrouge)", "Directement reliée au centre par la ligne 4, Montrouge est prisée des jeunes actifs en mission."),
]

src = (ROOT / "proprietaires.html").read_text(encoding="utf-8")
head_tpl = src.split("<main>")[0]
form = re.search(r'(<section class="s rdv" id="rendez-vous">.*?</section>)', src, re.S).group(1)
footer = src[src.index("<footer>"):]
LOGOS = ('<div class="with rv"><span class="caps">Avec</span>'
         '<img src="media/logo-e090edc58d.png" alt="Made for You" loading="lazy" decoding="async">'
         '<img src="media/logo-8f74bda03c.png" alt="Capital Nettoyage" loading="lazy" decoding="async"></div>')

def esc(s): return s.replace("&", "&amp;").replace('"', "&quot;")

def head(slug, title, desc, img, place):
    h = head_tpl
    url = BASE + slug
    h = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", h)
    h = re.sub(r'(<meta (?:name|property)="(?:description|og:description)" content=")[^"]*', lambda m: m.group(1) + esc(desc), h)
    h = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + esc(title), h)
    h = h.replace(BASE + "proprietaires", url)
    h = re.sub(r'(og:image" content="https://clefora.fr/media/)[^"]*', lambda m: m.group(1) + img + ".jpg", h)
    crumbs = [{"@type": "ListItem", "position": 1, "name": "Accueil", "item": BASE},
              {"@type": "ListItem", "position": 2, "name": "Conciergerie à Paris", "item": BASE + "conciergerie-paris"}]
    if slug != "conciergerie-paris":
        crumbs.append({"@type": "ListItem", "position": 3, "name": place, "item": url})
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Service", "name": f"Conciergerie Airbnb et bail mobilité, {place}", "serviceType": "Gestion locative courte durée et bail mobilité",
         "provider": {"@id": BASE + "#org"}, "areaServed": {"@type": "Place", "name": place}, "url": url},
        {"@type": "ProfessionalService", "@id": BASE + "#org", "name": "Clefora", "url": BASE,
         "parentOrganization": [{"@type": "Organization", "name": "Made for You"}, {"@type": "Organization", "name": "Capital Nettoyage"}]},
        {"@type": "BreadcrumbList", "itemListElement": crumbs}]}
    h = re.sub(r'<script type="application/ld\+json">.*?</script>', '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + "</script>", h, flags=re.S)
    return h.replace(' aria-current="page"', "")

def hero(img, caps, h1):
    return (f'<main>\n  <section class="stage page-hero" aria-label="{esc(caps)}">\n    <img src="media/{img}.jpg" alt="" fetchpriority="high">\n'
            f'    <div class="in">\n      <span class="caps late d1" style="animation-delay:.3s">{caps}</span>\n'
            f'      <h1 class="late" style="animation-delay:.6s">{h1}</h1>\n    </div>\n  </section>\n')

def links(cur):
    a = " · ".join(f'<a href="conciergerie-paris-{s}">{s}</a>' for s, *_ in ARR if s != cur)
    c = " · ".join(f'<a href="conciergerie-{s}">{n}</a>' for s, n, *_ in COM if s != cur)
    return f'<p>Paris {a}</p><p>{c}</p>'

TERMS = ('<dl class="terms rv">\n'
         '      <div><dt>Honoraires</dt><dd>20 % en courte durée, 15 % en bail mobilité. Rien d’autre.</dd></div>\n'
         '      <div><dt>Délais</dt><dd>Estimation sous 24 heures, photographies sous 72 heures.</dd></div>\n'
         '      <div><dt>Condition</dt><dd>Votre bien se trouve à cinq minutes à pied d’une station de métro.</dd></div>\n    </dl>')

def page(slug, place, ou, cp, quartiers, metro, angle, img):
    title = f"Conciergerie Airbnb {place} · Clefora"
    desc = f"Conciergerie Airbnb et bail mobilité {ou} : location, entrée autonome, ménage hôtelier. Honoraires 20 % ou 15 %, estimation sous 24 h."
    q = f"<p>Nous intervenons dans tout {place.replace('Paris ', 'le ')}, notamment {quartiers}.</p>" if quartiers else ""
    body = (hero(img, f"Conciergerie · {place}", f"Votre appartement {ou}, tenu comme <em>une suite</em>.")
      + f'  <section class="s wrap manifest">\n    <p class="big rv">{angle} <em>Nous le louons, vous en recevez les revenus.</em></p>\n    {LOGOS}\n'
      + f'    <p class="rv lede">Clefora fait partie de Made for You et Capital Nettoyage : la conciergerie loue et accueille, le ménage hôtelier entretient.</p>\n  </section>\n'
      + '  <section class="wrap" style="padding-bottom:clamp(96px,14vw,180px)">\n    <div class="trio">\n'
      + f'      <div class="rv"><b>i.</b><h3>Le quartier</h3>{q or "<p>Nous intervenons dans toute la ville, au plus près des stations.</p>"}</div>\n'
      + f'      <div class="rv"><b>ii.</b><h3>Le métro</h3><p>Nous acceptons les biens à cinq minutes à pied d’une station : ici, les {metro}.</p></div>\n'
      + '      <div class="rv"><b>iii.</b><h3>Le service</h3><p>Annonces, voyageurs, entrée autonome, ménage et linge de standard hôtelier entre chaque séjour.</p></div>\n'
      + f'    </div>\n    {TERMS}\n  </section>\n'
      + f'  <nav class="wrap areas rv" aria-label="Autres secteurs"><span class="caps rose">Nous sommes aussi</span>{links(slug.split("-", 2)[-1] if slug.startswith("conciergerie-paris-") else slug[13:])}<p><a href="conciergerie-paris">Tous nos secteurs</a></p></nav>\n\n  '
      + form.replace('placeholder="75008"', f'placeholder="{cp}"') + "\n</main>\n")
    return head(slug, title, desc, img, place) + body + footer

def hub():
    slug = "conciergerie-paris"
    title = "Conciergerie Airbnb à Paris et proche banlieue · Clefora"
    desc = "Conciergerie Airbnb et bail mobilité dans les 20 arrondissements de Paris et la proche banlieue desservie par le métro. Honoraires 20 % ou 15 %."
    arr = "".join(f'<li><a href="conciergerie-paris-{s}">Paris {s}</a></li>' for s, *_ in ARR)
    com = "".join(f'<li><a href="conciergerie-{s}">{n}</a></li>' for s, n, *_ in COM)
    body = (hero("salon-moulures", "Conciergerie · Paris et proche banlieue", "Paris, <em>arrondissement par arrondissement</em>.")
      + '  <section class="s wrap manifest">\n    <p class="big rv">Partout où le métro vous mène à cinq minutes, nous louons et entretenons votre appartement. <em>Vous n’avez qu’à en recevoir les revenus.</em></p>\n'
      + f'    {LOGOS}\n    <p class="rv lede">Clefora fait partie de Made for You et Capital Nettoyage.</p>\n  </section>\n'
      + f'  <section class="wrap areas hub" style="padding-bottom:clamp(96px,14vw,180px)">\n    <div class="rv"><h2>Paris</h2><ul>{arr}</ul></div>\n    <div class="rv"><h2>Proche banlieue</h2><ul>{com}</ul></div>\n    {TERMS}\n  </section>\n\n  '
      + form + "\n</main>\n")
    return head(slug, title, desc, "salon-moulures", "Paris et proche banlieue") + body + footer

out = {"conciergerie-paris": hub()}
for i, (s, cp, q, m, a) in enumerate(ARR):
    n = "1er" if s == "1er" else s
    out[f"conciergerie-paris-{s}"] = page(f"conciergerie-paris-{s}", f"Paris {n}", f"dans le {n} arrondissement", cp, q, m, a, IMGS[i % len(IMGS)])
for i, (s, n, cp, m, a) in enumerate(COM):
    ou = f"à {n}"
    out[f"conciergerie-{s}"] = page(f"conciergerie-{s}", n, ou, cp, "", m, a, IMGS[(i + 3) % len(IMGS)])
for slug, html in out.items():
    (ROOT / f"{slug}.html").write_text(html, encoding="utf-8")

# sitemap : pages existantes conservées, pages locales régénérées
sm = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
sm = re.sub(r"<url><loc>https://clefora.fr/conciergerie-[^<]*</loc><lastmod>[^<]*</lastmod></url>\n", "", sm)
add = "".join(f"<url><loc>{BASE}{s}</loc><lastmod>{TODAY}</lastmod></url>\n" for s in out)
(ROOT / "sitemap.xml").write_text(sm.replace("</urlset>", add + "</urlset>"), encoding="utf-8")
print(len(out), "pages générées")
