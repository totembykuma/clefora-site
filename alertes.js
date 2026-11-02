/* Alertes acheteurs : inscription envoyée à Clefora par Web3Forms. L'adresse est ensuite ajoutée à la liste privée (secret GitHub ALERTES_ABONNES). */
(function(){
  var f=document.getElementById("alert-form");if(!f)return;
  var KEY="75f0b8b4-63fd-4f63-b4e1-7ea272593b71",t0=Date.now(),busy=false,ok=document.getElementById("a-ok");
  function msg(t,err,el){ok.textContent=t;ok.style.color=err?"#E8A0A8":"";ok.hidden=false;f.querySelectorAll("[aria-invalid]").forEach(function(i){i.removeAttribute("aria-invalid")});if(el){el.setAttribute("aria-invalid","true");el.focus()}}
  f.addEventListener("submit",function(e){
    e.preventDefault();
    if(busy||document.getElementById("a-hp").value)return;
    if(Date.now()-t0<3000){msg("Merci de vérifier vos informations puis de renvoyer.",1);return}
    var m=document.getElementById("a-mail"),d=document.getElementById("a-dep"),mail=m.value.trim().toLowerCase();
    var deps=(d.value.match(/2[ABab]|\d{2,3}/g)||[]).map(function(x){x=x.toUpperCase();if(x[0]==="2"&&/[AB]/.test(x[1]))return "20";return x.length===3&&x.slice(0,2)!=="97"?x.slice(0,2):x}).filter(function(x,i,a){return a.indexOf(x)===i}).slice(0,20);
    if(!/^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test(mail)){msg("Indiquez une adresse e-mail valide.",1,m);return}
    if(!deps.length){msg("Indiquez au moins un département, par exemple 75.",1,d);return}
    if(!document.getElementById("a-rgpd").checked){msg("Cochez la case d’accord pour recevoir les alertes.",1,document.getElementById("a-rgpd"));return}
    busy=true;
    fetch("https://api.web3forms.com/submit",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({
      access_key:KEY,subject:"Clefora · inscription aux alertes ("+deps.join(", ")+")",from_name:"Site Clefora",email:mail,departements:deps.join(","),
      ligne_a_ajouter:mail+";"+deps.join(","),consentement:"Oui, le "+new Date().toLocaleString("fr-FR"),botcheck:""})})
    .then(function(r){return r.json()}).then(function(x){
      if(x.success){msg("C’est noté. Vous recevrez une alerte à chaque nouveau propriétaire dans "+(deps.length>1?"vos départements":"votre département")+".");f.reset()}
      else msg("L’inscription n’a pas abouti. Merci de réessayer dans un instant.",1);
    }).catch(function(){msg("L’inscription n’a pas abouti. Merci de réessayer dans un instant.",1)})
    .finally(function(){busy=false});
  });
})();
