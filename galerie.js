(function(){
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var peek=document.getElementById('peek'),art=peek&&peek.querySelector('.peek-art');
var rooms=[].slice.call(document.querySelectorAll('.room'));
function clamp(x){return x<0?0:x>1?1:x}
function frame(){
  if(peek&&!reduce){var r=peek.getBoundingClientRect(),p=clamp(-r.top/(r.height-innerHeight));
    var e=p*p*(3-2*p);art.style.setProperty('--m',34+e*700);art.style.setProperty('--z',1.4-e*.4);
    peek.style.setProperty('--h',1-clamp(p*4));peek.style.setProperty('--t',clamp((p-.72)/.22));}
  var tint=null;rooms.forEach(function(s){var r=s.getBoundingClientRect();if(r.top<innerHeight*.5&&r.bottom>innerHeight*.5)tint=s.dataset.tint});
  document.body.style.backgroundColor=tint||'';
}
addEventListener('scroll',function(){requestAnimationFrame(frame)},{passive:true});frame();
document.querySelectorAll('.room').forEach(function(s){
  var cmp=s.querySelector('.cmp'),rng=s.querySelector('input'),lens=s.querySelector('.lens'),hd=new Image(),Z=2.6;
  rng.addEventListener('input',function(){cmp.style.setProperty('--v',rng.value)});
  cmp.style.setProperty('--v',rng.value);
  cmp.addEventListener('mouseenter',function(){if(!hd.src){hd.src=cmp.dataset.hd;lens.firstChild.style.backgroundImage='url('+cmp.dataset.hd+')'}});
  cmp.addEventListener('mousemove',function(e){var r=cmp.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    lens.style.left=(x-95)+'px';lens.style.top=(y-110)+'px';
    lens.firstChild.style.backgroundSize=(r.width*Z)+'px '+(r.height*Z)+'px';
    lens.firstChild.style.backgroundPosition=(-(x*Z-95))+'px '+(-(y*Z-110))+'px'});
});
if('IntersectionObserver' in window&&!reduce){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;io.unobserve(e.target);
  var cmp=e.target.querySelector('.cmp'),rng=e.target.querySelector('input'),t0=null;rng.value=0;cmp.style.setProperty('--v',0);
  setTimeout(function(){requestAnimationFrame(function step(t){t0=t0||t;var p=clamp((t-t0)/1800),v=Math.round(100*p*p*(3-2*p));rng.value=v;cmp.style.setProperty('--v',v);if(p<1)requestAnimationFrame(step)})},500)})},{threshold:.45});
  document.querySelectorAll('.room').forEach(function(s){io.observe(s)})}
})();
