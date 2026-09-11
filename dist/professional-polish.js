const SAVE_KEY='misterio-maleta:partida-v2';
const UMBRELLA_KEY='misterio-maleta:umbrella-v1';
const EXPLORER_KEY='misterio-maleta:explorer-95-v1';
const REQUIRED=[
 ['hasKey310','Llave 310'],
 ['hasTobacco','Provisiones'],
 ['hasEmpiLetter','Carta de Empi'],
 ['hasRulesBook','Reglamento']
];

const $=id=>document.getElementById(id);
function readState(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null')?.state||null;}catch{return null;}}
function hasUmbrella(){try{return localStorage.getItem(UMBRELLA_KEY)==='1';}catch{return false;}}
function setUmbrella(){try{localStorage.setItem(UMBRELLA_KEY,'1');}catch{}}
function exploration(){const n=parseInt(($('mission-percent')?.textContent||'0').replace(/\D/g,''),10);return Number.isFinite(n)?Math.max(0,Math.min(100,n)):0;}
function readyStats(){const s=readState()||{};const rows=REQUIRED.map(([key,label])=>({key,label,done:!!s[key]}));return {rows,done:rows.filter(x=>x.done).length,total:rows.length};}
function modal(html){const d=$('modal'),body=$('modal-body');if(!d||!body)return;body.innerHTML=html;if(!d.open)d.showModal();}
function toast(text){const el=$('toast');if(!el)return;el.textContent=text;el.hidden=false;clearTimeout(window.__polishToast);window.__polishToast=setTimeout(()=>el.hidden=true,3200);}

function ensureProgressHud(){
 if($('progress-hud'))return;
 const host=$('scene');if(!host)return;
 const b=document.createElement('button');b.id='progress-hud';b.type='button';b.hidden=true;b.title='Ver requisitos para avanzar y porcentaje de exploración';
 b.innerHTML='<span class="progress-ready"><small>AVANCE</small><strong id="ready-count">0/4</strong></span><span class="progress-explore"><small>EXPLORACIÓN</small><strong id="explore-count">0%</strong></span>';
 b.addEventListener('click',()=>{
  const r=readyStats(),p=exploration();
  modal(`<div class="mission-report professional-report"><small>MISIÓN 0 · LA LLEGADA</small><h2>Progreso del episodio</h2><section class="mission-objective"><small>PARA AVANZAR</small><p>Estos requisitos desbloquean el ascensor. No forman parte del reto de completar el 100%.</p></section><div class="required-grid">${r.rows.map(x=>`<p class="required-row ${x.done?'done':''}"><span>${x.done?'✓':'○'}</span><b>${x.label}</b><em>${x.done?'LISTO':'PENDIENTE'}</em></p>`).join('')}</div><section class="completion-block"><small>EXPLORACIÓN OPCIONAL</small><div class="report-score">${p}%</div><p>${p===100?'Recepción completada al 100%. Has agotado las interacciones contabilizadas y desbloqueado la recompensa de completista.':p>=95?'Nivel explorador alcanzado. Ya has descubierto casi todo; todavía queda algo para el 100%.':'Puedes terminar el episodio sin llegar al 100%. El porcentaje premia mirar, conversar y probar interacciones opcionales.'}</p><p class="secret-note">Los objetos narrativos para capítulos futuros, como el paraguas, se guardan aparte y nunca bloquean el avance.</p></section></div>`);
 });
 host.append(b);
}
function updateProgressHud(){
 ensureProgressHud();const hud=$('progress-hud'),mission=$('mission-meter');if(!hud||!mission)return;
 hud.hidden=mission.hidden;const r=readyStats(),p=exploration();
 const rc=$('ready-count'),ec=$('explore-count');if(rc)rc.textContent=`${r.done}/${r.total}`;if(ec)ec.textContent=`${p}%`;
 hud.classList.toggle('ready',r.done===r.total);hud.classList.toggle('near-complete',p>=95&&p<100);hud.classList.toggle('complete',p===100);
 mission.title='Exploración opcional: acciones descubiertas en recepción';
 const label=mission.querySelector('span');if(label)label.textContent='EXPLORACIÓN';
 if(p>=95&&p<100){try{if(localStorage.getItem(EXPLORER_KEY)!=='1'){localStorage.setItem(EXPLORER_KEY,'1');toast('EXPLORADOR 95% · Casi todo descubierto. El 100% aún guarda una recompensa.');}}catch{}}
}

function activeVerb(){return [...document.querySelectorAll('#verbs button')].find(b=>b.classList.contains('active'))?.textContent?.trim()||'MIRAR';}
function ensureUmbrella(){
 const layer=$('hotspots'),scene=$('scene');if(!layer||!scene||$('hotspot-umbrella'))return;
 const prop=document.createElement('div');prop.id='umbrella-prop';prop.setAttribute('aria-hidden','true');prop.innerHTML='<i></i><b></b>';
 scene.append(prop);
 const b=document.createElement('button');b.id='hotspot-umbrella';b.type='button';b.setAttribute('aria-label','paragüero');b.innerHTML='<span>paragüero</span>';
 Object.assign(b.style,{left:'30.6%',top:'58.5%',width:'5.3%',height:'17%'});
 b.addEventListener('click',e=>{e.stopPropagation();const verb=activeVerb();if(hasUmbrella()){
   if(verb==='MIRAR'||verb==='USAR')modal('<small>PARAGÜERO</small><h2>Ya no está</h2><p>El paraguas está en tu inventario. Bilbao ha perdido una pequeña batalla.</p>');
   else toast('El paraguas ya está en tu inventario.');
   return;
  }
  if(verb==='COGER'){
   setUmbrella();prop.classList.add('empty');toast('Has cogido: PARAGUAS');syncInventory();
   modal('<small>OBJETO CONSEGUIDO</small><h2>Paraguas</h2><p>Negro, largo y sorprendentemente sólido.</p><p><b>Julito:</b> «Puede servir para la lluvia… o para un duelo a muerte. En Bilbao conviene estar preparado para ambas cosas.»</p><p><small>OBJETO NARRATIVO · SE CONSERVARÁ PARA PRÓXIMOS EPISODIOS</small></p>');
  }else if(verb==='USAR')modal('<small>PARAGÜERO</small><h2>Una decisión prudente</h2><p>Primero tendría que coger el paraguas. Lanzarme a un duelo con el paragüero entero sería excesivo incluso para mi primer día.</p>');
  else modal('<small>PARAGÜERO</small><h2>Un paraguas negro</h2><p>Parece resistente. <b>Julito:</b> «Puede servir para la lluvia… o para un duelo a muerte. Lo importante es no confundir el orden.»</p>');
 });
 layer.append(b);if(hasUmbrella())prop.classList.add('empty');
}
function syncInventory(){
 const owned=hasUmbrella(),native=$('items'),grid=$('inventory-grid');if(!native)return;
 const total=native.children.length+(owned?1:0);if($('count'))$('count').textContent=String(total).padStart(2,'0');if($('inventory-total'))$('inventory-total').textContent=String(total).padStart(2,'0');
 if(!owned||!grid||grid.querySelector('[data-polish-item="umbrella"]'))return;
 const b=document.createElement('button');b.type='button';b.dataset.polishItem='umbrella';b.setAttribute('role','listitem');b.setAttribute('aria-label','paraguas');b.innerHTML='<span class="symbol umbrella-symbol">☂</span><span>paraguas</span><small>OBJETO NARRATIVO</small>';
 b.addEventListener('click',()=>modal('<small>INVENTARIO</small><h2>Paraguas</h2><p>Negro, largo y bastante serio para haber acabado en una aventura gráfica.</p><p>Puede ser útil más adelante. O para un duelo a muerte, si el reglamento no dice nada al respecto.</p>'));
 grid.append(b);
}

let audioCtx;
function bark(){
 try{
  audioCtx??=new (window.AudioContext||window.webkitAudioContext)();const now=audioCtx.currentTime;
  const osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),filter=audioCtx.createBiquadFilter();
  osc.type='sawtooth';osc.frequency.setValueAtTime(155,now);osc.frequency.exponentialRampToValueAtTime(82,now+.12);filter.type='bandpass';filter.frequency.value=520;filter.Q.value=.75;
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.16,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+.16);
  osc.connect(filter).connect(gain).connect(audioCtx.destination);osc.start(now);osc.stop(now+.18);
  const osc2=audioCtx.createOscillator(),gain2=audioCtx.createGain();osc2.type='square';osc2.frequency.setValueAtTime(115,now+.11);osc2.frequency.exponentialRampToValueAtTime(70,now+.22);gain2.gain.setValueAtTime(.0001,now+.1);gain2.gain.exponentialRampToValueAtTime(.08,now+.125);gain2.gain.exponentialRampToValueAtTime(.0001,now+.25);osc2.connect(gain2).connect(audioCtx.destination);osc2.start(now+.1);osc2.stop(now+.26);
 }catch{}
}
function wirePrim(){const p=$('hotspot-prim');if(!p||p.dataset.barkWired)return;p.dataset.barkWired='1';p.addEventListener('click',()=>{if($('sound')?.getAttribute('aria-pressed')!=='false')bark();},{capture:true});}

function refresh(){updateProgressHud();ensureUmbrella();wirePrim();syncInventory();}
const observer=new MutationObserver(()=>queueMicrotask(refresh));
observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','aria-pressed']});
window.addEventListener('storage',refresh);
setInterval(refresh,700);
refresh();
