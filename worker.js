// Flux RSS LinkedIn généré à la demande (heure de Paris) : plus besoin de l'Action GitHub,
// dont les crons partaient avec des heures de retard. Tout le reste du site = fichiers statiques.
import data from "./linkedin/posts.json";

const BASE = "https://clefora.fr";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Décalage de Paris (« +01:00 » ou « +02:00 ») pour une date donnée
function offsetParis(d) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", timeZoneName: "longOffset" })
    .formatToParts(d).find((x) => x.type === "timeZoneName").value; // « GMT+01:00 »
  return p === "GMT" ? "+00:00" : p.slice(3);
}

// Instant réel correspondant à « date à heure, heure de Paris »
function instantParis(date, heure) {
  const approx = new Date(`${date}T${heure}:00Z`);
  return new Date(`${date}T${heure}:00${offsetParis(approx)}`);
}

const JOURS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MOIS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function rfc822(date, heure) {
  const [y, m, j] = date.split("-").map(Number);
  const jour = JOURS[new Date(Date.UTC(y, m - 1, j)).getUTCDay()];
  const off = offsetParis(instantParis(date, heure)).replace(":", "");
  return `${jour}, ${String(j).padStart(2, "0")} ${MOIS[m - 1]} ${y} ${heure}:00 ${off}`;
}

export function flux(now = new Date()) {
  const items = [];
  for (const p of [...data.posts].sort((a, b) => b.date.localeCompare(a.date))) {
    if (instantParis(p.date, data.heure) > now || p.date < (data.debut || "")) continue; // rien avant la date de reprise
    const img = `${BASE}/linkedin/visuels/${p.date}.jpg`;
    // guid = URL du visuel : Zapier la passe telle quelle dans le champ Image (et elle reste unique par jour)
    items.push(`<item><title>${esc(p.texte.split("\n")[0])}</title><link>${BASE}${p.lien || "/"}</link>`
      + (p.visuel ? `<enclosure url="${img}" type="image/jpeg" length="0"/>` : "")
      + `<guid isPermaLink="false">${p.visuel ? img : "clefora-linkedin-" + p.date}</guid><pubDate>${rfc822(p.date, data.heure)}</pubDate>`
      + `<description>${esc(p.texte)}</description></item>`);
    if (items.length === 10) break;
  }
  return '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Clefora · posts LinkedIn</title>'
    + `<link>${BASE}/</link><description>Posts du jour</description>${items.join("")}</channel></rss>\n`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/linkedin/flux.xml") {
      return new Response(flux(), {
        headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=300" },
      });
    }
    return env.ASSETS.fetch(request);
  },
};
