import {MISSION} from './content.js';

const SAVE_KEY='misterio-maleta:partida-v1';
const $=id=>document.getElementById(id);
const readSave=()=>{try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch{return null;}};
const currentNickname=()=>{try{return readSave()?.state?.nickname||localStorage.getItem('misterio-maleta:mote')||'Julito';}catch{return readSave()?.state?.nickname||'Julito';}};

let previousNickname=null;
window.addEventListener('maleta-set-nickname',event=>{
  previousNickname=event.detail?.previous||readSave()?.state?.nickname||null;
});

const replacements=new Map([
  ['Muy bien, [MOTE]. Intentaré recordarlo.',()=>`Muy bien, ${currentNickname()}. Intentaré recordarlo.`],
  ['Yo soy María. Dime una cosa importante: ¿bailas salsa?',()=> 'Yo soy María. Esta noche estamos intentando montar una clase de salsa. Dime una cosa importante: ¿bailas salsa?'],
  ['Definitivamente, en el CMD el nivel de las chicas supera al de mis pasos de baile.',()=> 'Con la salsa voy a necesitar más de una clase. Con las excusas, en cambio, creo que puedo convalidar créditos.'],
  ['La cantera del Madrid. Hablan de un chaval de 17 años que promete mucho.',()=> 'Raúl González, 17 años. Apuntaré el nombre por si acaso.'],
  ['Un paquete blando de tabaco, bastante arrugado.',()=> 'Un paquete blando de Fortuna, bastante arrugado. Por una vez, la marca describe exactamente el hallazgo.'],
  ['Todavía quedan algunos cigarrillos. El anterior dueño cuidaba mejor el sofá que el paquete.',()=> 'Todavía quedan algunos cigarrillos. Menos mal: mi madre me quitó el tabaco de la maleta antes de salir. Según ella era por mi bien. Según yo, era un intento de asesinato a medio plazo.'],
  ['Un paquete de tabaco. Por fin alguien ha dejado una bienvenida con futuro.',()=> 'Un paquete de Fortuna. Literalmente. Mi madre me quitó el mío de la maleta antes de salir y yo empezaba a calcular cuánto podía sobrevivir sin fumar.'],
  ['No puedo subir así.',()=> 'No puedo subir así. Me falta algo esencial para la supervivencia universitaria.'],
  ['Necesito encontrar tabaco antes de enfrentarme a una tercera planta.',()=> 'Necesito encontrar tabaco antes de enfrentarme a una tercera planta. Mi madre retiró el mío de la maleta en un acto que ella llama educación y yo llamo sabotaje.'],
  ['Un hombre no vive solo de llave, maleta y puré naranja.',()=> 'Un hombre no vive solo de llave, maleta y puré naranja. Y yo, desde luego, no pienso averiguar cuánto dura sin tabaco.']
]);

let lastSeen='';
function refineVisibleDialogue(){
  const line=$('line');
  if(!line||!line.textContent)return;
  const text=line.textContent;
  if(text!==lastSeen){
    lastSeen=text;
    const replacement=replacements.get(text);
    if(replacement){line.textContent=replacement();lastSeen=line.textContent;}
    else if(previousNickname&&previousNickname!==currentNickname()&&text.includes(previousNickname)){
      line.textContent=text.split(previousNickname).join(currentNickname());
      lastSeen=line.textContent;
    }
  }
  const speaker=$('speaker');
  if(speaker&&previousNickname&&speaker.textContent===String(previousNickname).toUpperCase())speaker.textContent=String(currentNickname()).toUpperCase();
}

function isPedroMenu(choices){
  const labels=[...choices.querySelectorAll('button')].map(b=>b.textContent);
  return labels.some(t=>t.includes('¿Dónde estoy exactamente?'))&&labels.some(t=>t.includes('Eso es todo'));
}
function ensureNicknameChoice(){
  const choices=$('choices');
  if(!choices||choices.hidden||$('change-nickname-dialogue')||!isPedroMenu(choices))return;
  const b=document.createElement('button');
  b.type='button';
  b.id='change-nickname-dialogue';
  b.textContent='Por cierto, ¿cómo has dicho que querías que te llamásemos?';
  b.onclick=event=>{
    event.preventDefault();
    event.stopPropagation();
    window.MaletaNickname?.open?.();
  };
  choices.insertBefore(b,choices.lastElementChild||null);
}

function missionPercent(state){
  const groups=[[state.inspectedSigns,MISSION.signs],[state.usedTargets,MISSION.uses],[state.readTopics,MISSION.dialogues],[state.collectedItems,MISSION.objects]];
  let done=0,total=0;
  for(const [raw,all] of groups){const got=Array.isArray(raw)?raw:[];done+=all.filter(id=>got.includes(id)).length;total+=all.length;}
  return total?Math.round(done/total*100):0;
}

let surpriseQueued=false;
function checkHundredPercent(){
  const save=readSave(),state=save?.state;
  if(!state||state.pedro100Surprise||missionPercent(state)<100)return;
  window.dispatchEvent(new CustomEvent('maleta-set-state-flag',{detail:{key:'pedro100Surprise',value:true}}));
  surpriseQueued=true;
  queueSurprise(0);
}
function queueSurprise(attempt){
  if(!surpriseQueued||attempt>60)return;
  const speech=$('speech'),card=$('card'),modal=$('modal'),inventory=$('inventory-modal'),choices=$('choices');
  const idle=(!speech||speech.hidden)&&(!card||card.hidden)&&(!modal||!modal.open)&&(!inventory||!inventory.open)&&(!choices||choices.hidden);
  if(!idle){setTimeout(()=>queueSurprise(attempt+1),250);return;}
  surpriseQueued=false;
  const body=$('modal-body');
  if(!body||!modal)return;
  body.innerHTML=`<div class="mission-report"><small>EXPLORACIÓN COMPLETA · 100%</small><h2>Pedro tiene algo que decirte</h2><p><b>Pedro:</b> ${currentNickname()}, he visto gente tardar cuatro años en enterarse de menos cosas que tú en una tarde.</p><p><b>${currentNickname()}:</b> ¿Eso es un cumplido?</p><p><b>Pedro:</b> No te acostumbres.</p><hr><p>Pedro abre un cajón, rebusca entre llaves y papeles y te entrega una pequeña ficha metálica.</p><p><b>Pedro:</b> Estaba con la llave de la 310. Pensaba dártela cuando demostrases que mirabas antes de preguntar.</p><p><b>${currentNickname()}:</b> ¿Y para qué sirve?</p><p><b>Pedro:</b> Si lo supiera, no sería una sorpresa.</p><small>Has descubierto todo lo que esconde la recepción. O todo lo que Pedro admite que esconde.</small></div>`;
  modal.showModal();
}

function tick(){refineVisibleDialogue();ensureNicknameChoice();}
window.addEventListener('maleta-save',checkHundredPercent);
setInterval(tick,180);
setTimeout(checkHundredPercent,800);
