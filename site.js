/* Clefora : comportements communs à toutes les pages */
document.documentElement.classList.add("js");
/* Calendrier de réservation ouvert automatiquement après l'envoi du formulaire */
window.openCal=function(){
  if(document.getElementById("cal-ov"))return;
  var u=document.getElementById("rdv-next").href,ov=document.createElement("div"),box=document.createElement("div"),x=document.createElement("button"),fr=document.createElement("iframe");
  ov.id="cal-ov";ov.style.cssText="position:fixed;inset:0;z-index:9999;background:rgba(43,43,43,.6);display:flex;align-items:center;justify-content:center;padding:16px";
  box.style.cssText="position:relative;width:min(960px,100%);height:min(760px,100%);background:#fff;border:1px solid #4A1E26";
  x.type="button";x.textContent="×";x.setAttribute("aria-label","Fermer");x.style.cssText="position:absolute;top:-14px;right:-14px;width:36px;height:36px;border-radius:50%;border:0;background:#4A1E26;color:#F2EEEA;font-size:22px;line-height:1;cursor:pointer";
  fr.src=u+"?gv=true";fr.title="Choisir votre créneau d'appel";fr.style.cssText="width:100%;height:100%;border:0";
  function close(){ov.remove();document.removeEventListener("keydown",esc)}function esc(e){if(e.key==="Escape")close()}
  x.onclick=close;ov.onclick=function(e){if(e.target===ov)close()};document.addEventListener("keydown",esc);
  box.appendChild(fr);box.appendChild(x);ov.appendChild(box);document.body.appendChild(ov);x.focus();
};
document.addEventListener("click",function(e){var a=e.target.closest("#rdv-next");if(a){e.preventDefault();openCal()}});
(function(){
  /* Navigation : passe en lin dès qu'on quitte l'image d'ouverture */
  var nav=document.querySelector(".nav"),stage=document.querySelector(".stage");
  function onScroll(){nav.classList.toggle("solid",!stage||window.scrollY>stage.offsetHeight-90)}
  window.addEventListener("scroll",onScroll,{passive:true});onScroll();
  var sheet=document.getElementById("sheet");
  if(sheet){
    document.getElementById("menu-btn").addEventListener("click",function(){sheet.classList.add("open");sheet.querySelector("a").focus()});
    sheet.addEventListener("click",function(e){if(e.target.closest("a,.close"))sheet.classList.remove("open")});
  }
  /* Apparitions au défilement */
  var els=document.querySelectorAll(".rv");
  if("IntersectionObserver" in window){
    var o=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add("in");o.unobserve(en.target)}})},{rootMargin:"0px 0px -10% 0px"});
    els.forEach(function(e){o.observe(e)});
  }else els.forEach(function(e){e.classList.add("in")});
  /* E-mails masqués */
  document.querySelectorAll(".mail").forEach(function(s){var a=s.dataset.u+"@"+s.dataset.d,l=document.createElement("a");l.href="mailto:"+a;l.textContent=a;s.textContent="";s.appendChild(l)});

  /* Éligibilité Made for You (page Propriétaires) */
  var cp=document.getElementById("f-cp"),zo=document.getElementById("zone");
  if(cp&&zo){
    var metro={"92100":"Boulogne-Billancourt","92130":"Issy-les-Moulineaux","92300":"Levallois-Perret","92200":"Neuilly-sur-Seine","92110":"Clichy","92120":"Montrouge","92240":"Malakoff","92170":"Vanves","92800":"Puteaux","92400":"Courbevoie","92600":"Asnières-sur-Seine","92230":"Gennevilliers","92220":"Bagneux","92320":"Châtillon","92150":"Suresnes","93200":"Saint-Denis","93400":"Saint-Ouen","93100":"Montreuil","93170":"Bagnolet","93260":"Les Lilas","93500":"Pantin","93300":"Aubervilliers","93310":"Le Pré-Saint-Gervais","93000":"Bobigny","93120":"La Courneuve","93230":"Romainville","93110":"Rosny-sous-Bois","94300":"Vincennes","94160":"Saint-Mandé","94220":"Charenton-le-Pont","94200":"Ivry-sur-Seine","94270":"Le Kremlin-Bicêtre","94800":"Villejuif","94700":"Maisons-Alfort","94000":"Créteil"};
    var zone=function(){
      var v=cp.value.replace(/\D/g,""),n=+v;
      if(v.length<5){zo.innerHTML="";return}
      if((n>=75001&&n<=75020)||n===75116){
        zo.innerHTML='<b>Paris '+(n===75116?16:n-75000)+'<sup>e</sup>, nous y sommes.</b>La distance au métro sera vérifiée lors de l\'appel.';
      }else if(metro[v]){
        zo.innerHTML='<b>'+metro[v]+', nous y sommes.</b>Votre bien doit se trouver à cinq minutes à pied d\'une station.';
      }else if(/^(92|93|94)/.test(v)){
        zo.innerHTML='<b class="mid">Nous regarderons votre adresse ensemble.</b>';
      }else{
        zo.innerHTML='<b class="mid">Une conciergerie de notre réseau vous accompagnera.</b>';
      }
    };
    cp.addEventListener("input",zone);zone();
  }

  /* Envoi : Web3Forms + pot de miel + délai minimum + limite locale */
  var ACCESS_KEY="75f0b8b4-63fd-4f63-b4e1-7ea272593b71",KEY_MFY="d46879e2-0d24-4c07-8ddc-430a89f83e86",t0=Date.now(),sending=false;
  var form=document.getElementById("lead-form");
  if(form)form.addEventListener("submit",function(e){
    e.preventDefault();
    var f=e.target,ok=document.getElementById("ok"),btn=f.querySelector("button[type=submit]");
    function msg(t,err){ok.textContent=t;ok.style.color=err?"#9B2C2C":"";ok.hidden=false}
    if(sending||document.getElementById("f-hp").value)return;
    if(Date.now()-t0<3000){msg("Merci de vérifier vos informations puis de renvoyer.",1);return}
    var name=document.getElementById("f-name").value.trim(),tel=document.getElementById("f-tel").value.replace(/[^\d+]/g,""),cpv=document.getElementById("f-cp").value.replace(/\D/g,"").slice(0,5);
    if(name.length<2||name.length>80){msg("Indiquez votre prénom et votre nom.",1);return}
    if(!/^(\+33|0)[1-9]\d{8}$/.test(tel)){msg("Indiquez un numéro de téléphone français valide.",1);return}
    if(cpv.length!==5){msg("Indiquez votre code postal.",1);return}
    if(!document.getElementById("f-rgpd").checked){msg("Cochez la case d'accord pour continuer.",1);return}
    try{if(Date.now()-(+localStorage.getItem("clefora_last")||0)<60000){msg("Votre demande est déjà enregistrée. Choisissez votre créneau d'appel.");openCal();return}}catch(_){}
    sending=true;btn.disabled=true;
    var prof=document.getElementById("f-prof").value;
    fetch("https://api.web3forms.com/submit",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({
      access_key:prof!=="Hôtel / conciergerie"?KEY_MFY:ACCESS_KEY,subject:"Clefora · nouvelle demande ("+prof+")",from_name:"Site Clefora",nom:name.slice(0,80),telephone:tel,profil:prof,code_postal:cpv,botcheck:""})})
    .then(function(r){return r.json()}).then(function(d){
      if(d.success){msg("Merci. Dernière étape : choisissez votre créneau d'appel.");openCal();f.reset();if(zo)zo.innerHTML="";try{localStorage.setItem("clefora_last",Date.now())}catch(_){}}
      else msg("L'envoi n'a pas abouti. Appelez directement le 06 69 92 21 71.",1);
    }).catch(function(){msg("L'envoi n'a pas abouti. Appelez directement le 06 69 92 21 71.",1)})
    .finally(function(){sending=false;btn.disabled=false});
  });
})();
