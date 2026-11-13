(function(){var lb=document.getElementById('lb');if(!lb)return;var c=lb.querySelector('.canvas'),t=lb.querySelector('.cartel');
function open(w){var s=w.querySelector('.canvas');c.style.cssText=s.style.cssText;var f=w.querySelector('figcaption');t.innerHTML='<b>'+f.querySelector('b').textContent+'</b>, '+f.querySelectorAll('span')[1].textContent;lb.hidden=false}
document.querySelectorAll('.work').forEach(function(w){w.addEventListener('click',function(){open(w)});w.addEventListener('keydown',function(e){if(e.key==='Enter')open(w)})});
lb.addEventListener('click',function(e){if(e.target===lb||e.target.classList.contains('lb-x'))lb.hidden=true});
document.addEventListener('keydown',function(e){if(e.key==='Escape')lb.hidden=true});
document.querySelectorAll('.filters button').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('.filters button').forEach(function(x){x.classList.remove('on')});b.classList.add('on')})})})();
