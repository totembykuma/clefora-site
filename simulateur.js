/* Simulateur de revenus : calcul local, aucune donnée envoyée tant que le formulaire n'est pas validé.
   Données marché à mettre à jour de temps en temps (prix moyens Paris). */
(function(){
  var M={maj:"novembre 2026",occ:.68,
    // repères de surface (m²) -> nuitée moyenne (€), loyer bail mobilité (€/mois), loyer meublé 1 an (€/mois)
    s:[25,40,60,85],nuit:[105,150,260,350],bm:[1300,1900,2700,3800],lc:[1000,1450,2050,2800]};
  // coefficient de secteur par code postal
  function sector(cp){
    if(/^750(0[1-8]|16)$/.test(cp)||cp==="75116")return 1.18;
    if(/^750(09|1[0145]|17)$/.test(cp))return 1;
    if(/^750(1[2389]|20)$/.test(cp))return .88;
    if(/^92(200|100|300|130|170)$/.test(cp))return .95; // Neuilly, Boulogne, Levallois, Issy, Vanves
    if(/^9[234]\d{3}$/.test(cp))return .78;
    return 0;
  }
  function lerp(arr,m){var s=M.s;if(m<=s[0])return arr[0]*m/s[0];for(var i=1;i<s.length;i++)if(m<=s[i])return arr[i-1]+(arr[i]-arr[i-1])*(m-s[i-1])/(s[i]-s[i-1]);return arr[3]*m/s[3]}
  var cp=document.getElementById("s-cp"),m2=document.getElementById("s-m2"),msg=document.getElementById("sim-msg"),q=1,
      rows=document.querySelectorAll("#sim-res .r"),fmt=new Intl.NumberFormat("fr-FR"),
      fcp=document.getElementById("f-cp"),fsim=document.getElementById("f-sim");
  function r50(x){return fmt.format(Math.round(x/50)*50)}
  function reset(t){rows.forEach(function(r){r.classList.remove("best");r.querySelector(".v").textContent="—";r.querySelector(".n b").textContent="";r.querySelector(".bar i").style.width="0"});msg.innerHTML=t;if(fsim)fsim.value=""}
  function run(){
    var c=cp.value.replace(/\D/g,"").slice(0,5),m=+m2.value.replace(/\D/g,"");
    if(c.length<5||!m)return reset("Indiquez le code postal et la surface : <em>l’estimation s’affiche aussitôt</em>.");
    if(m<9||m>400)return reset("Indiquez une surface entre 9 et 400 m².");
    var k=sector(c);
    if(!k)return reset("Ce simulateur couvre Paris et la proche banlieue. <em>Une conciergerie de notre réseau peut estimer votre bien</em> : laissez-nous vos coordonnées ci-dessous.");
    var v={cd:lerp(M.nuit,m)*k*q*30.4*M.occ,bm:lerp(M.bm,m)*k*q,lc:lerp(M.lc,m)*k*q},
        net={cd:v.cd*.8,bm:v.bm*.85,lc:v.lc},max=Math.max(net.cd,net.bm,net.lc),best="",summ=[];
    for(var x in net)if(net[x]===max)best=x;
    rows.forEach(function(r){var key=r.dataset.k;
      r.querySelector(".v").innerHTML=r50(v[key]*.9)+" – "+r50(v[key]*1.1)+"<small>€</small>";
      r.querySelector(".n b").textContent=key==="lc"?"":"≈ "+r50(net[key])+" € nets";
      r.querySelector(".bar i").style.width=Math.round(net[key]/max*100)+"%";
      r.classList.toggle("best",key===best);
      summ.push(key.toUpperCase()+" "+r50(v[key])+" €");
    });
    var gain=Math.round((net[best]/net.lc-1)*100);
    msg.innerHTML=best==="lc"?"Pour ce bien, la location classique reste la plus sûre.":"Jusqu’à <em>"+gain+" % de plus</em> qu’en location classique, sans vous en occuper.";
    if(fsim)fsim.value=c+" · "+m+" m² · "+summ.join(" / ");
    if(fcp&&!fcp.value){fcp.value=c;fcp.dispatchEvent(new Event("input"))}
  }
  document.querySelectorAll("#sim [data-q]").forEach(function(b,i,all){b.addEventListener("click",function(){all.forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});q=+b.dataset.q;run()})});
  document.getElementById("sim").addEventListener("submit",function(e){e.preventDefault()});
  cp.addEventListener("input",run);m2.addEventListener("input",run);
})();
