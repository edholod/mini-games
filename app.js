'use strict';
const tg=window.Telegram?.WebApp;try{tg?.ready();tg?.expand();tg?.setHeaderColor('#faf8ef');tg?.setBackgroundColor('#faf8ef')}catch(e){}
const $=id=>document.getElementById(id),KEY='notebook2048-v2',LEGACY='notebook2048-v1',WALLET_KEY='mini-games-wallet-v1',STATS_KEY='mini-games-2048-stats-v1',UNDO_COST=1;
const targets=[128,256,512,1024,2048,4096,8192];
let size=4,mode='classic',board=[],score=0,won=false,keepPlaying=false,over=false,ended=false,moves=0,elapsed=0,startedAt=null,undoState=null,coins=0,sound=false,animating=false,stats={games:0,completed:0,totalMoves:0,bestTile:0,bestScore:0,bestBySize:{},achievements:[]},lastFrame=0;
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null}}
function write(key,data){try{localStorage.setItem(key,JSON.stringify(data))}catch(e){}}
function validBoard(b,n){return Array.isArray(b)&&b.length===n*n&&b.every(v=>Number.isSafeInteger(v)&&v>=0&&(v===0||(v&(v-1))===0))}
function loadWallet(){const w=read(WALLET_KEY);if(w&&Number.isSafeInteger(w.balance)&&w.balance>=0)coins=w.balance;else{const old=read(LEGACY);coins=Number.isSafeInteger(old?.coins)&&old.coins>=0?old.coins:0;saveWallet()}}
function saveWallet(){write(WALLET_KEY,{balance:coins})}
function save(){write(KEY,{size,mode,board,score,won,keepPlaying,over,ended,moves,elapsed:timeNow(),startedAt:startedAt?Date.now():null,undoState})}
function saveStats(){write(STATS_KEY,stats)}
function timeNow(){return elapsed+(startedAt?(Date.now()-startedAt)/1000:0)}
function remaining(){return mode==='classic'?Infinity:Math.max(0,Number(mode)-timeNow())}
function clock(t){const s=Math.max(0,Math.floor(t));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function load(){
 const s=read(KEY)||read(LEGACY);
 const n=[3,4,5,6].includes(s?.size)?s.size:4;
 if(validBoard(s?.board,n)){size=n;mode=['classic','60','180','300'].includes(s.mode)?s.mode:'classic';board=s.board;score=Number.isFinite(s.score)?s.score:0;won=!!s.won;keepPlaying=!!s.keepPlaying;over=!!s.over;ended=!!s.ended;moves=Number.isInteger(s.moves)?s.moves:0;elapsed=Number.isFinite(s.elapsed)?s.elapsed:0;undoState=validBoard(s.undoState?.board,n)?s.undoState:null;
 // Timed games resume from saved elapsed play time, not background wall time.
 startedAt=null;
 }else{newGame(false)}
 $('size').value=String(size);$('mode').value=mode;
}
function addTile(){const empty=board.map((v,i)=>v?-1:i).filter(i=>i>=0);if(empty.length)board[empty[Math.floor(Math.random()*empty.length)]]=Math.random()<.9?2:4}
function newGame(count=true){if(startedAt){elapsed=timeNow();startedAt=null}board=Array(size*size).fill(0);score=0;won=false;keepPlaying=false;over=false;ended=false;moves=0;elapsed=0;undoState=null;addTile();addTile();if(count){stats.games++;saveStats()}save();render()}
function updateAchievements(){let changed=false;const tile=Math.max(0,...board);stats.bestTile=Math.max(stats.bestTile,tile);stats.bestScore=Math.max(stats.bestScore,score);stats.bestBySize[size]=Math.max(stats.bestBySize[size]||0,score);
 for(const t of targets)if(tile>=t&&!stats.achievements.includes('tile'+t)){stats.achievements.push('tile'+t);changed=true}
 if(moves>=100&&!stats.achievements.includes('moves100')){stats.achievements.push('moves100');changed=true}
 if(score>=10000&&!stats.achievements.includes('score10000')){stats.achievements.push('score10000');changed=true}
 saveStats();return changed;
}
function finish(reason){if(ended)return;elapsed=timeNow();startedAt=null;ended=true;over=reason==='blocked';stats.completed++;updateAchievements();save();render()}
function tick(){if(startedAt&&!ended){$('timer').textContent=clock(mode==='classic'?timeNow():remaining());if(mode!=='classic'&&remaining()<=0)finish('time')}requestAnimationFrame(tick)}
function render(){
 const grid=$('board');grid.style.setProperty('--size',size);grid.dataset.size=size;grid.replaceChildren();
 board.forEach(v=>{const c=document.createElement('div');c.className='cell'+(v?' tile':'');c.setAttribute('role','gridcell');c.setAttribute('aria-label',v?String(v):'пусто');if(v){c.dataset.value=v;c.textContent=v}grid.append(c)});
 $('score').textContent=score;$('best').textContent=stats.bestBySize[size]||score;$('moves').textContent=moves;
 $('timer').textContent=clock(mode==='classic'?timeNow():remaining());$('size').value=String(size);$('mode').value=mode;
 document.querySelectorAll('[data-wallet-balance]').forEach(el=>el.textContent=coins);
 $('undo').disabled=!undoState||coins<UNDO_COST||animating||ended;$('undo').textContent='↶ Отмена · 1 ◉';
 const show=ended||(won&&!keepPlaying&&mode==='classic');
 $('overlay').classList.toggle('hidden',!show);
 $('overlay-title').textContent=ended?(over?'Ходов нет!':'Время вышло!'):'2048! Ура!';
 $('overlay-text').textContent=ended?'Счёт: '+score:'Ты собрал 2048!';
 $('continue').classList.toggle('hidden',ended||mode!=='classic');
 $('stats').textContent='Партий: '+stats.games+' · Завершено: '+stats.completed+' · Всего ходов: '+stats.totalMoves+' · Лучший счёт: '+stats.bestScore+' · Лучшая плитка: '+stats.bestTile;
 $('achievements').replaceChildren();
 for(const t of targets){const e=document.createElement('span');const got=stats.achievements.includes('tile'+t);e.className='achievement'+(got?' earned':'');e.textContent=(got?'★ ':'☆ ')+t;$('achievements').append(e)}
 for(const [key,label] of [['moves100','100 ходов'],['score10000','10 000 очков']]){const e=document.createElement('span');const got=stats.achievements.includes(key);e.className='achievement'+(got?' earned':'');e.textContent=(got?'★ ':'☆ ')+label;$('achievements').append(e)}
}
function canMove(){if(board.includes(0))return true;for(let r=0;r<size;r++)for(let c=0;c<size;c++){const v=board[r*size+c];if(c<size-1&&board[r*size+c+1]===v)return true;if(r<size-1&&board[(r+1)*size+c]===v)return true}return false}
function undoMove(){if(animating||ended||!undoState)return;if(coins<UNDO_COST)return;const p=undoState;board=p.board.slice();score=p.score;won=p.won;keepPlaying=p.keepPlaying;over=p.over;moves=p.moves;/* Undo restores the board, not elapsed match time. */coins--;saveWallet();undoState=null;save();render()}
function move(dir){
 if(animating||ended||over||(won&&!keepPlaying&&mode==='classic'))return;
 if(mode!=='classic'&&remaining()<=0){finish('time');return}
 const old=board.slice(),next=Array(size*size).fill(0),tracks=[],merges=[];let gained=0;
 const snapshot={board:old,score,won,keepPlaying,over,moves,elapsed:timeNow(),running:!!startedAt};
 for(let n=0;n<size;n++){
  const ids=[];for(let k=0;k<size;k++){if(dir==='left')ids.push(n*size+k);if(dir==='right')ids.push(n*size+size-1-k);if(dir==='up')ids.push(k*size+n);if(dir==='down')ids.push((size-1-k)*size+n)}
  const active=ids.filter(i=>old[i]);let slot=0;
  for(let k=0;k<active.length;k++){const src=active[k],dest=ids[slot],value=old[src];if(k+1<active.length&&old[active[k+1]]===value){next[dest]=value*2;gained+=value*2;tracks.push({src,dest},{src:active[k+1],dest});merges.push(dest);k++}else{next[dest]=value;tracks.push({src,dest})}slot++}
 }
 if(next.every((v,i)=>v===old[i]))return;
 if(!startedAt)startedAt=Date.now();
 animating=true;
 const grid=$('board'),cells=Array.from(grid.children),rect=grid.getBoundingClientRect(),layer=document.createElement('div');layer.className='motion-layer';grid.append(layer);
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const duration=reduced?0:175;
 for(const t of tracks){const from=cells[t.src].getBoundingClientRect(),to=cells[t.dest].getBoundingClientRect(),el=cells[t.src].cloneNode(true);el.classList.add('moving-tile');Object.assign(el.style,{left:(from.left-rect.left-grid.clientLeft)+'px',top:(from.top-rect.top-grid.clientTop)+'px',width:from.width+'px',height:from.height+'px',margin:'0'});layer.append(el);if(duration&&el.animate)el.animate([{transform:'translate(0,0)'},{transform:'translate('+(to.left-from.left)+'px,'+(to.top-from.top)+'px)'}],{duration,easing:'cubic-bezier(.2,.7,.25,1)',fill:'forwards'})}
 cells.forEach(el=>{if(el.classList.contains('tile'))el.style.visibility='hidden'});
 setTimeout(()=>{
  board=next;score+=gained;moves++;stats.totalMoves++;undoState=snapshot;addTile();if(!won&&board.some(v=>v>=2048))won=true;
  over=!canMove();updateAchievements();animating=false;
  const destinations=new Set(tracks.map(t=>t.dest));render();const fresh=Array.from(grid.children);
  if(!reduced)fresh.forEach((el,i)=>{if(board[i]&&!destinations.has(i)&&el.animate)el.animate([{opacity:0,transform:'scale(.45)'},{opacity:1,transform:'scale(1)'}],{duration:190,easing:'ease-out'});if(merges.includes(i)&&el.animate)el.animate([{transform:'scale(.82)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:240,easing:'ease-out'})});
  if(over)finish('blocked');else if(mode!=='classic'&&remaining()<=0)finish('time');else save();
  try{tg?.HapticFeedback?.impactOccurred(merges.length?'medium':'light')}catch(e){}
  if(sound)beep();
 },duration+10);
}
let audio;function beep(){try{audio??=new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=440;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.09);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.09)}catch(e){}}
function screen(which){$('home').classList.toggle('hidden',which!=='home');$('game').classList.toggle('hidden',which!=='game');if(which==='game'){if(!ended&&moves>0&&!startedAt)startedAt=Date.now();render()}}
function changeSetting(){const n=Number($('size').value),m=$('mode').value;if(n===size&&m===mode)return;if(!confirm('Начать новую партию с выбранными настройками?')){render();return}size=n;mode=m;newGame()}
$('open2048').onclick=()=>screen('game');$('back').onclick=()=>{if(startedAt){elapsed=timeNow();startedAt=null;save()}screen('home')};
$('size').onchange=changeSetting;$('mode').onchange=changeSetting;
$('restart').onclick=()=>{if(confirm('Начать новую игру? Текущий счёт сбросится.'))newGame()};$('retry').onclick=()=>newGame();$('undo').onclick=undoMove;
$('continue').onclick=()=>{keepPlaying=true;save();render()};$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'♪ вкл.':'♪ выкл.'};
document.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>move(b.dataset.dir));
document.addEventListener('keydown',e=>{if($('game').classList.contains('hidden'))return;const dir={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.key];if(dir){e.preventDefault();move(dir)}});
let start=null;const area=$('board');area.addEventListener('touchstart',e=>{if(e.touches.length===1)start={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});area.addEventListener('touchmove',e=>{if(start)e.preventDefault()},{passive:false});area.addEventListener('touchend',e=>{if(!start)return;const t=e.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y;start=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;move(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up')},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&startedAt){elapsed=timeNow();startedAt=null;save()}});
window.addEventListener('pagehide',()=>{if(startedAt){elapsed=timeNow();startedAt=null;save()}});
loadWallet();const savedStats=read(STATS_KEY);if(savedStats&&typeof savedStats==='object')stats={...stats,...savedStats,bestBySize:savedStats.bestBySize||{},achievements:Array.isArray(savedStats.achievements)?savedStats.achievements:[]};load();if(!stats.games){stats.games=1;const old=read(LEGACY);if(Number.isFinite(old?.best))stats.bestBySize[4]=Math.max(stats.bestBySize[4]||0,old.best);updateAchievements()}render();requestAnimationFrame(tick);
