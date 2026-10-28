(function(){
  /* Entrée du palace */
  var intro=document.getElementById("intro"),root=document.documentElement;
  root.style.overflow="hidden";
  document.getElementById("enter").focus({preventScroll:true});
  var iv=document.getElementById("intro-v"),gone=false;
  function enterSite(){if(gone)return;gone=true;intro.classList.add("open");setTimeout(function(){root.style.overflow="";root.classList.add("arrive")},800);setTimeout(function(){intro.hidden=true},1300)}
  document.getElementById("enter").addEventListener("click",enterSite);
  document.querySelectorAll("[data-go]").forEach(function(d){d.addEventListener("click",function(){document.getElementById(d.dataset.go).scrollIntoView({behavior:"smooth"})})});
  document.addEventListener("click",function(e){var a=e.target.closest("[data-pre]");if(a)document.getElementById("f-prof").value=a.dataset.pre});
  /* Apparitions au défilement */
  (function(){var els=document.querySelectorAll(".room .story>*,.room .card,.chip,.path>div,.leads,.market .head,.contact>*,.fact");
    if(!("IntersectionObserver" in window))return;
    els.forEach(function(e,i){e.classList.add("rv");e.style.transitionDelay=(e.classList.contains("chip")?(Array.prototype.indexOf.call(e.parentNode.children,e)*70):0)+"ms"});
    var o=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add("in");o.unobserve(en.target)}})},{rootMargin:"0px 0px -8% 0px"});
    els.forEach(function(e){o.observe(e)})})();
  /* Étages */
  if("IntersectionObserver" in window){
    var fl=document.querySelectorAll(".floors a");
    var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting)fl.forEach(function(a){a.classList.toggle("on",a.dataset.f===en.target.id)})})},{rootMargin:"-45% 0px -50% 0px"});
    ["top","suite","piscine","bourse","contact"].forEach(function(id){var el=document.getElementById(id);if(el)io.observe(el)});
  }
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* Éligibilité */
  var metro={"92100":"Boulogne-Billancourt","92130":"Issy-les-Moulineaux","92300":"Levallois-Perret","92200":"Neuilly-sur-Seine","92110":"Clichy","92120":"Montrouge","92240":"Malakoff","92170":"Vanves","92800":"Puteaux","92400":"Courbevoie","92600":"Asnières-sur-Seine","92230":"Gennevilliers","92220":"Bagneux","92320":"Châtillon","92150":"Suresnes","93200":"Saint-Denis","93400":"Saint-Ouen","93100":"Montreuil","93170":"Bagnolet","93260":"Les Lilas","93500":"Pantin","93300":"Aubervilliers","93310":"Le Pré-Saint-Gervais","93000":"Bobigny","93120":"La Courneuve","93230":"Romainville","93110":"Rosny-sous-Bois","94300":"Vincennes","94160":"Saint-Mandé","94220":"Charenton-le-Pont","94200":"Ivry-sur-Seine","94270":"Le Kremlin-Bicêtre","94800":"Villejuif","94700":"Maisons-Alfort","94000":"Créteil"};
  var cp=document.getElementById("cp"),zo=document.getElementById("zone-out"),sector=1;
  function zone(){
    var v=cp.value.replace(/\D/g,""),n=+v;
    if(v.length<5){zo.innerHTML='<span class="fine">Saisissez les 5 chiffres du code postal.</span>';return}
    if((n>=75001&&n<=75020)||n===75116){
      var arr=n===75116?16:n-75000;sector=[1,2,3,4,5,6,7,8,16].indexOf(arr)>-1?1.18:1;
      zo.innerHTML='<p class="verdict ok">Éligible · Paris '+arr+'<sup>e</sup></p><p class="fine">Made for You gère votre arrondissement. La distance au métro est vérifiée lors de l\'appel.</p>';
    }else if(metro[v]){sector=.82;
      zo.innerHTML='<p class="verdict ok">Éligible · '+metro[v]+'</p><p class="fine">Commune desservie par le métro. Votre bien doit se trouver à 5 minutes à pied d\'une station.</p>';
    }else if(/^(92|93|94)/.test(v)){sector=.82;
      zo.innerHTML='<p class="verdict mid">À vérifier ensemble</p><p class="fine">Laissez votre numéro, nous regardons votre adresse exacte.</p>';
    }else{sector=.82;
      zo.innerHTML='<p class="verdict mid">Une conciergerie partenaire vous accompagne</p><p class="fine">Votre bien est hors de Paris : nous vous mettons en relation avec une conciergerie de votre secteur.</p>';
    }
    sim();
  }
  /* Simulateur : données marché, mises à jour chaque semaine (sources : Airbtics, BnbCalc, annonces meublées moyenne durée) */
  var MARKET={maj:"28 oct. 2026",nightly:[105,150,260,350],occ:.68,monthly:[1300,1900,2700,3800]};
  var nightly=MARKET.nightly,monthly=MARKET.monthly,mode="cd",typ=document.getElementById("typ"),fmt=new Intl.NumberFormat("fr-FR");
  function sim(){
    var i=+typ.value,b=mode==="cd"?nightly[i]*sector*30.4*MARKET.occ:monthly[i]*sector;
    document.getElementById("sim-out").innerHTML=fmt.format(Math.round(b*.9/50)*50)+" à "+fmt.format(Math.round(b*1.1/50)*50)+" <small>€</small>";
    document.getElementById("sim-note").textContent=mode==="cd"?"Prix moyen du marché par nuit, "+Math.round(MARKET.occ*100)+" % d'occupation. Données du "+MARKET.maj+".":"Loyer meublé moyenne durée du marché. Données du "+MARKET.maj+".";
  }
  function group(sel,attr,cb){var bs=document.querySelectorAll(sel);bs.forEach(function(b){b.addEventListener("click",function(){bs.forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});cb(b.dataset[attr])})})}
  group("[data-mode]","mode",function(m){mode=m;sim()});
  typ.addEventListener("change",sim);cp.addEventListener("input",zone);zone();

  /* Devis ménage */
  var nb=document.getElementById("nb"),est="Hôtel";
  function nbShow(){document.getElementById("nb-out").innerHTML=nb.value+" <small>"+(est==="Hôtel"?"chambres":"appartements")+"</small>"}
  group("[data-est]","est",function(v){est=v;document.getElementById("nb-l").textContent=v==="Hôtel"?"Nombre de chambres":"Nombre d'appartements";nbShow()});
  group("[data-linge]","linge",function(){});
  nb.addEventListener("input",nbShow);nbShow();


  /* E-mails */
  document.querySelectorAll(".mail").forEach(function(s){var a=s.dataset.u+"@"+s.dataset.d,l=document.createElement("a");l.href="mailto:"+a;l.textContent=a;l.style.color="inherit";s.textContent="";s.appendChild(l)});
  /* Envoi : Web3Forms + pot de miel + délai minimum + limite locale */
  var ACCESS_KEY="75f0b8b4-63fd-4f63-b4e1-7ea272593b71",KEY_MFY="d46879e2-0d24-4c07-8ddc-430a89f83e86",t0=Date.now(),sending=false;
  document.getElementById("lead-form").addEventListener("submit",function(e){
    e.preventDefault();
    var f=e.target,ok=document.getElementById("ok"),btn=f.querySelector("button[type=submit]");
    function msg(t,err){ok.textContent=t;ok.style.color=err?"#9B2C2C":"";ok.hidden=false}
    if(sending||document.getElementById("f-hp").value)return;
    if(Date.now()-t0<3000){msg("Merci de vérifier vos informations puis de renvoyer.",1);return}
    var name=document.getElementById("f-name").value.trim(),tel=document.getElementById("f-tel").value.replace(/[^\d+]/g,""),cpv=document.getElementById("f-cp").value.replace(/\D/g,"").slice(0,5);
    if(name.length<2||name.length>80){msg("Indiquez votre prénom et votre nom.",1);return}
    if(!/^(\+33|0)[1-9]\d{8}$/.test(tel)){msg("Indiquez un numéro de téléphone français valide.",1);return}
    if(cpv.length!==5){msg("Indiquez votre code postal.",1);return}
    if(!document.getElementById("f-rgpd").checked){msg("Cochez la case d'accord pour être rappelé.",1);return}
    try{if(Date.now()-(+localStorage.getItem("clefora_last")||0)<60000){msg("Votre demande a déjà été envoyée. Nous vous rappelons très vite.");return}}catch(_){}
    sending=true;btn.disabled=true;
    var prof=document.getElementById("f-prof").value;
    fetch("https://api.web3forms.com/submit",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({
      access_key:(prof!=="Hôtel / conciergerie"&&KEY_MFY.indexOf("A_REMPLACER")<0)?KEY_MFY:ACCESS_KEY,subject:"Clefora · nouvelle demande ("+prof+")",from_name:"Site Clefora",nom:name.slice(0,80),telephone:tel,profil:prof,code_postal:cpv,botcheck:""})})
    .then(function(r){return r.json()}).then(function(d){
      if(d.success){msg("Merci, votre demande est bien partie. Vous êtes rappelé aujourd'hui.");f.reset();try{localStorage.setItem("clefora_last",Date.now())}catch(_){}}
      else msg("L'envoi n'a pas abouti. Appelez directement le 06 69 92 21 71.",1);
    }).catch(function(){msg("L'envoi n'a pas abouti. Appelez directement le 06 69 92 21 71.",1)})
    .finally(function(){sending=false;btn.disabled=false});
  });
})();
