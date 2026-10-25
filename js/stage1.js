(function(){
if(document.body.classList.contains('hq'))return;
var s=document.querySelector('script[src*="stage1.js"]');var base=s?s.src.replace(/js\/stage1\.js.*$/,''):'';
var L=[['計画のトップ',''],['進捗ボード','#board'],['制作チーム','#crew'],['海辺の街','town/'],['音楽','#music'],['お知らせ','#news']];
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
