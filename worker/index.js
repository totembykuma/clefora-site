/* Clefora : livraison automatique des leads achetés.
   - /acheter/N   : vérifie que le lead N est libre, le réserve 30 min, puis envoie vers le paiement Stripe (79 €).
   - /api/vendus  : liste publique des numéros vendus ou réservés (bourse.js les masque). Aucun autre champ.
   - /api/stripe  : webhook Stripe. Paiement reçu : le lead passe « vendu » (une seule fois, atomique),
                    puis le script Google du Sheet privé envoie les coordonnées à l'acheteur et coche « VENDU ».
                    Lead déjà vendu à quelqu'un d'autre : remboursement automatique.
   Aucune donnée personnelle ici : les coordonnées restent dans le Google Sheet privé de William.
   Secrets (wrangler secret put / tableau de bord Cloudflare) : STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY,
   SHEET_SCRIPT_URL, SHEET_SCRIPT_TOKEN. */

import { DurableObject } from "cloudflare:workers";

const PAY_URL = "https://buy.stripe.com/cNi28r62UaN55o9cVmgMw00"; // lien public 79 € (déjà affiché sur le site)
const HOLD_MS = 30 * 60 * 1000;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;
    const bourse = () => env.BOURSE.get(env.BOURSE.idFromName("bourse"));

    const m = p.match(/^\/acheter\/(\d{1,6})\/?$/);
    if (m && req.method === "GET") {
      const r = await bourse().reserve(+m[1]);
      if (!r.ok) return Response.redirect(url.origin + "/partenaires?vendu=" + m[1] + "#bourse", 303);
      return Response.redirect(PAY_URL + "?client_reference_id=lead-" + m[1], 303);
    }

    if (p === "/api/vendus" && req.method === "GET") {
      return new Response(JSON.stringify(await bourse().taken()), {
        headers: { "content-type": "application/json", "cache-control": "no-store" },
      });
    }

    if (p === "/api/stripe" && req.method === "POST") {
      const body = await req.text();
      if (!(await stripeSigOk(body, req.headers.get("stripe-signature") || "", env.STRIPE_WEBHOOK_SECRET)))
        return new Response("signature", { status: 400 });
      const ev = JSON.parse(body);
      if (ev.type !== "checkout.session.completed" && ev.type !== "checkout.session.async_payment_succeeded")
        return new Response("ignoré");
      const s = ev.data.object;
      if (s.payment_status !== "paid") return new Response("en attente");
      const id = +String(s.client_reference_id || "").replace(/^lead-/, "");
      const email = s.customer_details && s.customer_details.email;
      if (!id || !email) {
        await notify(env, { action: "alerte", motif: "Paiement sans numéro de lead ou sans e-mail", session: s.id });
        return new Response("sans lead");
      }

      const r = await bourse().sell(id, s.id);
      if (r.state === "delivered") return new Response("déjà livré");
      if (r.state === "taken") return refund(env, s, id, email, "Lead N° " + id + " déjà vendu");

      // Livraison par le script du Sheet privé (e-mail à l'acheteur + copie William + colonne VENDU = oui)
      const d = await notify(env, { action: "livrer", lead: id, email, nom: (s.customer_details.name || ""), session: s.id, montant: s.amount_total });
      if (d.ok) { await bourse().delivered(id); return new Response("livré"); }
      if (d.refus) return refund(env, s, id, email, d.refus); // introuvable, Paris (75), sans accord ou déjà vendu : le lead reste masqué
      return new Response("livraison échouée", { status: 500 }); // Stripe renverra l'événement plus tard
    }

    return env.ASSETS.fetch(req);
  },
};

async function notify(env, data) {
  if (!env.SHEET_SCRIPT_URL) return {};
  try {
    const r = await fetch(env.SHEET_SCRIPT_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: env.SHEET_SCRIPT_TOKEN, ...data }),
    });
    return await r.json();
  } catch (e) { return {}; }
}

async function refund(env, s, id, email, motif) {
  let ok = false;
  if (env.STRIPE_SECRET_KEY && s.payment_intent) {
    const r = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: { authorization: "Bearer " + env.STRIPE_SECRET_KEY, "content-type": "application/x-www-form-urlencoded", "idempotency-key": "refund-" + s.id },
      body: "payment_intent=" + encodeURIComponent(s.payment_intent),
    });
    ok = r.ok;
  }
  await notify(env, { action: "rembourse", lead: id, email, motif, rembourse: ok, session: s.id });
  return new Response(ok ? "remboursé" : "à rembourser à la main");
}

async function stripeSigOk(body, header, secret) {
  if (!secret) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=")).filter((x) => x.length === 2 && x[0] !== "v1"));
  const sigs = header.split(",").filter((x) => x.startsWith("v1=")).map((x) => x.slice(3));
  const t = +parts.t;
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(t + "." + body)));
  const hex = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some((s) => s.length === hex.length && [...s].reduce((a, c, i) => a | (c.charCodeAt(0) ^ hex.charCodeAt(i)), 0) === 0);
}

/* Registre des ventes : une seule instance, donc aucune double vente possible (opérations atomiques). */
export class Bourse extends DurableObject {
  async reserve(id) {
    const v = await this.ctx.storage.get("l" + id);
    if (v && (v.sold || v.until > Date.now())) return { ok: false };
    await this.ctx.storage.put("l" + id, { until: Date.now() + HOLD_MS });
    return { ok: true };
  }
  async sell(id, session) {
    const v = await this.ctx.storage.get("l" + id);
    if (v && v.sold) return { state: v.session === session ? (v.delivered ? "delivered" : "sold") : "taken" };
    await this.ctx.storage.put("l" + id, { sold: true, session, at: Date.now() });
    return { state: "sold" };
  }
  async delivered(id) {
    const v = await this.ctx.storage.get("l" + id);
    if (v) { v.delivered = true; await this.ctx.storage.put("l" + id, v); }
  }
  async taken() {
    const all = await this.ctx.storage.list({ prefix: "l" });
    const now = Date.now(), out = [];
    for (const [k, v] of all) if (v.sold || v.until > now) out.push(+k.slice(1));
    return out;
  }
}
