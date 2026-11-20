'use strict';
(()=>{
const ids=['home','game','snake-screen','flappy-screen'];
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
 if(['back','snake-back','flappy-back'].includes(target.id))direction='back';
 else if(['open2048','openSnake','openFlappy'].includes(target.id))direction='forward';
},true);
const observer=new MutationObserver(()=>{
 const current=visible();
 if(current!==last){last=current;animate(current);sheet.dataset.page=current}
});
for(const id of ids)observer.observe(document.getElementById(id),{attributes:true,attributeFilter:['class']});
sheet.dataset.page=visible();
})();