'use strict';
(()=>{
const $=id=>document.getElementById(id),KEY='mini-games-snake-v1',STATS='mini-games-snake-stats-v1';
const canvas=$('snake-canvas'),ctx=canvas.getContext('2d');
const vectors={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
let n=12,speed='slow',snake=[],previous=[],dir='right',queue=[],apple=null,score=0,seconds=0,phase='ready',last=0,acc=0,clockAcc=0,sound=false;
let stats={games:0,best:0,totalApples:0,longest:3,achievements:[]};
const savedStats=read(STATS);if(savedStats&&typeof savedStats==='object')stats={...stats,...savedStats,achievements:Array.isArray(savedStats.achievements)?savedStats.achievements:[]};
function duration(){return {slow:280,normal:210,fast:145}[speed]||210}
function fmt(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0')}
function fresh(){const m=Math.floor(n/2);snake=[{x:m,y:m},{x:m-1,y:m},{x:m-2,y:m}];previous=snake.map(p=>({...p}));dir='right';queue=[];score=0;seconds=0;acc=0;clockAcc=0;phase='ready';apple=spawn();renderInfo();showOverlay('Змейка готова!','Собирай яблоки и не кусай хвост','▶ Играть');draw(1)}
function spawn(){const occupied=new Set(snake.map(p=>p.x+','+p.y)),free=[];for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(!occupied.has(x+','+y))free.push({x,y});return free.length?free[Math.floor(Math.random()*free.length)]:null}
function showOverlay(title,detail,button){$('snake-message').textContent=title;$('snake-detail').textContent=detail;$('snake-play').textContent=button;$('snake-overlay').classList.remove('hidden')}
function hideOverlay(){$('snake-overlay').classList.add('hidden')}
function renderInfo(){
 $('snake-score').textContent=score;$('snake-best').textContent=stats.best;$('snake-length').textContent=snake.length;$('snake-time').textContent=fmt(seconds);
 $('snake-pause').textContent=phase==='running'?'Ⅱ Пауза':'▶ Продолжить';
 $('snake-stats').textContent='Партий: '+stats.games+' · Съедено яблок: '+stats.totalApples+' · Рекорд: '+stats.best+' · Максимальная длина: '+stats.longest;
 const el=$('snake-achievements');el.replaceChildren();for(const t of [1,5,10,20,50]){const item=document.createElement('span'),earned=stats.achievements.includes(t);item.className='achievement'+(earned?' earned':'');item.textContent=(earned?'★ ':'☆ ')+t+' яблок';el.append(item)}
}
function saveStats(){write(STATS,stats)}
function saveSession(){write(KEY,{n,speed,snake,previous,dir,apple,score,seconds,phase:phase==='running'?'paused':phase})}
function start(){if(phase==='over'){fresh()}if(phase==='ready')stats.games++;phase='running';last=performance.now();hideOverlay();renderInfo();saveStats();saveSession()}
function pause(){if(phase==='running'){phase='paused';showOverlay('Пауза','Продолжим, когда будешь готов','▶ Продолжить')}else if(phase==='paused')start();renderInfo();saveSession()}
function end(){phase='over';stats.best=Math.max(stats.best,score);stats.longest=Math.max(stats.longest,snake.length);saveStats();saveSession();renderInfo();showOverlay('Игра окончена','Собрано яблок: '+score,'↻ Ещё раз');try{window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error')}catch{}}
function turn(next){if(!vectors[next]||phase==='over')return;const lastDir=queue.length?queue[queue.length-1]:dir;if(vectors[next].x===-vectors[lastDir].x&&vectors[next].y===-vectors[lastDir].y)return;if(next!==lastDir&&queue.length<2)queue.push(next)}
function step(){
 if(queue.length)dir=queue.shift();
 const v=vectors[dir],head={x:snake[0].x+v.x,y:snake[0].y+v.y},eat=apple&&head.x===apple.x&&head.y===apple.y;
 head.x=(head.x+n)%n;head.y=(head.y+n)%n;
 const body=eat?snake:snake.slice(0,-1);
 if(body.some(p=>p.x===head.x&&p.y===head.y)){end();return}
 previous=snake.map(p=>({...p}));snake.unshift(head);if(!eat)snake.pop();
 if(eat){score++;stats.totalApples++;stats.best=Math.max(stats.best,score);stats.longest=Math.max(stats.longest,snake.length);for(const t of [1,5,10,20,50])if(score>=t&&!stats.achievements.includes(t))stats.achievements.push(t);apple=spawn();saveStats();try{window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')}catch{};if(sound)beep();if(!apple){end();return}}
 renderInfo();saveSession();
}
let audio;function beep(){try{audio??=new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=570;o.type='sine';g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.09);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.09)}catch{}}
function draw(alpha){
 const w=canvas.width,cell=w/n;ctx.clearRect(0,0,w,w);
 // The notebook's blue grid remains visible behind the transparent playfield.
 if(apple){const x=(apple.x+.5)*cell,y=(apple.y+.52)*cell;ctx.fillStyle='#d56770';ctx.strokeStyle='#ad3e50';ctx.lineWidth=2.8;ctx.beginPath();ctx.arc(x,y,cell*.3,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#367c43';ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(x,y-cell*.24);ctx.quadraticCurveTo(x+cell*.18,y-cell*.48,x+cell*.28,y-cell*.34);ctx.stroke()}
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const t=reduced?1:Math.max(0,Math.min(1,alpha));
 const points=snake.map((p,i)=>{const old=previous[i]||previous[previous.length-1]||p;const adjacent=Math.abs(p.x-old.x)+Math.abs(p.y-old.y)<=1;return{x:((adjacent?old.x+(p.x-old.x)*t:p.x)+.5)*cell,y:((adjacent?old.y+(p.y-old.y)*t:p.y)+.5)*cell}});
 // A single continuous rounded ink stroke avoids overlapping circle outlines.
 ctx.strokeStyle='#286d92';ctx.lineWidth=cell*.56;ctx.lineCap='round';ctx.lineJoin='round';
 for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1];if(Math.abs(a.x-b.x)>cell*1.6||Math.abs(a.y-b.y)>cell*1.6)continue;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
 const head=points[0],d=vectors[dir],px=-d.y,py=d.x;
 ctx.fillStyle='#24477c';ctx.beginPath();ctx.arc(head.x,head.y,cell*.38,0,Math.PI*2);ctx.fill();
 // White eyes and a red nose clearly show the direction of travel.
 ctx.fillStyle='#faf8ef';for(const side of [-1,1]){ctx.beginPath();ctx.arc(head.x+d.x*cell*.13+px*side*cell*.18,head.y+d.y*cell*.13+py*side*cell*.18,cell*.078,0,Math.PI*2);ctx.fill()}
 ctx.fillStyle='#d56770';ctx.beginPath();ctx.arc(head.x+d.x*cell*.35,head.y+d.y*cell*.35,cell*.09,0,Math.PI*2);ctx.fill();
}
function frame(now){const delta=Math.min(100,Math.max(0,now-last));last=now;if(phase==='running'&&!document.hidden){acc+=delta;clockAcc+=delta;seconds+=delta/1000;const interval=duration();if(acc>=interval){acc%=interval;step()}if(clockAcc>=500){clockAcc=0;renderInfo()}}draw(phase==='running'?acc/duration():1);requestAnimationFrame(frame)}
function enter(){if(!$('game').classList.contains('hidden')){const b=$('back');b.click()}$('home').classList.add('hidden');$('snake-screen').classList.remove('hidden');last=performance.now();draw(1)}
function leave(){if(phase==='running')pause();$('snake-screen').classList.add('hidden');$('home').classList.remove('hidden')}
$('openSnake').onclick=enter;$('snake-back').onclick=leave;$('snake-play').onclick=start;$('snake-pause').onclick=pause;
$('snake-restart').onclick=()=>{if(phase==='running'&&!confirm('Начать Змейку заново?'))return;fresh();saveSession()};
$('snake-speed').onchange=e=>{if(phase==='running'&&!confirm('Изменить скорость и начать заново?')){e.target.value=speed;return}speed=e.target.value;fresh();saveSession()};
$('snake-size').onchange=e=>{if(phase==='running'&&!confirm('Изменить размер поля и начать заново?')){e.target.value=String(n);return}n=Number(e.target.value);fresh();saveSession()};
$('snake-sound').onclick=()=>{sound=!sound;$('snake-sound').textContent=sound?'♪ вкл.':'♪ выкл.'};
document.querySelectorAll('[data-snake-dir]').forEach(b=>b.onclick=()=>turn(b.dataset.snakeDir));
document.addEventListener('keydown',e=>{if($('snake-screen').classList.contains('hidden'))return;const d={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.key];if(d){e.preventDefault();turn(d)}if(e.code==='Space'){e.preventDefault();if(phase==='ready'||phase==='over')start();else pause()}});
let touch=null;canvas.addEventListener('touchstart',e=>{if(e.touches.length===1)touch={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});
canvas.addEventListener('touchmove',e=>{if(touch)e.preventDefault()},{passive:false});
canvas.addEventListener('touchend',e=>{if(!touch)return;const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;touch=null;if(Math.max(Math.abs(dx),Math.abs(dy))<16)return;turn(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up')},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='running')pause()});
const s=read(KEY);if(s&&[12,16,20].includes(s.n)&&['slow','normal','fast'].includes(s.speed)&&Array.isArray(s.snake)&&s.snake.length>=3&&s.snake.every(p=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<s.n&&p.y<s.n)){n=s.n;speed=s.speed;snake=s.snake;previous=snake.map(p=>({...p}));dir=vectors[s.dir]?s.dir:'right';apple=s.apple;score=Number.isFinite(s.score)?s.score:0;seconds=Number.isFinite(s.seconds)?s.seconds:0;phase=s.phase==='over'?'over':'paused';$('snake-size').value=String(n);$('snake-speed').value=speed;renderInfo();showOverlay(phase==='over'?'Игра окончена':'Продолжить Змейку','Собрано яблок: '+score,phase==='over'?'↻ Ещё раз':'▶ Продолжить')}else fresh();
last=performance.now();requestAnimationFrame(frame);
})();
