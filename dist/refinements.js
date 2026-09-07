import {MISSION} from './content.js';

const SAVE_KEY='misterio-maleta:partida-v1';
const $=id=>document.getElementById(id);
const readSave=()=>{try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch{return null;}};
const writeSave=save=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch{}};
const currentNickname=()=>readSave()?.state?.nickname||'Julito';

const replacements=new Map([
  ['Muy bien, [MOTE]. Intentaré recordarlo.',()=>`Muy bien, ${currentNickname()}. Intentaré recordarlo.`],
  ['Definitivamente, en el CMD el nivel de las chicas supera al de mis pasos de baile.',()=> 'Con la salsa voy a necesitar más de una clase. Con las excusas, en cambio, creo que puedo convalidar créditos.'],
  ['La cantera del Madrid. Hablan de un chaval de 17 años que promete mucho.',()=> 'Raúl González, 17 años. Apuntaré el nombre por si acaso.'],
  ['Un paquete blando de tabaco, bastante arrugado.',()=> 'Un paquete blando de Fortuna, bastante arrugado. Por una vez, la marca describe exactamente el hallazgo.'],
  ['Todavía quedan algunos cigarrillos. El anterior dueño cuidaba mejor el sofá que el paquete.',()=> 'Todavía quedan algunos cigarrillos. El sofá acaba de convertirse en mi lugar favorito del edificio.'],
  ['Un paquete de tabaco. Por fin alguien ha dejado una bienvenida con futuro.',()=> 'Un paquete de Fortuna. Literalmente. Mi madre me quitó el mío de la maleta antes de salir. Empiezo a creer en la providencia.'],
  ['No puedo subir así.',()=> 'No puedo subir así. Me falta algo esencial para la supervivencia universitaria.'],
  ['Necesito encontrar tabaco antes de enfrentarme a una tercera planta.',()=> 'Necesito encontrar tabaco antes de enfrentarme a una tercera planta. Mi madre quitó el mío de la maleta: ella lo llama educación; yo, sabotaje.'],
  ['Un hombre no vive solo de llave, maleta y puré naranja.',()=> 'Un hombre no vive solo de llave, maleta y puré naranja. Y yo no pienso averiguar cuánto duro sin tabaco.']
]);

let mariaBridge=false;
function refineLine(){
  const line=$('line');
  if(!line||!line.textContent)return;
  const text=line.textContent;
  if(text==='Yo soy María. Dime una cosa importante: ¿bailas salsa?'){
    line.textContent='Yo soy María. Esta noche estamos intentando montar una clase de salsa...';
    mariaBridge=true;
    return;
  }
  const replacement=replacements.get(text);
  if(replacement)line.textContent=replacement();
}

function showMariaQuestion(event){
  if(!mariaBridge)return false;
  const speech=event.target.closest?.('#speech,#next');
  if(!speech)return false;
  event.preventDefault();
  event.stopImmediatePropagation();
  $('line').textContent='Dime una cosa importante: ¿bailas salsa?';
  mariaBridge=false;
  return true;
}

document.addEventListener('click',event=>showMariaQuestion(event),true);
document.addEventListener('keydown',event=>{
  if(mariaBridge&&event.key==='Enter'){
    event.preventDefault();
    event.stopImmediatePropagation();
    $('line').textContent='Dime una cosa importante: ¿bailas salsa?';
    mariaBridge=false;
  }
},true);

function isPedroMenu(choices){
  const labels=[...choices.querySelectorAll('button')].map(b=>b.textContent);
  return labels.some(t=>t.includes('¿Dónde estoy exactamente?'))&&labels.some(t=>t.includes('Eso es todo'));
}
function addNicknameChoice(){
  const choices=$('choices');
  if(!choices||choices.hidden||$('change-nickname-dialogue')||!isPedroMenu(choices))return;
  const b=document.createElement('button');
  b.type='button';
  b.id='change-nickname-dialogue';
  b.textContent='Por cierto, ¿cómo has dicho que querías que te llamásemos?';
  b.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    $('nickname-settings')?.click();
  });
  choices.insertBefore(b,choices.lastElementChild||null);
}

function missionPercent(state){
  const groups=[[state.inspectedSigns,MISSION.signs],[state.usedTargets,MISSION.uses],[state.readTopics,MISSION.dialogues],[state.collectedItems,MISSION.objects]];
  let done=0,total=0;
  for(const [gotRaw,all] of groups){const got=Array.isArray(gotRaw)?gotRaw:[];done+=all.filter(id=>got.includes(id)).length;total+=all.length;}
  return total?Math.round(done/total*100):0;
}

let surprisePending=false;
function checkHundredPercent(){
  const save=readSave(),state=save?.state;
  if(!state||state.pedro100Surprise||missionPercent(state)<100)return;
  state.pedro100Surprise=true;
  save.savedAt=Date.now();
  writeSave(save);
  surprisePending=true;
  showSurpriseWhenIdle(0);
}

function showSurpriseWhenIdle(attempt){
  if(!surprisePending||attempt>40)return;
  const speech=$('speech'),card=$('card'),modal=$('modal'),inventory=$('inventory-modal');
  const idle=(!speech||speech.hidden)&&(!card||card.hidden)&&(!modal||!modal.open)&&(!inventory||!inventory.open);
  if(!idle){setTimeout(()=>showSurpriseWhenIdle(attempt+1),250);return;}
  surprisePending=false;
  const body=$('modal-body');
  if(!body||!modal)return;
  body.innerHTML=`<div class="mission-report"><small>EXPLORACIÓN COMPLETA · 100%</small><h2>Pedro tiene algo que decirte</h2><p><b>Pedro:</b> ${currentNickname()}, he visto gente tardar cuatro años en enterarse de menos cosas que tú en una tarde.</p><p><b>Julito:</b> ¿Eso es un cumplido?</p><p><b>Pedro:</b> No te acostumbres.</p><hr><p>Pedro abre un cajón, rebusca entre llaves y papeles y te entrega una pequeña ficha metálica.</p><p><b>Pedro:</b> Estaba con la llave de la 310. Pensaba dártela cuando demostrases que mirabas antes de preguntar.</p><p><b>Julito:</b> ¿Y para qué sirve?</p><p><b>Pedro:</b> Si lo supiera, no sería una sorpresa.</p><small>Has descubierto todo lo que esconde la recepción. O todo lo que Pedro admite que esconde.</small></div>`;
  modal.showModal();
}

function boot(){
  const line=$('line'),choices=$('choices');
  if(line)new MutationObserver(refineLine).observe(line,{childList:true,subtree:true,characterData:true});
  if(choices)new MutationObserver(addNicknameChoice).observe(choices,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  window.addEventListener('maleta-save',checkHundredPercent);
  refineLine();
  addNicknameChoice();
  checkHundredPercent();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
