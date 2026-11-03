/* Clefora : avis clients.
   RÈGLE : uniquement de vrais avis Google, recopiés tels quels (prénom + initiale, note, date, texte).
   Ne JAMAIS inventer ni reformuler un avis. Tant que la liste est vide, le bloc reste masqué.
   Exemple : {nom:"Jeanne D.", note:5, date:"novembre 2026", texte:"…"} */
var AVIS = [];
/* Lien « Laisser un avis » de la fiche Google Business Profile (Accueil > Demander des avis > copier le lien) */
var LIEN_AVIS_GOOGLE = "https://g.page/r/CZdXzfkXbBsnECE/review";
(function(){
  var s=document.getElementById("avis");
  if(!s||!AVIS.length)return;
  var ul=s.querySelector(".avis-liste"),moy=0;
  AVIS.forEach(function(a){
    moy+=a.note;
    var li=document.createElement("li"),n=document.createElement("span"),q=document.createElement("blockquote"),p=document.createElement("p"),c=document.createElement("cite");
    n.className="etoiles";n.textContent="★★★★★".slice(0,a.note)+"☆☆☆☆☆".slice(0,5-a.note);n.setAttribute("aria-label",a.note+" sur 5");
    q.textContent="« "+a.texte+" »";c.textContent=a.nom+" · "+a.date;p.appendChild(c);
    li.appendChild(n);li.appendChild(q);li.appendChild(p);ul.appendChild(li);
  });
  s.querySelector(".avis-moy").textContent=(Math.round(moy/AVIS.length*10)/10).toString().replace(".",",")+" / 5 · "+AVIS.length+" avis Google";
  var l=s.querySelector(".avis-lien");
  if(LIEN_AVIS_GOOGLE){l.href=LIEN_AVIS_GOOGLE;l.hidden=false}
  s.hidden=false;
})();
