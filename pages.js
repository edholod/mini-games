'use strict';
(()=>{
const ids=['home','game','snake-screen','flappy-screen','tetris-screen','durak-screen'];
let direction='forward',last='home',transitioning=false;
const visible=()=>ids.find(id=>!document.getElementById(id).classList.contains('hidden'))||'home';
const sheet=document.querySelector('.sheet');
function animate(id){
 const el=document.getElementById(id);
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 el.classList.remove('page-turn-in','page-turn-back');
 void el.offsetWidth;
 el.classList.add(direction==='back'?'page-turn-back':'page-turn-in');
 el.addEventListener('animationend',()=>el.classList.remove('page-turn-in','page-turn-back'),{once:true});
}
document.addEventListener('click',e=>{
 const target=e.target.closest('button');
 if(!target)return;
 if(['back','snake-back','flappy-back','tetris-back','durak-back'].includes(target.id))direction='back';
 else if(['open2048','openSnake','openFlappy','openTetris','openDurak'].includes(target.id))direction='forward';
},true);
const observer=new MutationObserver(()=>{
 const current=visible();
 if(current!==last){last=current;animate(current);sheet.dataset.page=current}
});
for(const id of ids)observer.observe(document.getElementById(id),{attributes:true,attributeFilter:['class']});
sheet.dataset.page=visible();
// Exactly four game cards per notebook page. New games are paginated automatically.
const home=document.getElementById('home'),prev=document.getElementById('page-prev'),next=document.getElementById('page-next'),counter=document.getElementById('page-number');
let page=0,turning=false,turnTimer=null,audio=null;
const cards=()=>Array.from(home.querySelectorAll('.game-card'));
function sound(){
 try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const duration=.16,buffer=audio.createBuffer(1,Math.floor(audio.sampleRate*duration),audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++){const t=i/data.length;data[i]=(Math.random()*2-1)*Math.pow(1-t,2)*.14*Math.sin(Math.PI*t)}const source=audio.createBufferSource(),gain=audio.createGain(),filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1250;source.buffer=buffer;source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.start()}catch{}
}
function showPage(){
 const all=cards(),total=Math.max(1,Math.ceil(all.length/4));page=Math.max(0,Math.min(page,total-1));
 all.forEach((card,i)=>{card.hidden=Math.floor(i/4)!==page});
 counter.textContent='Страница '+(page+1)+' из '+total;prev.disabled=page===0;next.disabled=page>=total-1;
 home.dataset.notebookPage=String(page+1);
}
function turn(delta){
 if(turning||home.classList.contains('hidden'))return;
 const total=Math.max(1,Math.ceil(cards().length/4)),dest=page+delta;
 if(dest<0||dest>=total)return;
 turning=true;sound();
 home.classList.remove('page-flip-forward','page-flip-reverse');void home.offsetWidth;
 home.classList.add(delta>0?'page-flip-forward':'page-flip-reverse');
 turnTimer=setTimeout(()=>{page=dest;showPage()},190);
 setTimeout(()=>{home.classList.remove('page-flip-forward','page-flip-reverse');turning=false},450);
}
prev.addEventListener('click',()=>turn(-1));next.addEventListener('click',()=>turn(1));
let startTouch=null;
home.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;startTouch={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});
home.addEventListener('touchend',e=>{if(!startTouch)return;const x=e.changedTouches[0].clientX-startTouch.x,y=e.changedTouches[0].clientY-startTouch.y;startTouch=null;if(Math.abs(x)>65&&Math.abs(x)>Math.abs(y)*1.3)turn(x<0?1:-1)},{passive:true});
home.addEventListener('touchcancel',()=>{startTouch=null});
new MutationObserver(showPage).observe(home,{childList:true});showPage();
})();