import './style.css';
import {Game,STEP,type Upgrade} from './game';
import {MATERIALS,SIZES,LEVELS,type Material,type BallSize} from './content';
import {Renderer} from './render';
import {Sound} from './audio';
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
document.querySelector('#app')!.innerHTML=`
<aside class="intro"><div class="wordmark">FLUX<br><span>FOUNDRY</span></div><h1>磁核弹阵</h1><p class="tagline">每一次反弹，<br>都让数字离零更近。</p><div class="rule"><b>01 / 挑选弹珠</b><p>4 种材质 × 3 种尺寸，自由组合。<br>每次撞击减 1，归零才消除。</p></div><div class="rule"><b>02 / 操控磁场</b><p>发射后按「磁场」，再点击场地。<br>抓住一次改变球路的机会。</p></div><div class="rule"><b>03 / 挑战铸星</b><p>12 道工艺挑战，收集通关星级。<br>无尽模式每 3 波获得升级。</p></div><small>原创物理弹射游戏 · v0.2.0<br>WINDOWS / MOBILE WEB</small></aside>
<section class="machine" aria-label="磁核弹阵游戏"><header class="hud"><div class="brand"><span class="slashes">///</span><div>FLUX <strong>FOUNDRY</strong><small>磁核弹阵</small></div></div><div class="score"><span>得分</span><b id="score">000000</b></div><div class="wave"><span>波次</span><b id="wave">01</b></div></header>
<nav class="loadout-bar" aria-label="玩法选择"><button id="workshop"><span class="ball-mini steel" id="ballIcon"></span><span id="loadoutLabel">中号钢珠</span><small>工坊</small></button><button id="levels"><span id="modeLabel">无尽模式</span><small>挑战关卡 ›</small></button></nav><div class="arena"><canvas id="game" tabindex="0" aria-label="弹球场地：拖动瞄准，松开发射；方向键调整角度，空格发射；M 磁场，R 收球，P 暂停"></canvas><div id="overlay" class="overlay" hidden></div><div id="toast" class="toast" role="status" aria-live="polite"></div></div>
<footer class="console"><div class="controls"><button id="magnet" class="action cyan"><span class="control-symbol">∩</span><span>磁场<small>M · 每轮一次</small></span></button><div class="energy"><span id="energyLabel">磁场就绪</span><div id="meter"><i></i><i></i><i></i><i></i><i></i></div></div><button id="recall" class="action amber"><span class="control-symbol">↶</span><span>收球<small>R · 结束本轮</small></span></button></div><div class="utility"><button id="pause" aria-label="暂停游戏">暂停</button><button id="sound" aria-pressed="false">声音：关</button><button id="motion" aria-pressed="false">特效：全</button><button id="help">玩法</button><span id="best">最佳 0</span></div></footer></section>
<aside class="right-note"><span class="line"></span><p>瞄准。<br>反弹。<br><em>过载。</em></p><small>钢铁的重量<br>能量的轨迹</small></aside>`;
let game=new Game();const canvas=$<HTMLCanvasElement>('game'),renderer=new Renderer(canvas),sound=new Sound();
type RecordEntry={stars:number;shots:number};
let records:Record<string,RecordEntry>={};
let panel:string|null=null;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,dragging=false,placing=false,previousPhase=game.phase,best=0,toastTimer=0;
try{best=Number(localStorage.getItem('flux-best'))||0;sound.enabled=localStorage.getItem('flux-sound')==='true';}catch{}
try{const raw=JSON.parse(localStorage.getItem('flux-challenges')||'{}');for(let i=0;i<LEVELS.length;i++){const entry=raw[i];if(entry&&Number.isInteger(entry.stars)&&entry.stars>=1&&entry.stars<=3&&Number.isInteger(entry.shots)&&entry.shots>0)records[i]=entry;}const pref=JSON.parse(localStorage.getItem('flux-loadout')||'null');if(pref)game.selectBall(pref.material,pref.size);}catch{}
game.onHit=kind=>sound.hit(kind);
function persistLoadout(){try{localStorage.setItem('flux-loadout',JSON.stringify({material:game.material,size:game.size}));}catch{}}
function startGame(levelIndex?:number){const material=game.material,size=game.size;game=new Game(levelIndex===undefined?Date.now():1000+levelIndex,levelIndex);game.selectBall(material,size);game.onHit=k=>sound.hit(k);previousPhase='aim';placing=false;dragging=false;panel=null;$('overlay').hidden=true;canvas.focus();}

function save(){try{localStorage.setItem('flux-best',String(best));localStorage.setItem('flux-sound',String(sound.enabled));}catch{}}
function toast(message:string){$('toast').textContent=message;clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>$('toast').textContent='',3000);}
function point(e:PointerEvent){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*420,y:(e.clientY-r.top)/r.height*720};}
canvas.addEventListener('pointerdown',e=>{if(game.paused||e.button>0)return;const p=point(e);sound.unlock();canvas.focus();if(placing){if(game.field(p.x,p.y)){placing=false;toast('磁场已展开 · 钢珠轨迹正在偏转');}return;}if(game.phase==='aim'){dragging=true;canvas.setPointerCapture(e.pointerId);game.aim(p.x,p.y);}});
canvas.addEventListener('pointermove',e=>{if(dragging){const p=point(e);game.aim(p.x,p.y);}});
canvas.addEventListener('pointerup',()=>{if(dragging){dragging=false;game.fire();}});
canvas.addEventListener('pointercancel',()=>{dragging=false;});
function magnet(){if(game.phase!=='volley'||game.magnetUsed||game.paused)return;if(!game.spec.magnetic){toast('当前弹珠无磁性；下一轮可在工坊换成钢珠');return;}placing=!placing;toast(placing?'点击场地部署磁场 · 或再按 M 放在中央':'已取消部署');}
$('magnet').onclick=magnet;$('recall').onclick=()=>{if(!game.paused){placing=false;game.recall();}};
$('sound').onclick=()=>{sound.enabled=!sound.enabled;sound.unlock();save();};
$('motion').onclick=()=>{reduced=!reduced;};
function closeOverlay(){panel=null;game.paused=false;$('overlay').hidden=true;canvas.focus();}
function showOverlay(html:string){$('overlay').innerHTML=`<div class="dialog" role="dialog" aria-modal="true" aria-label="游戏菜单">${html}</div>`;$('overlay').hidden=false;$('overlay').querySelector<HTMLButtonElement>('button')?.focus();}
function pause(){if(game.phase==='over'||game.phase==='upgrade'||game.phase==='won')return;if(game.paused){closeOverlay();return;}panel='pause';game.paused=!game.paused;if(game.paused){showOverlay('<span class="dialog-label">PAUSED</span><h2>让能量停留片刻</h2><p>当前弹阵已暂停。</p><button id="resume" class="primary">继续游戏</button>');$('resume').onclick=closeOverlay;}else closeOverlay();}
$('pause').onclick=pause;
function help(){if(game.phase==='upgrade'||game.phase==='over'||game.phase==='won')return;panel='help';game.paused=true;showOverlay('<span class="dialog-label">HOW TO PLAY</span><h2>让每一球，物尽其用</h2><p>拖动瞄准，松开发射。每次有效撞击使数字减 1，数字归零才消除，落入底部自动回收。无尽模式每轮结束，剩余靶块向上推进。</p><p><strong>所有靶块</strong>都遵循每次撞击减 1 的规则，没有连锁伤害或秒杀。发射后点击<strong>磁场</strong>，再点击场地改变钢珠轨迹。无尽模式每 3 波选择一次升级。</p><p><strong>弹珠工坊</strong>提供4种材质和3种尺寸。只有钢珠可被磁场吸引。气流对轻珠影响更大，反射柱不被击碎。挑战关卡要求在规定发射次数内清场，靶阵不会上移。</p><p>无尽模式的靶块抵达上方警戒线即结束。收球会提前结束当前回合，无尽模式推进靶阵；挑战模式消耗本次发射。弹珠没有时间限制，停在靶面时可以主动收球。</p><p class="keys">键盘：← → 瞄准 / 空格发射<br>M 磁场 / R 收球 / P 暂停</p><button id="resume" class="primary">开始弹射</button>');$('resume').onclick=closeOverlay;}
$('help').onclick=help;
function workshop(){
 if(game.phase!=='aim')return;panel='workshop';game.paused=true;placing=false;
 showOverlay(`<span class="dialog-label">MARBLE WORKSHOP</span><h2>选一颗，走自己的球路</h2><p class="compact">相同发射能量 · 重力一致 · 每击减1</p><div class="material-grid">${Object.entries(MATERIALS).map(([id,m])=>`<button data-material="${id}" aria-pressed="${game.material===id}"><span class="marble ${id}"></span><b>${m.name}</b><small>${m.subtitle}</small></button>`).join('')}</div><div class="size-options" aria-label="弹珠尺寸">${Object.entries(SIZES).map(([id,v])=>`<button data-size="${id}" aria-pressed="${game.size===id}">${v.name}号 <small>Ø ${v.radius*2}</small></button>`).join('')}</div><div id="ballStats" class="ball-stats"></div><p class="compact">小珠善于穿隙，大珠接触面更宽。发射后本轮不能换珠。数字为游戏参数。</p><button id="equip" class="primary">装备并返回</button>`);
 const refresh=()=>{const spec=game.spec;for(const el of document.querySelectorAll<HTMLElement>('[data-material]'))el.setAttribute('aria-pressed',String(el.dataset.material===game.material));for(const el of document.querySelectorAll<HTMLElement>('[data-size]'))el.setAttribute('aria-pressed',String(el.dataset.size===game.size));$('ballStats').innerHTML=`<span>相对质量<b>${spec.mass.toFixed(2)}</b></span><span>回弹系数<b>${game.restitution.toFixed(2)}</b></span><span>磁性<b>${spec.magnetic?'有':'无'}</b></span>`;persistLoadout();};
 for(const el of document.querySelectorAll<HTMLButtonElement>('[data-material]'))el.onclick=()=>{game.selectBall(el.dataset.material as Material,game.size);refresh();};
 for(const el of document.querySelectorAll<HTMLButtonElement>('[data-size]'))el.onclick=()=>{game.selectBall(game.material,el.dataset.size as BallSize);refresh();};
 $('equip').onclick=closeOverlay;refresh();
}
function levels(){
 panel='levels';game.paused=true;placing=false;
 const total=Object.values(records).reduce((n,r)=>n+r.stars,0);
 showOverlay(`<span class="dialog-label">THE FOUNDRY TRIALS · ${total}/36 ★</span><h2>十二道铸造试炼</h2><p class="compact">每关清除全部靶块；发射越少，星级越高。点击关卡开始新对局，当前对局会被替换。</p><div class="level-grid">${LEVELS.map((l,i)=>`<button data-level="${i}" aria-label="第${i+1}关 ${l.name}"><small>${String(i+1).padStart(2,'0')}</small><b>${l.name}</b><span>${records[i]?'★'.repeat(records[i].stars)+'☆'.repeat(3-records[i].stars):'☆☆☆'}</span></button>`).join('')}</div><button id="endless" class="secondary">进入无尽模式</button><button id="backToGame" class="primary">返回当前对局</button>`);
 for(const el of document.querySelectorAll<HTMLButtonElement>('[data-level]'))el.onclick=()=>{startGame(Number(el.dataset.level));briefing();};
 $('endless').onclick=()=>startGame();$('backToGame').onclick=()=>{if(game.phase==='won'||game.phase==='over'||game.phase==='upgrade'){game.paused=false;panel=null;phaseChanged();}else closeOverlay();};
}
function briefing(){game.paused=true;panel='briefing';showOverlay(`<span class="dialog-label">${game.level.chapter}</span><h2>${String(game.levelIndex+1).padStart(2,'0')} / ${game.level.name}</h2><p>${game.level.hint}</p><div class="mission-goal"><b>清除全部 ${game.targets.length} 个靶块</b><span>最多 ${game.level.shots} 次发射 · ${game.level.par} 次以内通关获 ★★★</span></div><p class="compact">每次发射前可换珠。发射后没有时间限制。收球也会用掉本次机会。</p><button id="beginChallenge" class="primary">开始挑战</button>`);$('beginChallenge').onclick=closeOverlay;}
$('workshop').onclick=workshop;$('levels').onclick=levels;

document.addEventListener('keydown',e=>{if(e.target instanceof HTMLButtonElement&&[' ','Enter'].includes(e.key))return;
 if(e.key==='Tab'&&!$('overlay').hidden){const buttons=Array.from($('overlay').querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}return;}
 if(e.key==='Escape'&&panel==='levels'){e.preventDefault();$('backToGame').click();return;}
 if(e.key==='p'||e.key==='Escape'){pause();return;}if(game.paused)return;
 if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();if(game.phase==='aim')game.angle=Math.max(.16,Math.min(Math.PI-.16,game.angle+(e.key==='ArrowLeft'?.04:-.04)));}
 if(e.key===' '){e.preventDefault();sound.unlock();game.fire();}if(e.key.toLowerCase()==='r')game.recall();if(e.key.toLowerCase()==='m'){if(placing){game.field(210,410);placing=false;}else magnet();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!game.paused&&(game.phase==='aim'||game.phase==='volley'))pause();});
function phaseChanged(){placing=false;panel=null;
 if(game.mode==='challenge'&&(game.phase==='won'||game.phase==='over')){const won=game.phase==='won';if(won){const old=records[game.levelIndex];records[game.levelIndex]={stars:Math.max(old?.stars||0,game.stars),shots:Math.min(old?.shots||Infinity,game.shots)};try{localStorage.setItem('flux-challenges',JSON.stringify(records));}catch{}}showOverlay(`<span class="dialog-label">${won?'CAST COMPLETE':'TRY ANOTHER ROUTE'}</span><h2>${won?'铸造完成':'还差一次好球路'}</h2><div class="stars">${won?'★'.repeat(game.stars)+'☆'.repeat(3-game.stars):'☆☆☆'}</div><p>${game.level.name} · 已发射 ${game.shots} 次${won?'':` · 剩余 ${game.targets.length} 个靶块`}</p><p class="compact">${won?`挑战更少发射：${game.level.par}次内获得三星。`:game.level.hint}</p>${won&&game.levelIndex<LEVELS.length-1?'<button id="nextLevel" class="primary">下一关</button>':''}<button id="retryLevel" class="secondary">重试本关</button><button id="allLevels" class="secondary">查看全部关卡</button>`);if($('nextLevel'))$('nextLevel').onclick=()=>{startGame(game.levelIndex+1);briefing();};$('retryLevel').onclick=()=>startGame(game.levelIndex);$('allLevels').onclick=levels;}
if(game.phase==='upgrade'){showOverlay('<span class="dialog-label">REACTOR UPGRADE</span><h2>选择你的进化方向</h2><p>升级将持续至本局结束。</p><div class="upgrades"><button data-upgrade="elastic"><b>精密回弹</b><span>减少碰撞损耗，保留更多动能</span></button><button data-upgrade="magnet"><b>电磁增幅</b><span>磁场吸引力 +20%</span></button><button data-upgrade="field"><b>长效磁阱</b><span>磁场持续时间 +0.8 秒</span></button></div>');for(const el of document.querySelectorAll<HTMLButtonElement>('[data-upgrade]'))el.onclick=()=>{game.upgrade(el.dataset.upgrade as Upgrade);$('overlay').hidden=true;canvas.focus();};}
 if(game.phase==='over'&&game.mode==='endless'){best=Math.max(best,game.score);save();showOverlay(`<span class="dialog-label">CORE OVERLOADED</span><h2>反应堆已过载</h2><div class="final-score">${game.score.toLocaleString()}</div><p>坚持 ${game.wave} 波 · 最高 ${game.bestCombo} 连击</p><button id="restart" class="primary">重新点燃核心</button>`);$('restart').onclick=()=>startGame();}
}
function ui(){if(game.phase!==previousPhase){previousPhase=game.phase;phaseChanged();}if(game.score>best){best=game.score;save();}$('score').textContent=String(game.score).padStart(6,'0');$('wave').textContent=String(game.mode==='challenge'?game.levelIndex+1:game.wave).padStart(2,'0');$('best').textContent=`最佳 ${best.toLocaleString()}`;
 $<HTMLButtonElement>('magnet').disabled=game.phase!=='volley'||game.magnetUsed||game.paused||!game.spec.magnetic;$('magnet').classList.toggle('selected',placing);$<HTMLButtonElement>('recall').disabled=game.phase!=='volley'||game.paused;
 $('loadoutLabel').textContent=`${SIZES[game.size].name}号${MATERIALS[game.material].name}珠`;$('ballIcon').className=`ball-mini ${game.material}`;$('modeLabel').textContent=game.mode==='challenge'?`${String(game.levelIndex+1).padStart(2,'0')} · ${game.level.name}`:'无尽模式';$<HTMLButtonElement>('workshop').disabled=game.phase!=='aim';
 $('energyLabel').textContent=!game.spec.magnetic?'当前珠无磁性':game.magnet?'磁场运行中':game.magnetUsed&&game.phase==='volley'?'磁场已使用':'磁场就绪';$('meter').classList.toggle('empty',!game.spec.magnetic||(game.magnetUsed&&!game.magnet&&game.phase==='volley'));
 $('sound').textContent=`声音：${sound.enabled?'开':'关'}`;$('sound').setAttribute('aria-pressed',String(sound.enabled));$('motion').textContent=`特效：${reduced?'简':'全'}`;$('motion').setAttribute('aria-pressed',String(reduced));$('pause').textContent=game.paused?'继续':'暂停';canvas.classList.toggle('placing',placing);
}
let last=0,accumulator=0;
function frame(t:number){const delta=Math.min((t-last)/1000,.05);last=t;accumulator+=delta;while(accumulator>=STEP){game.update(STEP);accumulator-=STEP;}renderer.draw(game,t/1000,reduced,dragging);ui();requestAnimationFrame(frame);}
new ResizeObserver(()=>renderer.resize()).observe(canvas);
renderer.ready.then(()=>{renderer.resize();requestAnimationFrame(frame);}).catch(()=>toast('材质资源加载失败，请刷新页面重试'));
if('serviceWorker' in navigator&&location.protocol!=='file:'&&!import.meta.env.DEV)void navigator.serviceWorker.register('./sw.js').catch(()=>{});
// A read-only snapshot enables release smoke tests without exposing game mutations.
Object.defineProperty(window,'fluxSnapshot',{value:()=>({phase:game.phase,wave:game.wave,score:game.score,balls:game.balls.length,targets:game.targets.length,paused:game.paused,magnetUsed:game.magnetUsed,count:game.count,power:game.power,fieldStrength:game.fieldStrength,material:game.material,size:game.size,radius:game.spec.r,mode:game.mode,levelIndex:game.levelIndex,shots:game.shots,remainingShots:game.mode==='challenge'?game.remainingShots:null,stars:game.stars,records:structuredClone(records),pegs:game.pegs.length,air:game.air.length})});

