// Génère linkedin/visuels/AAAA-MM-JJ.jpg (1080×1350) pour chaque post de linkedin/posts.json.
// Usage : node scripts/linkedin_visuels.js   (Playwright requis)
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const racine=path.join(__dirname,'..');const src=path.join(racine,'linkedin/visuels-src');
const {posts}=JSON.parse(fs.readFileSync(path.join(racine,'linkedin/posts.json'),'utf8'));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350}});
const g=fs.readFileSync(path.join(src,'gabarit.html'),'utf8');const tmp=path.join(src,'_tmp.html');
for(const post of posts){const v=post.visuel;if(!v)continue;let h=g;
 for(const k of ['photo','sur','l1','l2','cta'])h=h.replace('{'+k+'}',v[k]);
 fs.writeFileSync(tmp,h);await p.goto('file://'+tmp);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
 await p.screenshot({path:path.join(racine,'linkedin/visuels',post.date+'.jpg'),type:'jpeg',quality:86});}
fs.unlinkSync(tmp);await b.close();console.log('visuels générés');})();
