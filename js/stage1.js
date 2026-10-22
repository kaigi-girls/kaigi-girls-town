(function(){
var YT='https://www.youtube.com/@robo-fukabori?sub_confirmation=1';
if(!document.body.classList.contains('hq')){
var bar=document.createElement('div');bar.className='subbar';
bar.innerHTML='<span>YouTube「ロボくんのマイクラ部」</span><a href="'+YT+'" target="_blank" rel="noopener">▶ YouTubeで登録</a>';
document.body.appendChild(bar);
}
var base=document.currentScript?document.currentScript.src.replace(/js\/stage1\.js.*$/,''):'';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
// main episodes only: numbered, no kind (MV etc.), not a Short
function ytId(u){var m=/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([\w-]{11})/.exec(u||'');return m?m[1]:''}
function isMain(v){return !v.hidden&&!!v.number&&!v.kind&&!/\/shorts\//.test(v.url||'')&&ytId(v.url)!=='obhO8MeWjVM'}
function newest(a,b){return (b.date||'').localeCompare(a.date||'')||((+b.number||0)-(+a.number||0))}
var data=fetch(base+'data/videos.json').then(function(r){if(!r.ok)throw new Error('videos.json '+r.status);return r.json()});
// トップ「最新の本編」
var lt=document.getElementById('latestEp');
if(lt)data.then(function(d){
 var v=(d.videos||[]).filter(isMain).sort(newest)[0];if(!v)return;
 var id=ytId(v.url);lt.href=id?'https://www.youtube.com/watch?v='+id:v.url;
 var img=document.getElementById('latestImg');img.src=id?'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg':v.thumbnail;img.alt=v.title||'';
 document.getElementById('latestTitleText').textContent=(v.number&&!/#\d/.test(v.title||'')?'#'+String(v.number).padStart(2,'0')+' ':'')+(v.title||'');
 document.getElementById('latestMeta').textContent=[v.date,v.host,v.genre].filter(Boolean).join(' · ');
}).catch(function(){document.getElementById('latestTitleText').textContent='YouTubeで最新回を見る'});
var el=document.getElementById('vlist');if(!el)return;
var limit=+el.dataset.limit||0,mainOnly=el.dataset.main==='1';
data.then(function(d){
 var vs=(d.videos||[]).filter(function(v){return !v.hidden&&(!mainOnly||isMain(v))}).sort(newest);
 function draw(g){var l=vs.filter(function(v){return !g||v.genre===g});if(limit)l=l.slice(0,limit);
  el.innerHTML=l.map(function(v){var c=(d.hosts&&d.hosts[v.host])||{};return '<a class="vcard" href="'+esc(v.url)+'" target="_blank" rel="noopener" style="border-top:4px solid '+esc(c.deep||'#3f86d6')+'"><img loading="lazy" src="'+(/^https?:/.test(v.thumbnail)?'':base)+esc(v.thumbnail)+'" alt=""><div><b>'+(v.number?'#'+esc(v.number)+' ':(v.kind?esc(v.kind)+' ':''))+esc(v.title)+'</b>'+esc(v.summary)+'<br><small>'+esc(v.date)+' · '+esc(v.host)+' · '+esc(v.genre)+'</small></div></a>'}).join('')||'<p>動画はまだありません。</p>'}
 var f=document.getElementById('vfilter');
 if(f){var gs=[''].concat(vs.map(function(v){return v.genre}).filter(function(g,i,a){return g&&a.indexOf(g)===i}));
  f.innerHTML=gs.map(function(g){return '<button type="button" data-g="'+esc(g)+'" aria-pressed="'+(g===''?'true':'false')+'">'+(g||'すべて')+'</button>'}).join('');
  f.onclick=function(e){var b=e.target.closest('button');if(!b)return;[].forEach.call(f.children,function(x){x.setAttribute('aria-pressed',x===b)});draw(b.dataset.g)}}
 draw('');
}).catch(function(){el.innerHTML='<p>動画リストを読み込めませんでした。<a href="https://www.youtube.com/@robo-fukabori">YouTubeで見る</a></p>'});
})();
(function(){
if(document.body.classList.contains('hq'))return;
var s=document.querySelector('script[src*="stage1.js"]');var base=s?s.src.replace(/js\/stage1\.js.*$/,''):'';
var L=[['計画のトップ',''],['進捗ボード','#board'],['制作チーム','#crew'],['海辺の街','town/'],['人間研究所','institute.html'],['ロボくんの部屋','robo.html'],['動画アーカイブ','lab/'],['音楽','#music'],['お知らせ','#news']];
var top=document.createElement('div');top.className='s1-top';
top.innerHTML='<span>KAIGI GIRLS計画</span><button type="button" class="s1-mbtn" aria-label="メニューを開く" aria-expanded="false" aria-controls="s1-menu">≡</button>';
var ov=document.createElement('div');ov.className='s1-ov';ov.hidden=true;
ov.innerHTML='<nav id="s1-menu" class="s1-menu" role="dialog" aria-modal="true" aria-label="メニュー"><button type="button" class="s1-close" aria-label="メニューを閉じる">×</button><ul>'+L.map(function(l){var h=l[1].charAt(0)==='#'?base+l[1]:base+l[1];return '<li><a href="'+h+'">'+l[0]+'</a></li>'}).join('')+'</ul></nav>';
document.body.insertBefore(top,document.body.firstChild);document.body.appendChild(ov);
var btn=top.querySelector('button');
function open(){ov.hidden=false;btn.setAttribute('aria-expanded','true');ov.querySelector('a').focus()}
function close(){ov.hidden=true;btn.setAttribute('aria-expanded','false');btn.focus()}
btn.onclick=open;ov.querySelector('.s1-close').onclick=close;
ov.addEventListener('click',function(e){if(e.target===ov||e.target.closest('a'))close()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!ov.hidden)close()});
})();
