'use strict';
(()=>{
const $=id=>document.getElementById(id),canvas=$('flappy-canvas'),ctx=canvas.getContext('2d'),W=360,H=520,KEY='mini-games-flappy-v1',WALLET='mini-games-wallet-v1';
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}},write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const settings={easy:{gap:198,speed:105,gravity:650,flap:-255,space:235},normal:{gap:167,speed:145,gravity:760,flap:-275,space:215},hard:{gap:143,speed:180,gravity:870,flap:-300,space:200}};
let difficulty='easy',phase='ready',bird={x:90,y:235,vy:0},pipes=[],score=0,best=0,sound=false,elapsed=0,last=0,revived=false,won=false;
const saved=read(KEY);if(saved&&typeof saved==='object'){best=Math.max(0,Number(saved.best)||0);if(settings[saved.difficulty])difficulty=saved.difficulty}
$('flappy-difficulty').value=difficulty;
function update(){$('flappy-score').textContent=score;$('flappy-best').textContent=best;$('flappy-pause').textContent=phase==='running'?'Ⅱ Пауза':'▷ Продолжить'}
function save(){write(KEY,{best,difficulty})}
function overlay(title,detail,button){$('flappy-message').textContent=title;$('flappy-detail').textContent=detail;$('flappy-play').textContent=button;$('flappy-revive').classList.toggle('hidden',phase!=='over'||revived);$('flappy-overlay').classList.remove('hidden')}
function fresh(){phase='ready';bird={x:90,y:H*.45,vy:0};pipes=[];score=0;elapsed=0;revived=false;won=false;update();overlay('Готов к полёту?','Касайся экрана, чтобы взмахнуть','▷ Играть');draw()}
function start(){if(phase==='over')fresh();phase='running';last=performance.now();$('flappy-overlay').classList.add('hidden');update();flap()}
function pause(){if(phase==='running'){phase='paused';overlay('Пауза','Полетим дальше?','▷ Продолжить')}else if(phase==='paused')start();update()}
function end(){phase='over';best=Math.max(best,score);save();update();overlay('Птичка приземлилась!','Пролетел труб: '+score,'↻ Ещё раз');try{window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error')}catch{}}
let audio;function beep(){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=620;g.gain.setValueAtTime(.02,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.08);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.08)}catch{}}
function flap(){if(phase==='ready'){start();return}if(phase!=='running')return;bird.vy=settings[difficulty].flap;beep();try{window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')}catch{}}
function spawn(x){const s=settings[difficulty],min=65,max=H-65-s.gap,top=min+Math.random()*(max-min);pipes.push({x,top,passed:false})}
function step(dt){const s=settings[difficulty];elapsed+=dt;bird.vy+=s.gravity*dt;bird.y+=bird.vy*dt;if(!pipes.length||pipes[pipes.length-1].x<W-s.space)spawn(W+30);for(const p of pipes){p.x-=s.speed*dt;if(!p.passed&&p.x+57<bird.x-15){p.passed=true;score++;best=Math.max(best,score);save();update();beep()}if(bird.x+15>p.x&&bird.x-15<p.x+57&&(bird.y-14<p.top||bird.y+14>p.top+s.gap)){end();return}}pipes=pipes.filter(p=>p.x>-70);if(bird.y<16||bird.y>H-17)end()}
function line(points,color='#24477c',width=2){ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke()}
function draw(){ctx.clearRect(0,0,W,H);
 // The graph paper remains visible through the transparent canvas.
 ctx.strokeStyle='rgba(77,139,190,.2)';ctx.lineWidth=.8;for(let x=0;x<W;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<H;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
 for(const p of pipes){const x=p.x,w=57,g=settings[difficulty].gap;ctx.fillStyle='rgba(93,153,110,.13)';ctx.strokeStyle='#367c43';ctx.lineWidth=3;ctx.fillRect(x,0,w,p.top);ctx.strokeRect(x,0,w,p.top);ctx.fillRect(x,p.top+g,w,H-p.top-g);ctx.strokeRect(x,p.top+g,w,H-p.top-g);for(const y of [p.top-16,p.top+g]){ctx.fillStyle='#dce8d3';ctx.fillRect(x-5,y,67,16);ctx.strokeRect(x-5,y,67,16)}for(let j=10;j<w-4;j+=15){line([[x+j,0],[x+j,p.top-16]],'rgba(54,124,67,.18)',1);line([[x+j,p.top+g+16],[x+j,H]],'rgba(54,124,67,.18)',1)}}
 ctx.save();ctx.translate(bird.x,bird.y);ctx.rotate(Math.max(-.35,Math.min(.9,bird.vy/750)));
 ctx.fillStyle='#f4d77d';ctx.strokeStyle='#24477c';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(0,0,19,16,-.1,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle='#e5b55b';ctx.beginPath();ctx.ellipse(-7,5,12,7,Math.sin(elapsed*19)*.25,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle='#faf8ef';ctx.beginPath();ctx.arc(10,-7,6,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#24477c';ctx.beginPath();ctx.arc(12,-7,2.4,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#dc8753';ctx.beginPath();ctx.moveTo(17,0);ctx.lineTo(30,4);ctx.lineTo(17,9);ctx.closePath();ctx.fill();ctx.stroke();line([[-17,-1],[-26,-8],[-23,4]],'#24477c',2);ctx.restore();
 ctx.font='700 23px Caveat,cursive';ctx.fillStyle='#24477c';ctx.textAlign='left';ctx.fillText('✎ '+score,12,29);
}
function frame(now){const dt=Math.min(.045,Math.max(0,(now-last)/1000));last=now;if(phase==='running'&&!document.hidden)step(dt);draw();requestAnimationFrame(frame)}
function enter(){if(!$('game').classList.contains('hidden'))$('back').click();if(!$('snake-screen').classList.contains('hidden'))$('snake-back').click();$('home').classList.add('hidden');$('flappy-screen').classList.remove('hidden');last=performance.now()}
function leave(){if(phase==='running')pause();$('flappy-screen').classList.add('hidden');$('home').classList.remove('hidden')}
function revive(){if(phase!=='over'||revived)return;const w=read(WALLET)||{},balance=Number(w.balance)||0;if(balance<1){alert('Для продолжения нужна 1 монетка.');return}write(WALLET,{...w,balance:balance-1});document.querySelectorAll('[data-wallet-balance]').forEach(e=>e.textContent=String(balance-1));revived=true;bird.y=H*.43;bird.vy=0;pipes=pipes.filter(p=>p.x>bird.x+80);phase='paused';overlay('Вторая попытка','Счёт сохранён. Нажми продолжить!','▷ Продолжить')}
$('openFlappy').onclick=enter;$('flappy-back').onclick=leave;$('flappy-play').onclick=start;$('flappy-revive').onclick=revive;$('flappy-restart').onclick=()=>{if(phase==='running'&&!confirm('Начать заново?'))return;fresh()};$('flappy-pause').onclick=pause;$('flappy-flap').onclick=flap;
$('flappy-difficulty').onchange=e=>{difficulty=e.target.value;save();fresh()};$('flappy-sound').onclick=()=>{sound=!sound;$('flappy-sound').textContent=sound?'♪ вкл.':'♪ выкл.'};
canvas.addEventListener('pointerdown',e=>{e.preventDefault();flap()});document.addEventListener('keydown',e=>{if($('flappy-screen').classList.contains('hidden'))return;if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();flap()}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='running')pause()});fresh();last=performance.now();requestAnimationFrame(frame);
})();