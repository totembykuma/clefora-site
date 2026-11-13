(function(){
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var peek=document.getElementById('peek'),art=peek&&peek.querySelector('.peek-art');
var rooms=[].slice.call(document.querySelectorAll('.room'));
var body=document.body,curTint=null,ticking=false,lastP=-1;
function clamp(x){return x<0?0:x>1?1:x}
function frame(){
  ticking=false;var vh=innerHeight;
  if(peek&&!reduce){var r=peek.getBoundingClientRect(),p=clamp(-r.top/(r.height-vh));
    if(p!==lastP){lastP=p;var e=p*p*(3-2*p);
      art.style.setProperty('--m',(34+e*700).toFixed(2));art.style.setProperty('--z',(1.4-e*.4).toFixed(4));
      peek.style.setProperty('--h',(1-clamp(p*4)).toFixed(3));peek.style.setProperty('--t',clamp((p-.72)/.22).toFixed(3));}}
  var tint=null;
  for(var i=0;i<rooms.length;i++){var b=rooms[i].getBoundingClientRect();if(b.top<vh*.5&&b.bottom>vh*.5){tint=rooms[i].dataset.tint;break}}
  if(tint!==curTint){curTint=tint;body.style.backgroundColor=tint||''}
}
function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(frame)}}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll,{passive:true});frame();

/* Loupe serrure (souris uniquement) */
var fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
rooms.forEach(function(s){
  var cmp=s.querySelector('.cmp');if(!cmp)return;cmp.style.setProperty('--v',100);
  if(!fine)return;
  var lens=s.querySelector('.lens'),inner=lens.firstChild,Z=2.6,loaded=false,pend=null,raf=0,rect=null;
  cmp.addEventListener('mouseenter',function(){rect=cmp.getBoundingClientRect();
    if(!loaded){loaded=true;var im=new Image();im.decoding='async';im.src=cmp.dataset.hd;inner.style.backgroundImage='url('+cmp.dataset.hd+')'}
    inner.style.backgroundSize=(rect.width*Z)+'px '+(rect.height*Z)+'px'});
  function draw(){raf=0;if(!pend)return;var x=pend[0],y=pend[1];
    lens.style.transform='translate3d('+(x-95)+'px,'+(y-110)+'px,0)';
    inner.style.backgroundPosition=(-(x*Z-95))+'px '+(-(y*Z-110))+'px'}
  cmp.addEventListener('mousemove',function(e){if(!rect)rect=cmp.getBoundingClientRect();pend=[e.clientX-rect.left,e.clientY-rect.top];if(!raf)raf=requestAnimationFrame(draw)});
  addEventListener('scroll',function(){rect=null},{passive:true});
});

/* La couleur se peint sur l'affiche, une fois, à l'arrivée sur l'œuvre */
if('IntersectionObserver' in window&&!reduce){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;io.unobserve(e.target);
    var cmp=e.target.querySelector('.cmp'),t0=null;cmp.style.setProperty('--v',0);
    setTimeout(function(){requestAnimationFrame(function step(t){t0=t0||t;var p=clamp((t-t0)/1800);cmp.style.setProperty('--v',(100*p*p*(3-2*p)).toFixed(1));if(p<1)requestAnimationFrame(step)})},400)})},{threshold:.45});
  rooms.forEach(function(s){io.observe(s)});
}
})();
