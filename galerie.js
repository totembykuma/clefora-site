(function(){var lb=document.getElementById('lb');if(!lb)return;var im=lb.querySelector('img');
function open(el){var s=el.querySelector('img');im.src=s.src;im.alt=s.alt;lb.hidden=false}
document.querySelectorAll('[data-i]').forEach(function(el){el.addEventListener('click',function(){open(el)});el.addEventListener('keydown',function(e){if(e.key==='Enter')open(el)})});
lb.addEventListener('click',function(e){if(e.target!==im)lb.hidden=true});
document.addEventListener('keydown',function(e){if(e.key==='Escape')lb.hidden=true})})();
