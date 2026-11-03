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
  /* Hors Paris : loyers d'annonce par commune, toute la France, Corse et outre-mer compris
     (« Carte des loyers » 2025, ministère de la Transition écologique, data.gouv.fr), interrogés à la demande.
     Courte durée hors Paris : estimée à partir du loyer local (×1,8 en petite couronne, comme nos données 2026 ;
     ×1,4 ailleurs, coefficient prudent faute de donnée publique commune par commune). */
  var GEO="https://data.geopf.fr/geocodage/search?limit=6&autocomplete=1&q=",
      TAB="https://tabular-api.data.gouv.fr/api/resources/",
      RES={p12:"14a1fe11-b2d1-49b3-9f6b-83d12df9482c",p3:"5e3b28a4-cf56-43a3-ae79-43cceeb27f8c"},
      DVF="851d342f-9c96-41c1-924a-11a7a7aae8a6",vcache={},
      cache={},place=null,sugg={},tm=0,seq=0;
  function paris(insee){var a=+insee.slice(3);if(!/^751\d\d$/.test(insee)||a<1||a>20)return null;
    return {lc:OLAP[a]*M.meuble,cd:(a<=8||a===16)?95:(a===13||a>=18)?62:78,ref:40,fourchette:.1}}
  function loyer(insee,typo){var k=insee+typo;if(cache[k])return Promise.resolve(cache[k]);
    return fetch(TAB+RES[typo]+"/data/?INSEE_C__exact="+encodeURIComponent(insee)).then(function(r){if(!r.ok)throw 0;return r.json()})
      .then(function(j){var d=j.data&&j.data[0];if(!d||!d.loypredm2)throw 0;return cache[k]=+d.loypredm2})}
  /* Vente : prix médian au m² des appartements vendus sur les 5 dernières années (« Statistiques DVF », data.gouv.fr,
     d'après les Demandes de valeurs foncières de la DGFiP ; hors Alsace-Moselle et Mayotte, absents de DVF). */
  function vente(insee){if(insee in vcache)return Promise.resolve(vcache[insee]);
    return fetch(TAB+DVF+"/data/?echelle_geo__exact=commune&code_geo__exact="+encodeURIComponent(insee)).then(function(r){if(!r.ok)throw 0;return r.json()})
      .then(function(j){var d=j.data&&j.data[0]||{},v=0,k;
        for(k in d)if(/^med_prix_m2.*_appartement$/.test(k)&&d[k]){v=+d[k]}
        if(!v)for(k in d)if(/^med_prix_m2.*apt_maison$/.test(k)&&d[k]){v=+d[k]}
        return vcache[insee]=v}).catch(function(){return vcache[insee]=0})}
  var vout=document.getElementById("sim-vente");
  function showVente(m,my){if(!vout)return;vout.querySelector(".v").textContent="—";vout.querySelector(".n").textContent="";
    vente(place.insee).then(function(v){if(my!==seq)return;
      if(!v){vout.querySelector(".n").textContent="Pas assez de ventes publiées pour cette commune.";return}
      var x=v*m*q,r=function(y){return fmt.format(Math.round(y/5000)*5000)};
      vout.querySelector(".v").innerHTML=r(x*.9)+" – "+r(x*1.1)+"<small>€</small>";
      vout.querySelector(".n").textContent="Prix médian constaté ≈ "+fmt.format(Math.round(v/10)*10)+" €/m² à "+place.city+" (ventes notariées, 5 dernières années)";
      if(fsim&&fsim.value)fsim.value+=" / vente "+r(x)+" €"})}
  var adr=document.getElementById("s-adr"),dl=document.getElementById("s-adr-l"),m2=document.getElementById("s-m2"),msg=document.getElementById("sim-msg"),q=1,p=1,
      rows=document.querySelectorAll("#sim-res .r[data-k]"),fmt=new Intl.NumberFormat("fr-FR"),
      fcp=document.getElementById("f-cp"),fsim=document.getElementById("f-sim"),
      LBL=["Studio","2 pièces","3 pièces","4 pièces","5 pièces et plus"];
  function r50(x){return fmt.format(Math.round(x/50)*50)}
  function reset(t){rows.forEach(function(r){r.classList.remove("best");r.querySelector(".v").textContent="—";r.querySelector(".n span").textContent="";r.querySelector(".n b").textContent="";r.querySelector(".bar i").style.width="0"});msg.innerHTML=t;if(fsim)fsim.value=""}
  function run(){
    var m=+m2.value.replace(/\D/g,""),my=++seq;
    if(!place||!m)return reset("Indiquez l’adresse (ou la ville), la surface et le nombre de pièces : <em>l’estimation s’affiche aussitôt</em>.");
    if(m<9||m>400)return reset("Indiquez une surface entre 9 et 400 m².");
    showVente(m,my);
    var z=paris(place.insee);
    if(z)return calc(z,m);
    var typo=p<=1?"p12":"p3";
    msg.innerHTML="Recherche des loyers à "+place.city+"…";
    loyer(place.insee,typo).then(function(l){if(my!==seq)return;
      var pc=/^9[234]/.test(place.insee);
      calc({lc:l,cd:l*(pc?1.8:1.4),ref:typo==="p12"?35:65,fourchette:pc?.12:.2},m)
    },function(){if(my===seq)reset("Pas de donnée de loyer disponible pour cette commune. <em>Une conciergerie de notre réseau peut estimer votre bien</em> : laissez-nous vos coordonnées ci-dessous.")});
  }
  function calc(z,m){
    // les petites surfaces se louent plus cher au m² ; en courte durée, chaque pièce en plus accueille plus de voyageurs
    var sz=Math.min(1.25,Math.max(.85,Math.pow(z.ref/m,.12))),exp=Math.max(1,Math.round(m/25)),
        pf=Math.min(1.15,Math.max(.88,1+.06*(p+1-exp))),
        lc=z.lc*sz*q*m,
        brut={cd:z.cd*sz*pf*q*m,bm:lc*M.bm,lc:lc},net={},best="lc",summ=[];
    for(var x in brut){var pl=brut[x]*M.plat[x],ho=(brut[x]-pl)*M.hon[x],va=x==="lc"?brut[x]*M.vacance:0;net[x]={v:brut[x]-pl-ho-va,pl:pl,ho:ho,va:va}}
    for(x in net)if(net[x].v>net[best].v)best=x;
    rows.forEach(function(r){var key=r.dataset.k,n=net[key];
      r.querySelector(".v").innerHTML=r50(n.v*(1-z.fourchette))+" – "+r50(n.v*(1+z.fourchette))+"<small>€</small>";
      r.querySelector(".n span").textContent=(key==="lc"?"Loyer ≈ ":"Loyers ≈ ")+r50(brut[key])+" €";
      r.querySelector(".n b").textContent=key==="lc"?"− vacance "+r50(n.va)+" € · gestion à votre charge":"Frais de plateforme et honoraires ("+Math.round(M.hon[key]*100)+" %) déduits";
      r.querySelector(".bar i").style.width=Math.round(n.v/net[best].v*100)+"%";
      r.classList.toggle("best",key===best);
      summ.push(key.toUpperCase()+" net "+r50(n.v)+" €");
    });
    var gain=Math.round((net[best].v/net.lc.v-1)*100),an=Math.round((net[best].v-net.lc.v)*12/100)*100;
    msg.innerHTML=best==="lc"||gain<8?"Pour ce bien, l’écart avec une location classique reste faible : <em>parlons-en ensemble</em>.":"Environ <em>"+r50(net[best].v-net.lc.v)+" € de plus par mois</em>, soit "+fmt.format(an)+" € par an, qu’en location classique ("+(gain>0?"+":"")+gain+" %), tous frais payés, sans vous en occuper.";
    if(fsim)fsim.value=place.label+" · "+LBL[p]+(m?" · "+m+" m²":"")+" · "+summ.join(" / ");
    if(fcp&&!fcp.value&&place.cp){fcp.value=place.cp;fcp.dispatchEvent(new Event("input"))}
  }
  function group(attr,cb){var bs=document.querySelectorAll("#sim [data-"+attr+"]");bs.forEach(function(b){b.addEventListener("click",function(){bs.forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});cb(+b.dataset[attr]);run()})})}
  group("q",function(v){q=v});group("p",function(v){p=v});
  document.getElementById("sim").addEventListener("submit",function(e){e.preventDefault()});
  function pick(){var f=sugg[adr.value];if(f){place=f;run()}else if(place&&adr.value!==place.label){place=null;run()}}
  adr.addEventListener("input",function(){pick();var v=adr.value.trim();clearTimeout(tm);if(v.length<3||sugg[v])return;
    tm=setTimeout(function(){fetch(GEO+encodeURIComponent(v)).then(function(r){return r.json()}).then(function(j){
      dl.innerHTML="";(j.features||[]).forEach(function(f){var g=f.properties;if(!g.citycode)return;
        sugg[g.label]={label:g.label,insee:g.citycode,cp:g.postcode||"",city:g.city||g.label};
        var o=document.createElement("option");o.value=g.label;dl.appendChild(o)});pick()}).catch(function(){})},250)});
  adr.addEventListener("change",pick);m2.addEventListener("input",run);
})();
