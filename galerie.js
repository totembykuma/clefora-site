(function(){var lb=document.getElementById('lb');if(!lb)return;var c=lb.querySelector('.canvas'),t=lb.querySelector('.cartel'),src={};
document.querySelectorAll('[data-i]').forEach(function(el){var cv=el.querySelector('.canvas');if(cv&&!src[el.dataset.i])src[el.dataset.i]={s:cv.style.cssText,cap:(el.querySelector('h3,b')||{}).textContent||''}});
function open(i){var d=src[i];if(!d)return;c.style.cssText=d.s;t.innerHTML='<b></b>';t.firstChild.textContent=d.cap;lb.hidden=false}
document.querySelectorAll('[data-i]').forEach(function(el){el.addEventListener('click',function(e){if(e.target.closest('a'))return;open(el.dataset.i)});el.addEventListener('keydown',function(e){if(e.key==='Enter')open(el.dataset.i)})});
lb.addEventListener('click',function(e){if(e.target===lb||e.target.classList.contains('lb-x'))lb.hidden=true});
document.addEventListener('keydown',function(e){if(e.key==='Escape')lb.hidden=true})})();
