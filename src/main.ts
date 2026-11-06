import './style.css';
import {Game,STEP,type Upgrade} from './game';
import {Renderer} from './render';
import {Sound} from './audio';
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
document.querySelector('#app')!.innerHTML=`
<aside class="intro"><div class="wordmark">FLUX<br><span>FOUNDRY</span></div><h1>磁核弹阵</h1><p class="tagline">每一次反弹，<br>都是下一场连锁的开始。</p><div class="rule"><b>01 / 精准弹射</b><p>拖动瞄准，松开发射整列钢珠。<br>斜面改变轨迹，电容引发连锁。</p></div><div class="rule"><b>02 / 操控磁场</b><p>发射后按「磁场」，再点击场地。<br>抓住一次改变球路的机会。</p></div><div class="rule"><b>03 / 构筑弹阵</b><p>每逢第 3 波选择升级。清除靶阵，<br>阻止它们上升至警戒线。</p></div><small>原创物理弹射游戏 · v0.1.0<br>WINDOWS / MOBILE WEB</small></aside>
<section class="machine" aria-label="磁核弹阵游戏"><header class="hud"><div class="brand"><span class="slashes">///</span><div>FLUX <strong>FOUNDRY</strong><small>磁核弹阵</small></div></div><div class="score"><span>得分</span><b id="score">000000</b></div><div class="wave"><span>波次</span><b id="wave">01</b></div></header>
<div class="arena"><canvas id="game" tabindex="0" aria-label="弹球场地：拖动瞄准，松开发射；方向键调整角度，空格发射；M 磁场，R 收球，P 暂停"></canvas><div id="overlay" class="overlay" hidden></div><div id="toast" class="toast" role="status" aria-live="polite"></div></div>
<footer class="console"><div class="controls"><button id="magnet" class="action cyan"><span class="control-symbol">∩</span><span>磁场<small>M · 每轮一次</small></span></button><div class="energy"><span id="energyLabel">磁场就绪</span><div id="meter"><i></i><i></i><i></i><i></i><i></i></div></div><button id="recall" class="action amber"><span class="control-symbol">↶</span><span>收球<small>R · 结束本轮</small></span></button></div><div class="utility"><button id="pause" aria-label="暂停游戏">暂停</button><button id="sound" aria-pressed="false">声音：关</button><button id="motion" aria-pressed="false">特效：全</button><button id="help">玩法</button><span id="best">最佳 0</span></div></footer></section>
<aside class="right-note"><span class="line"></span><p>瞄准。<br>反弹。<br><em>过载。</em></p><small>钢铁的重量<br>能量的轨迹</small></aside>`;
let game=new Game();const canvas=$<HTMLCanvasElement>('game'),renderer=new Renderer(canvas),sound=new Sound();
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,dragging=false,placing=false,previousPhase=game.phase,best=0,toastTimer=0;
try{best=Number(localStorage.getItem('flux-best'))||0;sound.enabled=localStorage.getItem('flux-sound')==='true';}catch{}
game.onHit=kind=>sound.hit(kind);
function save(){try{localStorage.setItem('flux-best',String(best));localStorage.setItem('flux-sound',String(sound.enabled));}catch{}}
function toast(message:string){$('toast').textContent=message;clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>$('toast').textContent='',3000);}
function point(e:PointerEvent){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*420,y:(e.clientY-r.top)/r.height*720};}
canvas.addEventListener('pointerdown',e=>{if(game.paused||e.button>0)return;const p=point(e);sound.unlock();canvas.focus();if(placing){if(game.field(p.x,p.y)){placing=false;toast('磁场已展开 · 钢珠轨迹正在偏转');}return;}if(game.phase==='aim'){dragging=true;canvas.setPointerCapture(e.pointerId);game.aim(p.x,p.y);}});
canvas.addEventListener('pointermove',e=>{if(dragging){const p=point(e);game.aim(p.x,p.y);}});
canvas.addEventListener('pointerup',()=>{if(dragging){dragging=false;game.fire();}});
canvas.addEventListener('pointercancel',()=>{dragging=false;});
function magnet(){if(game.phase!=='volley'||game.magnetUsed||game.paused)return;placing=!placing;toast(placing?'点击场地部署磁场 · 或再按 M 放在中央':'已取消部署');}
$('magnet').onclick=magnet;$('recall').onclick=()=>{if(!game.paused){placing=false;game.recall();}};
$('sound').onclick=()=>{sound.enabled=!sound.enabled;sound.unlock();save();};
$('motion').onclick=()=>{reduced=!reduced;};
function closeOverlay(){game.paused=false;$('overlay').hidden=true;canvas.focus();}
function showOverlay(html:string){$('overlay').innerHTML=`<div class="dialog">${html}</div>`;$('overlay').hidden=false;$('overlay').querySelector<HTMLButtonElement>('button')?.focus();}
function pause(){if(game.phase==='over'||game.phase==='upgrade')return;game.paused=!game.paused;if(game.paused){showOverlay('<span class="dialog-label">PAUSED</span><h2>让能量停留片刻</h2><p>当前弹阵已暂停。</p><button id="resume" class="primary">继续游戏</button>');$('resume').onclick=closeOverlay;}else closeOverlay();}
$('pause').onclick=pause;
function help(){if(game.phase==='upgrade'||game.phase==='over')return;game.paused=true;showOverlay('<span class="dialog-label">HOW TO PLAY</span><h2>让每一球，物尽其用</h2><p>拖动瞄准，松开发射。钢珠碰撞靶块削减耐久，落入底部自动回收。每轮结束，剩余靶块向上推进。</p><p><strong>青色电容</strong>破碎时伤害周围靶块。发射后点击<strong>磁场</strong>，再点击场地改变钢珠轨迹。每 3 波选择一次升级。</p><p>靶块抵达上方警戒线即结束。收球会提前结束当前回合，并推进靶阵。</p><p class="keys">键盘：← → 瞄准 / 空格发射<br>M 磁场 / R 收球 / P 暂停</p><button id="resume" class="primary">开始弹射</button>');$('resume').onclick=closeOverlay;}
$('help').onclick=help;
document.addEventListener('keydown',e=>{if(e.target instanceof HTMLButtonElement&&[' ','Enter'].includes(e.key))return;
 if(e.key==='p'||e.key==='Escape'){pause();return;}if(game.paused)return;
 if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();if(game.phase==='aim')game.angle=Math.max(.16,Math.min(Math.PI-.16,game.angle+(e.key==='ArrowLeft'?.04:-.04)));}
 if(e.key===' '){e.preventDefault();sound.unlock();game.fire();}if(e.key.toLowerCase()==='r')game.recall();if(e.key.toLowerCase()==='m'){if(placing){game.field(210,410);placing=false;}else magnet();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!game.paused&&(game.phase==='aim'||game.phase==='volley'))pause();});
function phaseChanged(){placing=false;if(game.phase==='upgrade'){showOverlay('<span class="dialog-label">REACTOR UPGRADE</span><h2>选择你的进化方向</h2><p>升级将持续至本局结束。</p><div class="upgrades"><button data-upgrade="swarm"><b>蜂群弹阵</b><span>额外增加 6 颗钢珠</span></button><button data-upgrade="power"><b>钨芯冲击</b><span>每次碰撞伤害 +1</span></button><button data-upgrade="field"><b>长效磁阱</b><span>磁场持续时间 +0.8 秒</span></button></div>');for(const el of document.querySelectorAll<HTMLButtonElement>('[data-upgrade]'))el.onclick=()=>{game.upgrade(el.dataset.upgrade as Upgrade);$('overlay').hidden=true;canvas.focus();};}
 if(game.phase==='over'){best=Math.max(best,game.score);save();showOverlay(`<span class="dialog-label">CORE OVERLOADED</span><h2>反应堆已过载</h2><div class="final-score">${game.score.toLocaleString()}</div><p>坚持 ${game.wave} 波 · 最高 ${game.bestCombo} 连击</p><button id="restart" class="primary">重新点燃核心</button>`);$('restart').onclick=()=>{game=new Game();game.onHit=k=>sound.hit(k);previousPhase='aim';$('overlay').hidden=true;canvas.focus();};}
}
function ui(){if(game.phase!==previousPhase){previousPhase=game.phase;phaseChanged();}if(game.score>best){best=game.score;save();}$('score').textContent=String(game.score).padStart(6,'0');$('wave').textContent=String(game.wave).padStart(2,'0');$('best').textContent=`最佳 ${best.toLocaleString()}`;
 $<HTMLButtonElement>('magnet').disabled=game.phase!=='volley'||game.magnetUsed||game.paused;$('magnet').classList.toggle('selected',placing);$<HTMLButtonElement>('recall').disabled=game.phase!=='volley'||game.paused;
 $('energyLabel').textContent=game.magnet?'磁场运行中':game.magnetUsed&&game.phase==='volley'?'磁场已使用':'磁场就绪';$('meter').classList.toggle('empty',game.magnetUsed&&!game.magnet&&game.phase==='volley');
 $('sound').textContent=`声音：${sound.enabled?'开':'关'}`;$('sound').setAttribute('aria-pressed',String(sound.enabled));$('motion').textContent=`特效：${reduced?'简':'全'}`;$('motion').setAttribute('aria-pressed',String(reduced));$('pause').textContent=game.paused?'继续':'暂停';canvas.classList.toggle('placing',placing);
}
let last=0,accumulator=0;
function frame(t:number){const delta=Math.min((t-last)/1000,.05);last=t;accumulator+=delta;while(accumulator>=STEP){game.update(STEP);accumulator-=STEP;}renderer.draw(game,t/1000,reduced,dragging);ui();requestAnimationFrame(frame);}
new ResizeObserver(()=>renderer.resize()).observe(canvas);
renderer.ready.then(()=>{renderer.resize();requestAnimationFrame(frame);}).catch(()=>toast('材质资源加载失败，请刷新页面重试'));
if('serviceWorker' in navigator&&location.protocol!=='file:'&&!import.meta.env.DEV)void navigator.serviceWorker.register('./sw.js').catch(()=>{});
// A read-only snapshot enables release smoke tests without exposing game mutations.
Object.defineProperty(window,'fluxSnapshot',{value:()=>({phase:game.phase,wave:game.wave,score:game.score,balls:game.balls.length,pending:game.pending,targets:game.targets.length,paused:game.paused,magnetUsed:game.magnetUsed,count:game.count,power:game.power})});

