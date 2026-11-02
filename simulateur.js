/* Simulateur de revenus : calcul local, rien n'est envoyé tant que le formulaire n'est pas validé.
   Chiffres volontairement prudents. */
(function(){
  /* Données de marché 2026, à rafraîchir chaque trimestre.
     LC : loyer médian €/m² par arrondissement (OLAP, janv. 2026), majoré de 5 % pour le meublé.
     CD : revenu Airbnb brut €/m²/mois par secteur (BNB Calc sept. 2026, minoré de 15 % par prudence).
     BM : loyer meublé majoré (plafond « référence majorée », charges comprises). */
  var OLAP={1:52.5,2:49,3:48.5,4:51,5:47,6:53,7:52,8:49.5,9:44,10:42,11:43.5,12:38.5,13:36,14:40.5,15:41,16:48,17:43,18:37.5,19:35,20:36.5},
      M={meuble:1.05,bm:1.15,vacance:1/12,
        plat:{cd:.15,bm:.05,lc:0},hon:{cd:.20,bm:.15,lc:0}};
  function zone(cp){
    var a=/^75(0\d\d|116)$/.test(cp)?(cp==="75116"?16:+cp.slice(3)):0;
    if(a>=1&&a<=20){var cd=(a<=8||a===16)?95:(a===13||a>=18)?62:78;return {lc:OLAP[a],cd:cd,nom:a===1?"1er":a+"e"}}
    if(/^92(200|100|300|130|170)$/.test(cp))return {lc:30,cd:60,nom:"secteur"};
    if(/^9[234]\d{3}$/.test(cp))return {lc:24,cd:45,nom:"secteur"};
    return null;
  }
  var cp=document.getElementById("s-cp"),m2=document.getElementById("s-m2"),msg=document.getElementById("sim-msg"),q=1,p=1,
      rows=document.querySelectorAll("#sim-res .r"),fmt=new Intl.NumberFormat("fr-FR"),
      fcp=document.getElementById("f-cp"),fsim=document.getElementById("f-sim"),
      LBL=["Studio","2 pièces","3 pièces","4 pièces","5 pièces et plus"];
  function r50(x){return fmt.format(Math.round(x/50)*50)}
  function reset(t){rows.forEach(function(r){r.classList.remove("best");r.querySelector(".v").textContent="—";r.querySelector(".n span").textContent="";r.querySelector(".n b").textContent="";r.querySelector(".bar i").style.width="0"});msg.innerHTML=t;if(fsim)fsim.value=""}
  function run(){
    var c=cp.value.replace(/\D/g,"").slice(0,5),m=+m2.value.replace(/\D/g,"");
    if(c.length<5||!m)return reset("Indiquez le code postal, la surface et le nombre de pièces : <em>l’estimation s’affiche aussitôt</em>.");
    if(m<9||m>400)return reset("Indiquez une surface entre 9 et 400 m².");
    var z=zone(c);
    if(!z)return reset("Ce simulateur couvre Paris et la proche banlieue. <em>Une conciergerie de notre réseau peut estimer votre bien</em> : laissez-nous vos coordonnées ci-dessous.");
    // les petites surfaces se louent plus cher au m² ; en courte durée, chaque pièce en plus accueille plus de voyageurs
    var sz=Math.min(1.25,Math.max(.85,Math.pow(40/m,.12))),exp=Math.max(1,Math.round(m/25)),
        pf=Math.min(1.15,Math.max(.88,1+.06*(p+1-exp))),
        lc=z.lc*M.meuble*sz*q*m,
        brut={cd:z.cd*sz*pf*q*m,bm:lc*M.bm,lc:lc},net={},best="lc",summ=[];
    for(var x in brut){var pl=brut[x]*M.plat[x],ho=(brut[x]-pl)*M.hon[x],va=x==="lc"?brut[x]*M.vacance:0;net[x]={v:brut[x]-pl-ho-va,pl:pl,ho:ho,va:va}}
    for(x in net)if(net[x].v>net[best].v)best=x;
    rows.forEach(function(r){var key=r.dataset.k,n=net[key];
      r.querySelector(".v").innerHTML=r50(n.v*.9)+" – "+r50(n.v*1.1)+"<small>€</small>";
      r.querySelector(".n span").textContent=(key==="lc"?"Loyer meublé ≈ ":"Loyers ≈ ")+r50(brut[key])+" €";
      r.querySelector(".n b").textContent=key==="lc"?"− vacance "+r50(n.va)+" € · gestion à votre charge":"− plateforme "+r50(n.pl)+" € · − honoraires "+r50(n.ho)+" €";
      r.querySelector(".bar i").style.width=Math.round(n.v/net[best].v*100)+"%";
      r.classList.toggle("best",key===best);
      summ.push(key.toUpperCase()+" net "+r50(n.v)+" €");
    });
    var gain=Math.round((net[best].v/net.lc.v-1)*100),an=Math.round((net[best].v-net.lc.v)*12/100)*100;
    msg.innerHTML=best==="lc"||gain<8?"Pour ce bien, l’écart avec une location classique reste faible : <em>parlons-en ensemble</em>.":"Environ <em>"+fmt.format(an)+" € de plus par an</em> qu’en location classique ("+(gain>0?"+":"")+gain+" %), tous frais payés, sans vous en occuper.";
    if(fsim)fsim.value=c+" · "+LBL[p]+(m?" · "+m+" m²":"")+" · "+summ.join(" / ");
    if(fcp&&!fcp.value){fcp.value=c;fcp.dispatchEvent(new Event("input"))}
  }
  function group(attr,cb){var bs=document.querySelectorAll("#sim [data-"+attr+"]");bs.forEach(function(b){b.addEventListener("click",function(){bs.forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});cb(+b.dataset[attr]);run()})})}
  group("q",function(v){q=v});group("p",function(v){p=v});
  document.getElementById("sim").addEventListener("submit",function(e){e.preventDefault()});
  cp.addEventListener("input",run);m2.addEventListener("input",run);
})();
