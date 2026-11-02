/* Simulateur de revenus : calcul local, rien n'est envoyé tant que le formulaire n'est pas validé.
   Chiffres volontairement prudents. Données marché à mettre à jour de temps en temps (prix moyens Paris). */
(function(){
  var M={occ:.65,
    // par nombre de pièces (studio, 2, 3, 4, 5+) : surface type (m²), nuitée moyenne (€), loyer bail mobilité (€/mois), loyer meublé 1 an (€/mois)
    m2:[25,40,60,85,110],nuit:[100,145,240,330,430],bm:[1250,1800,2550,3550,4600],lc:[1000,1400,2000,2750,3500],
    // frais déduits : plateforme (Airbnb, Booking…) puis honoraires de gestion
    plat:{cd:.15,bm:.15,lc:0},hon:{cd:.20,bm:.15,lc:0}};
  function sector(cp){
    if(/^750(0[1-8]|16)$/.test(cp)||cp==="75116")return 1.15;
    if(/^750(09|1[0145]|17)$/.test(cp))return 1;
    if(/^750(1[2389]|20)$/.test(cp))return .88;
    if(/^92(200|100|300|130|170)$/.test(cp))return .93; // Neuilly, Boulogne, Levallois, Issy, Vanves
    if(/^9[234]\d{3}$/.test(cp))return .78;
    return 0;
  }
  var cp=document.getElementById("s-cp"),m2=document.getElementById("s-m2"),msg=document.getElementById("sim-msg"),q=1,p=1,
      rows=document.querySelectorAll("#sim-res .r"),fmt=new Intl.NumberFormat("fr-FR"),
      fcp=document.getElementById("f-cp"),fsim=document.getElementById("f-sim"),
      LBL=["Studio","2 pièces","3 pièces","4 pièces","5 pièces et plus"];
  function r50(x){return fmt.format(Math.round(x/50)*50)}
  function reset(t){rows.forEach(function(r){r.classList.remove("best");r.querySelector(".v").textContent="—";r.querySelector(".n span").textContent="";r.querySelector(".n b").textContent="";r.querySelector(".bar i").style.width="0"});msg.innerHTML=t;if(fsim)fsim.value=""}
  function run(){
    var c=cp.value.replace(/\D/g,"").slice(0,5),m=+m2.value.replace(/\D/g,"");
    if(c.length<5)return reset("Indiquez le code postal et le nombre de pièces : <em>l’estimation s’affiche aussitôt</em>.");
    if(m&&(m<9||m>400))return reset("Indiquez une surface entre 9 et 400 m².");
    var k=sector(c);
    if(!k)return reset("Ce simulateur couvre Paris et la proche banlieue. <em>Une conciergerie de notre réseau peut estimer votre bien</em> : laissez-nous vos coordonnées ci-dessous.");
    // la surface ajuste légèrement le prix par rapport à un logement type du même nombre de pièces
    var f=k*q*(m?Math.min(1.25,Math.max(.8,Math.sqrt(m/M.m2[p]))):1),
        brut={cd:M.nuit[p]*30.4*M.occ*f,bm:M.bm[p]*f,lc:M.lc[p]*f},net={},best="lc",summ=[];
    for(var x in brut){var pl=brut[x]*M.plat[x],ho=(brut[x]-pl)*M.hon[x];net[x]={v:brut[x]-pl-ho,pl:pl,ho:ho}}
    for(x in net)if(net[x].v>net[best].v)best=x;
    rows.forEach(function(r){var key=r.dataset.k,n=net[key];
      r.querySelector(".v").innerHTML=r50(n.v*.9)+" – "+r50(n.v*1.1)+"<small>€</small>";
      r.querySelector(".n span").textContent=key==="lc"?"Bail meublé d’un an, sans frais de gestion":"Loyers ≈ "+r50(brut[key])+" €";
      r.querySelector(".n b").textContent=key==="lc"?"Gestion et vacance à votre charge":"− plateforme "+r50(n.pl)+" € · − honoraires "+r50(n.ho)+" €";
      r.querySelector(".bar i").style.width=Math.round(n.v/net[best].v*100)+"%";
      r.classList.toggle("best",key===best);
      summ.push(key.toUpperCase()+" net "+r50(n.v)+" €");
    });
    var gain=Math.round((net[best].v/net.lc.v-1)*100);
    msg.innerHTML=best==="lc"||gain<10?"Pour ce bien, l’écart avec une location classique reste faible : <em>parlons-en ensemble</em>.":"Environ <em>"+gain+" % de plus</em> qu’en location classique, une fois tous les frais payés, sans vous en occuper.";
    if(fsim)fsim.value=c+" · "+LBL[p]+(m?" · "+m+" m²":"")+" · "+summ.join(" / ");
    if(fcp&&!fcp.value){fcp.value=c;fcp.dispatchEvent(new Event("input"))}
  }
  function group(attr,cb){var bs=document.querySelectorAll("#sim [data-"+attr+"]");bs.forEach(function(b){b.addEventListener("click",function(){bs.forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});cb(+b.dataset[attr]);run()})})}
  group("q",function(v){q=v});group("p",function(v){p=v});
  document.getElementById("sim").addEventListener("submit",function(e){e.preventDefault()});
  cp.addEventListener("input",run);m2.addEventListener("input",run);
})();
