/* Concierge Clefora : assistant guidé (règles + mots-clés), gratuit, sans service tiers.
   Qualifie le visiteur puis envoie la demande par Web3Forms, comme le formulaire du site. */
(function(){
  "use strict";
  var KEY_CAPITAL="75f0b8b4-63fd-4f63-b4e1-7ea272593b71",KEY_MFY="d46879e2-0d24-4c07-8ddc-430a89f83e86";
  var BOOK="https://calendar.google.com/calendar/appointments/schedules/AcZssZ19p-XRw6DHfBLPKKoHdhRiLhGFMdUIKILHLs0DaoYWiAEFn2NY4NinHK8IGGSyq4xHcgd0jCD3";
  var css=document.createElement("link");css.rel="stylesheet";css.href="assistant.css";document.head.appendChild(css);

  var KEY_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><circle cx="12" cy="12" r="10.5"/><circle cx="12" cy="10" r="2.4"/><path d="M11 12.2 10.2 17h3.6L13 12.2"/></svg>';
  var btn=document.createElement("button");btn.className="cg-open";btn.type="button";btn.setAttribute("aria-haspopup","dialog");
  btn.innerHTML=KEY_ICON+"<span>Concierge</span>";
  var box=document.createElement("div");box.className="cg";box.setAttribute("role","dialog");box.setAttribute("aria-label","Concierge Clefora");box.setAttribute("aria-modal","false");
  box.innerHTML='<div class="cg-head"><div><b>Le concierge</b><small>Clefora · réponse immédiate</small></div><button class="cg-x" type="button" aria-label="Fermer">×</button></div>'+
    '<div class="cg-log" aria-live="polite"></div>'+
    '<form class="cg-form" autocomplete="on"><input type="text" name="q" placeholder="Votre question…" aria-label="Votre message" maxlength="200"><input type="text" name="website" tabindex="-1" autocomplete="off" hidden><button type="submit">Envoyer</button></form>';
  /* Caché tant que assistant.css n'est pas chargé : évite le flash du panneau à l'arrivée sur la page */
  btn.style.display=box.style.display="none";
  css.onload=function(){btn.style.display=box.style.display=""};
  document.body.appendChild(btn);document.body.appendChild(box);
  var log=box.querySelector(".cg-log"),form=box.querySelector(".cg-form"),inp=form.q,started=false,t0=0,sending=false;

  function scroll(){log.scrollTop=log.scrollHeight}
  function say(html,cb){var d=document.createElement("div");d.className="cg-dots";d.innerHTML="<i></i><i></i><i></i>";log.appendChild(d);scroll();
    setTimeout(function(){d.remove();var m=document.createElement("div");m.className="cg-m b";m.innerHTML=html;log.appendChild(m);scroll();if(cb)cb()},Math.min(1100,350+html.length*6))}
  function me(t){var m=document.createElement("div");m.className="cg-m u";m.textContent=t;log.appendChild(m);scroll()}
  function chips(list){var c=document.createElement("div");c.className="cg-chips";
    list.forEach(function(o){var e;
      if(o.href){e=document.createElement("a");e.href=o.href;e.target="_blank";e.rel="noopener";if(o.fill)e.className="fill"}
      else{e=document.createElement("button");e.type="button";e.onclick=function(){c.remove();me(o.t);o.go()}}
      e.textContent=o.t;c.appendChild(e)});
    log.appendChild(c);scroll()}
  function clearChips(){log.querySelectorAll(".cg-chips").forEach(function(c){if(!c.querySelector("a"))c.remove()})}

  /* ---------- Parcours de qualification ---------- */
  var lead={},flow=null,step=0,wait=null;
  var FLOWS={
    prop:{profil:"Propriétaire",key:KEY_MFY,steps:[
      {k:"code_postal",ask:"Avec plaisir. Quel est le <em>code postal</em> de votre bien ?",text:/^\d{5}$/,err:"Un code postal à cinq chiffres, s’il vous plaît.",after:zone},
      {k:"surface",ask:"Quelle est sa taille ?",opts:["Studio","2 pièces","3 pièces","4 pièces et plus"]},
      {k:"formule",ask:"Quelle location envisagez-vous ?",opts:["Courte durée","Bail mobilité","Je ne sais pas encore"]},
      {k:"metro",skip:paris,ask:"À combien de minutes à pied se trouve la station de métro la plus proche ?",opts:["5 minutes ou moins","Plus de 5 minutes","Je ne sais pas"]},
      {k:"disponibilite",ask:"Quand le bien sera-t-il disponible ?",opts:["Dès maintenant","D’ici 3 mois","Plus tard"]}]},
    hotel:{profil:"Hôtel / conciergerie",key:KEY_CAPITAL,steps:[
      {k:"etablissement",ask:"Avec plaisir. Vous êtes…",opts:["Un hôtel","Une conciergerie","Une résidence"]},
      {k:"volume",ask:"Combien de chambres ou d’appartements à entretenir ?",opts:["Moins de 10","10 à 30","Plus de 30"]},
      {k:"linge",ask:"Souhaitez-vous que nous fournissions le linge ?",opts:["Avec linge","Sans linge","À discuter"]},
      {k:"code_postal",ask:"Le <em>code postal</em> de votre établissement ?",text:/^\d{5}$/,err:"Un code postal à cinq chiffres, s’il vous plaît."}]},
    part:{profil:"Conciergerie partenaire",key:KEY_MFY,steps:[
      {k:"code_postal",ask:"Bienvenue. Quel est le <em>code postal</em> de votre agence ?",text:/^\d{5}$/,err:"Un code postal à cinq chiffres, s’il vous plaît."},
      {k:"biens_geres",ask:"Combien de logements gérez-vous aujourd’hui ?",opts:["Moins de 20","20 à 100","Plus de 100"]}]}
  };
  var CONTACT=[
    {k:"nom",ask:"Merci. À quel nom puis-je transmettre votre demande ?",text:/^.{2,80}$/,err:"Votre prénom et votre nom, s’il vous plaît."},
    {k:"telephone",ask:"Et le numéro où vous rappeler ?",text:/^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/,err:"Un numéro français, par exemple 06 12 34 56 78."},
    {k:"rgpd",skip:paris,ask:"Dernière chose : acceptez-vous d’être recontacté et que votre demande soit transmise à un partenaire de Clefora, qui rémunère cette mise en relation ? <a href=\"confidentialite\">En savoir plus</a>.",opts:["J’accepte","Je refuse"]}];

  /* Paris intramuros : pas de question métro ni de consentement (demande traitée en direct) */
  function paris(){return lead.profil==="Propriétaire"&&/^75/.test(lead.code_postal||"")}
  function zone(v){var d=v.slice(0,2);
    if(d==="75"||d==="92"||d==="93"||d==="94"){lead.zone="Paris et proche banlieue";return "Parfait, c’est dans notre zone."}
    lead.zone="Hors zone";return "Ce secteur est hors de Paris : nous confierons votre bien à une conciergerie partenaire de votre région."}
  function start(name){flow=FLOWS[name];lead={profil:flow.profil};step=0;t0=t0||Date.now();ask()}
  function cur(){var s=flow.steps.concat(CONTACT);return s[step]}
  function ask(){var s=cur();if(!s)return send();if(s.skip&&s.skip()){step++;return ask()}
    say(s.ask,function(){
      if(s.opts)chips(s.opts.map(function(o){return{t:o,go:function(){answer(o)}}}));
      else{wait=s;inp.placeholder=s.k==="telephone"?"06 12 34 56 78":s.k==="code_postal"?"75015":"Prénom et nom";inp.inputMode=s.k==="nom"?"text":"numeric";inp.focus()}})}
  function answer(v){var s=cur();
    if(s.k==="rgpd"&&v!=="J’accepte"){flow=null;say("Bien entendu, rien ne sera transmis. Vous pouvez toujours nous écrire via le formulaire ou poser une question ici.");return}
    if(s.text&&!s.text.test(v)){say(s.err,function(){wait=s;inp.focus()});return}
    lead[s.k]=v;step++;
    var note=s.after&&s.after(v);if(note)say(note,ask);else ask()}

  function score(){if(lead.profil!=="Propriétaire")return"";var n=0;
    if(lead.zone!=="Hors zone")n+=40;if(lead.metro==="5 minutes ou moins"||paris())n+=25;
    if(lead.formule&&lead.formule!=="Je ne sais pas encore")n+=15;
    n+=lead.disponibilite==="Dès maintenant"?20:lead.disponibilite==="D’ici 3 mois"?10:0;
    return n+"/100 ("+(n>=75?"chaud":n>=45?"tiède":"froid")+")"}

  function send(){
    if(sending)return;
    if(form.website.value||Date.now()-t0<4000){say("Merci, votre demande est bien notée.");return}
    try{if(Date.now()-(+localStorage.getItem("clefora_last")||0)<60000){done();return}}catch(_){}
    sending=true;var q=score(),body={access_key:flow.key,subject:"Clefora · Concierge · "+lead.profil+(q?" · "+q:""),from_name:"Concierge Clefora",botcheck:"",source:"Assistant du site ("+location.pathname+")"};
    if(q)body.qualification=q;
    for(var k in lead)if(k!=="rgpd")body[k]=String(lead[k]).slice(0,80);
    say("Je transmets votre demande…");
    fetch("https://api.web3forms.com/submit",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(body)})
      .then(function(r){return r.json()}).then(function(d){if(!d.success)throw 0;try{localStorage.setItem("clefora_last",Date.now())}catch(_){}done()})
      .catch(function(){say("L’envoi n’a pas abouti. Vous pouvez réserver directement un appel :",function(){chips([{t:"Choisir un créneau",href:BOOK,fill:1}])})})
      .then(function(){sending=false;flow=null})}
  function done(){say("C’est noté, "+(lead.nom||"").split(" ")[0]+". Nous vous rappelons sous 24 heures. Pour gagner du temps, choisissez dès maintenant votre créneau d’appel :",function(){chips([{t:"Choisir un créneau",href:BOOK,fill:1},{t:"Une autre question",go:menuQ}])})}

  /* ---------- Questions fréquentes (mots-clés) ---------- */
  var FAQ=[
    [/honorair|commission|frais|co[uû]t|tarif|prix|pourcentage|%/,"Nos honoraires sont de <em>20 %</em> en courte durée et de <em>15 %</em> en bail mobilité. Rien d’autre. Pour le ménage hôtelier, le devis est établi sous 24 heures selon le nombre de chambres."],
    [/combien.*(gagn|rapport|lou)|revenu|rentab|estim|loyer/,"Cela dépend de l’adresse, de la surface et de la formule. Nous vous adressons une estimation personnalisée sous 24 heures. Cinq questions suffisent.",function(){chips([{t:"Estimer mon bien",go:function(){start("prop")}}])}],
    [/bail mobilit/,"Le bail mobilité est un bail meublé de 1 à 10 mois, pour un locataire en formation, en mission ou en mutation. Moins de rotations, des revenus réguliers, et nos honoraires sont de 15 %."],
    [/courte dur|airbnb|booking|saisonn|touris/,"La courte durée offre le meilleur rendement, avec des règles à respecter (déclaration en mairie, plafond de nuitées pour une résidence principale). Nous les vérifions avec vous lors de l’appel."],
    [/zone|o[uù] |secteur|banlieue|arrondissement|ville|m[ée]tro/,"Nous intervenons à Paris et en proche banlieue, pour les biens situés à cinq minutes à pied d’une station de métro. Ailleurs, nous vous orientons vers une conciergerie partenaire de votre région."],
    [/d[ée]lai|quand|combien de temps|photo|rapide/,"Estimation sous 24 heures, photographies sous 72 heures. Pour un hôtel, devis sous 24 heures."],
    [/m[ée]nage|linge|draps|nettoy|chambre|h[oô]tel/,"Ménage et linge de standard hôtelier, pour les hôtels comme pour les conciergeries. Chaque passage est photographié et contrôlé.",function(){chips([{t:"Demander un devis",go:function(){start("hotel")}}])}],
    [/engag|contrat|r[ée]sili|mandat|dur[ée]e minimum/,"Pour le ménage, aucun engagement : vous restez parce que vous êtes satisfait. Les mandats de gestion sont signés directement avec la maison partenaire, sans intermédiaire."],
    [/assur/,"Les prestations de ménage sont assurées par Hiscox."],
    [/qui |clefora|made ?for ?you|capital|soci[ée]t[ée]|maison/,"Clefora fait partie de <em>Made for You</em>, la conciergerie, et de <em>Capital Nettoyage</em>, le ménage hôtelier. Nous orientons chaque demande vers la bonne maison."],
    [/lead|partenaire|r[ée]seau|apporteur|propri[ée]taires? qualifi/,"Conciergeries partout en France : nous vous transmettons des propriétaires qualifiés près de chez vous, sans abonnement. <a href=\"partenaires\">Découvrir le réseau</a>."],
    [/appel|t[ée]l[ée]phone|humain|conseiller|rendez|rdv|parler/,"Avec plaisir. Choisissez le créneau qui vous convient :",function(){chips([{t:"Choisir un créneau",href:BOOK,fill:1}])}],
    [/^(bonjour|bonsoir|salut|hello|coucou)/,"Bonjour. Que puis-je faire pour vous ?",function(){menu()}],
    [/merci/,"Avec plaisir. Je reste à votre disposition."]
  ];
  function faq(t){var s=t.toLowerCase();
    for(var i=0;i<FAQ.length;i++)if(FAQ[i][0].test(s)){var f=FAQ[i][2];say(FAQ[i][1],f);return}
    say("Je n’ai pas la réponse à cette question, mais nous l’aurons au téléphone.",function(){chips([{t:"Choisir un créneau",href:BOOK,fill:1},{t:"Voir les questions fréquentes",go:menuQ}])})}
  function menuQ(){say("Que souhaitez-vous savoir ?",function(){chips(["Vos honoraires","Votre zone","Le bail mobilité","Les délais","Qui êtes-vous ?"].map(function(q){return{t:q,go:function(){faq(q)}}}))})}
  function menu(){chips([
    {t:"J’ai un bien à confier",go:function(){start("prop")}},
    {t:"Hôtel ou conciergerie : ménage et linge",go:function(){start("hotel")}},
    {t:"Je suis une conciergerie partenaire",go:function(){start("part")}},
    {t:"J’ai une question",go:menuQ}])}

  form.addEventListener("submit",function(e){e.preventDefault();var v=inp.value.trim();if(!v)return;inp.value="";me(v);
    if(wait&&flow){var s=wait;wait=null;inp.placeholder="Votre question…";inp.inputMode="text";clearChips();answer(s.k==="telephone"?v.replace(/[^\d+ ]/g," ").replace(/\s+/g," ").trim():v);return}
    faq(v)});

  function open(){box.classList.add("on");btn.hidden=true;
    if(!started){started=true;t0=Date.now();say("Bonjour, je suis le concierge de Clefora. Je vous réponds tout de suite, et je transmets votre demande à la bonne maison.",menu)}
    setTimeout(function(){inp.focus()},300)}
  function close(){box.classList.remove("on");btn.hidden=false;btn.focus()}
  btn.onclick=open;box.querySelector(".cg-x").onclick=close;
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&box.classList.contains("on"))close()});
  /* Les liens « #concierge » ouvrent l'assistant */
  document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest('a[href="#concierge"]');if(a){e.preventDefault();open()}});
})();
