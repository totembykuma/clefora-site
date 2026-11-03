/* Clefora : script à coller dans le Google Sheet privé des leads (Extensions > Apps Script).
   Appelé par le site après chaque paiement Stripe. Il envoie les coordonnées du lead à l'acheteur
   (depuis ton Gmail), t'en met une copie et écrit « oui » dans la colonne VENDU.
   Réglage : Paramètres du projet > Propriétés du script > TOKEN = le même texte que SHEET_SCRIPT_TOKEN chez Cloudflare.
   Ce fichier ne contient aucune donnée personnelle. */

var ONGLET = "Hors 75 leads";
var COL_CP = 5, COL_ACCORD = 17, COL_VENDU = 18; // E, Q, R (le numéro du lead = numéro de ligne)

function doPost(e) {
  var q = JSON.parse(e.postData.contents);
  var props = PropertiesService.getScriptProperties();
  if (!q.token || q.token !== props.getProperty("TOKEN")) return out({ refus: "jeton" });
  var moi = props.getProperty("COPIE") || Session.getEffectiveUser().getEmail();

  if (q.action !== "livrer") {
    MailApp.sendEmail(moi, "Clefora : " + (q.action === "rembourse" ? (q.rembourse ? "lead remboursé" : "REMBOURSEMENT À FAIRE") : "alerte paiement"),
      JSON.stringify(q, null, 2).replace(/"token": ".*",?\n/, ""));
    return out({ ok: true });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = SpreadsheetApp.getActive().getSheetByName(ONGLET), id = Number(q.lead);
    if (!sh || !(id >= 2) || id > sh.getLastRow()) return out({ refus: "Lead N° " + q.lead + " introuvable" });
    var head = sh.getRange(1, 1, 1, COL_ACCORD - 1).getDisplayValues()[0];
    var row = sh.getRange(id, 1, 1, COL_VENDU).getDisplayValues()[0];
    var cp = String(row[COL_CP - 1]).trim();
    if (/^75/.test(cp)) return out({ refus: "Lead de Paris : jamais revendu" });
    if (String(row[COL_ACCORD - 1]).trim().toLowerCase() !== "oui") return out({ refus: "Lead sans accord de transmission" });
    if (String(row[COL_VENDU - 1]).trim().toLowerCase() === "oui") return out({ refus: "Lead déjà vendu" });

    var lignes = [];
    for (var i = 0; i < head.length; i++) if (head[i] && row[i]) lignes.push([head[i], row[i]]);
    var html = "<p>Bonjour" + (q.nom ? " " + esc(q.nom) : "") + ",</p><p>Merci pour votre achat. Voici les coordonnées du lead N° " + id + " :</p>"
      + "<table style='border-collapse:collapse'>" + lignes.map(function (l) {
        return "<tr><td style='padding:4px 12px 4px 0;color:#777'>" + esc(l[0]) + "</td><td style='padding:4px 0'><b>" + esc(l[1]) + "</b></td></tr>";
      }).join("") + "</table><p>Ce lead vous est vendu à vous seul. Une réclamation (coordonnées fausses, hors zone, déjà client) se signale sous 7 jours en répondant à cet e-mail.</p><p>Clefora · Made for You et Capital Nettoyage</p>";
    var texte = "Lead N° " + id + "\n\n" + lignes.map(function (l) { return l[0] + " : " + l[1]; }).join("\n");

    MailApp.sendEmail({ to: q.email, bcc: moi, replyTo: moi, name: "Clefora", subject: "Votre lead Clefora N° " + id + " (" + cp + ")", htmlBody: html, body: texte });
    sh.getRange(id, COL_VENDU).setValue("oui");
    return out({ ok: true });
  } finally { lock.releaseLock(); }
}

function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
