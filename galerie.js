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

})();
