'use strict';
const tg=window.Telegram?.WebApp;try{tg?.ready();tg?.expand();tg?.setHeaderColor('#faf8ef');tg?.setBackgroundColor('#faf8ef')}catch(e){}
const $=id=>document.getElementById(id), KEY='notebook2048-v1';
let board=Array(16).fill(0),score=0,best=0,won=false,keepPlaying=false,over=false,sound=false;
function load(){try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');best=Number.isFinite(s.best)?s.best:0;if(Array.isArray(s.board)&&s.board.length===16&&s.board.every(n=>Number.isInteger(n)&&n>=0&&(n===0||(n&(n-1))===0))){board=s.board;score=Number.isFinite(s.score)?s.score:0;won=!!s.won;keepPlaying=!!s.keepPlaying;over=!!s.over;return}}catch(e){}newGame()}
function save(){try{localStorage.setItem(KEY,JSON.stringify({board,score,best,won,keepPlaying,over}))}catch(e){}}
function addTile(){const empty=board.map((v,i)=>v? -1:i).filter(i=>i>=0);if(!empty.length)return;board[empty[Math.floor(Math.random()*empty.length)]]=Math.random()<.9?2:4}
function newGame(){board=Array(16).fill(0);score=0;won=false;keepPlaying=false;over=false;addTile();addTile();save();render()}
function render(){const b=$('board');b.replaceChildren();board.forEach((v,i)=>{const c=document.createElement('div');c.className='cell'+(v?' tile':'');c.setAttribute('role','gridcell');c.setAttribute('aria-label',v?String(v):'пусто');if(v){c.dataset.value=v;c.textContent=v}b.append(c)});$('score').textContent=score;$('best').textContent=best;const show=over||(won&&!keepPlaying);$('overlay').classList.toggle('hidden',!show);$('overlay-title').textContent=over?'Ходов нет!':'2048! Ура!';$('overlay-text').textContent=over?'Попробуем ещё раз?':'Ты собрал 2048!';$('continue').classList.toggle('hidden',over)}
function merge(line){const a=line.filter(Boolean),out=[];let gain=0;for(let i=0;i<a.length;i++){if(i+1<a.length&&a[i]===a[i+1]){const v=a[i]*2;out.push(v);gain+=v;i++}else out.push(a[i])}while(out.length<4)out.push(0);return {out,gain}}
function canMove(){if(board.some(v=>!v))return true;for(let r=0;r<4;r++)for(let c=0;c<4;c++){const v=board[r*4+c];if(c<3&&board[r*4+c+1]===v)return true;if(r<3&&board[(r+1)*4+c]===v)return true}return false}
let animating=false;
function move(dir){
 if(animating||over||(won&&!keepPlaying))return;
 const old=board.slice(),tracks=[],next=Array(16).fill(0);let gained=0;
 for(let n=0;n<4;n++){
  const ids=[];for(let k=0;k<4;k++){
   if(dir==='left')ids.push(n*4+k);
   if(dir==='right')ids.push(n*4+3-k);
   if(dir==='up')ids.push(k*4+n);
   if(dir==='down')ids.push((3-k)*4+n);
  }
  const active=ids.filter(i=>old[i]);let slot=0;
  for(let k=0;k<active.length;k++){
   const src=active[k],value=old[src],dest=ids[slot];
   if(k+1<active.length&&old[active[k+1]]===value){
    next[dest]=value*2;gained+=value*2;
    tracks.push({src,dest,value},{src:active[k+1],dest,value});k++;
   }else{next[dest]=value;tracks.push({src,dest,value})}
   slot++;
  }
 }
 if(next.every((v,i)=>v===old[i]))return;
 animating=true;
 const grid=$('board'),cells=Array.from(grid.children),rect=grid.getBoundingClientRect();
 const layer=document.createElement('div');layer.className='motion-layer';grid.append(layer);
 for(const t of tracks){
  const from=cells[t.src].getBoundingClientRect(),to=cells[t.dest].getBoundingClientRect();
  const el=cells[t.src].cloneNode(true);
  el.classList.add('moving-tile');
  Object.assign(el.style,{position:'absolute',left:(from.left-rect.left)+'px',top:(from.top-rect.top)+'px',width:from.width+'px',height:from.height+'px',margin:'0'});
  layer.append(el);
  el.animate([{transform:'translate(0,0)'},{transform:'translate('+(to.left-from.left)+'px,'+(to.top-from.top)+'px)'}],{duration:175,easing:'cubic-bezier(.2,.7,.25,1)',fill:'forwards'});
 }
 cells.forEach(el=>{if(el.classList.contains('tile'))el.style.visibility='hidden'});
 window.setTimeout(()=>{
  board=next;score+=gained;best=Math.max(score,best);
  const occupied=new Set(tracks.map(t=>t.dest));addTile();
  if(!won&&board.some(v=>v>=2048))won=true;
  over=!canMove();
  save();render();animating=false;
  const fresh=Array.from(grid.children);
  fresh.forEach((el,i)=>{
   if(!old[i]&&board[i]&&!occupied.has(i))el.animate([{opacity:0,transform:'scale(.45)'},{opacity:1,transform:'scale(1)'}],{duration:170,easing:'ease-out'});
   if(board[i]>old[i]&&tracks.filter(t=>t.dest===i).length===2)el.animate([{transform:'scale(.82)'},{transform:'scale(1.1)'},{transform:'scale(1)'}],{duration:210,easing:'ease-out'});
  });
  try{tg?.HapticFeedback?.impactOccurred('light')}catch(e){}
  if(sound)beep();
 },185);
}
let audio;function beep(){try{audio??=new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=440;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.09);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.09)}catch(e){}}
function screen(which){$('home').classList.toggle('hidden',which!=='home');$('game').classList.toggle('hidden',which!=='game');if(which==='game')render()}
$('open2048').onclick=()=>screen('game');$('back').onclick=()=>screen('home');$('restart').onclick=()=>{if(confirm('Начать новую игру? Текущий счёт сбросится.'))newGame()};$('retry').onclick=newGame;$('continue').onclick=()=>{keepPlaying=true;save();render()};$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'♪ вкл.':'♪ выкл.'};document.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>move(b.dataset.dir));
document.addEventListener('keydown',e=>{if($('game').classList.contains('hidden'))return;const dir={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.key];if(dir){e.preventDefault();move(dir)}});
let start=null;const area=$('board');area.addEventListener('touchstart',e=>{if(e.touches.length===1)start={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});area.addEventListener('touchmove',e=>{if(start)e.preventDefault()},{passive:false});area.addEventListener('touchend',e=>{if(!start)return;const t=e.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y;start=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;move(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up')},{passive:true});
load();render();