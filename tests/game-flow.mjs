import {cleanNickname} from '../dist/nickname.js';
import * as saves from '../dist/save.js';import * as hints from '../dist/hints.js';
// Integration checks execute the real game functions with a minimal DOM/audio adapter.
// Visual composition and real browser input are checked separately in Chrome.
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import * as data from '../dist/data.js';import * as animation from '../dist/animation.js';import * as content from '../dist/content.js';
const elements=new Map();
class Element{constructor(){this.hidden=true;this.children=[];this.style={};this.dataset={};this.classList={toggle(){}};this.textContent='';}append(...a){this.children.push(...a);}replaceChildren(...a){this.children=a;}setAttribute(){}getContext(){return new Proxy({},{get:()=>()=>{}});}querySelector(){return this.child??=new Element();}showModal(){this.open=true;}close(){this.open=false;}}
class AudioStub{setTheme(){}effect(){}playLogrones(){this.anthem=(this.anthem||0)+1;}async unlock(){}}
let nicknameAnswer=null;let timer=0;const timers=new Map();const memory=new Map(),storage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)};const context={cleanNickname,openNicknameEditor:async()=>nicknameAnswer,...data,...animation,...content,...hints,readSave:()=>saves.readSave(storage),writeSave:state=>saves.writeSave(state,storage),AudioEngine:AudioStub,console,performance:{now:()=>0},document:{getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);},createElement:()=>new Element(),createTextNode:t=>t,addEventListener(){}},window:{},requestAnimationFrame(){},setTimeout(fn){const id=++timer;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);},setInterval(){return ++timer;},clearInterval(){},assert};
vm.createContext(context);let src=fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/load\(\);\s*$/,'');
vm.runInContext(src+`\nthis.testGame={choicesVisible:()=>!$('choices').hidden,intro,sceneSnapshot:()=>({scene,x:player.x,y:player.y,pose:player.pose,visible:player.visible,activeInteraction,introStage,car:{...car},entryAlpha,cmdDoor}),maybeReward,rewardMasterKey,refreshContinue,dialogueText,setNickname,continueGame,showHint,missionStats,reset,checkpoint,interact,selectVerb,inventoryClick,openInventory,enterLobby,getState:()=>state,inventoryItems,say,setBusy:value=>busy=value,getLine:()=>fullLine,getChoices:()=>$('choices').children,getDisplayName:()=>speakerName('Julito'),getInventory:()=>({open:$('inventory-modal').open,count:$('inventory-grid').children.length}),begin:()=>{state=newState();busy=false;$('choices').hidden=true;$('card').hidden=true;enterLobby();},tick:t=>draw(t),next:()=>{if(speechResolve){nextSpeech();nextSpeech();}},closeCard:()=>{if(!$('card').hidden)$('card').querySelector('button').onclick();},select:(v,item)=>{selectVerb(v);selected=item;},anthemCount:()=>audio.anthem||0,isBusy:()=>busy};`,context);
const game=context.testGame;let t=0;
// Record real requested delays even though this harness fast-forwards timers.
const readingDelays=[],schedule=context.setTimeout;
context.setTimeout=(fn,ms)=>{readingDelays.push(ms);return schedule(fn,ms);};
vm.runInContext("testGame.introDetails=()=>({introShot,speechVisible:!$('speech').hidden,door:car.door,y:player.y,visible:player.visible})",context);
async function run(action){let finished=false,error;Promise.resolve().then(action).then(()=>finished=true,e=>{error=e;finished=true;});for(let i=0;i<1500&&!finished;i++){game.tick(t+=100);game.next();game.closeCard();const nickname=game.getChoices().find(b=>b.textContent==='TOPO');if(nickname)nickname.onclick();const pending=[...timers.values()];timers.clear();for(const fn of pending)fn();await Promise.resolve();await Promise.resolve();}if(error)throw error;assert.ok(finished,'Action must complete');}
const h=id=>data.HOTSPOTS.find(x=>x.id===id);
for(const a of data.HOTSPOTS)for(const b of data.HOTSPOTS)assert.ok(data.findPath(a.at,b.at),a.id+' -> '+b.id);
let count=0;for(const v of data.VERBS)for(const hotspot of data.HOTSPOTS){game.begin();game.selectVerb(v);await run(()=>game.interact(hotspot));count++;}
game.begin();game.selectVerb('EMPUJAR');await run(()=>game.interact(h('pedro')));assert.equal(game.getState().pedroPushed,true,'Pedro must react when pushed');assert.equal(game.getState().rulesOnFloor,true,'Thrown rules must remain on the floor');game.selectVerb('COGER');await run(()=>game.interact(h('rulesBook')));assert.equal(game.getState().hasRulesBook,true,'Thrown rules must be collectible');assert.ok(game.getState().collectedItems.includes('rulesBook'));
game.begin();game.selectVerb('EMPUJAR');await run(()=>game.interact(h('prim')));assert.equal(game.getState().primPushed,true,'Pedro must reprimand Julito for pushing Prim');
game.begin();game.selectVerb('USAR');await run(()=>game.interact(h('phoneBooths')));assert.equal(game.getState().triedPhoneBooths,true,'Julito must be able to try the corridor by the radiator');
game.begin();game.selectVerb('HABLAR CON');await run(()=>game.interact(h('colegiala')));assert.equal(game.getState().talkedToSenior,true,'The senior resident conversation must be optional and reachable');assert.ok(game.getState().readTopics.includes('colegiala'));
game.begin();game.selectVerb('USAR');await run(()=>game.interact(h('elevator')));assert.equal(game.getState().calledElevator,false);assert.equal(game.getState().hasKey310,false);
game.selectVerb('HABLAR CON');await run(()=>game.interact(h('pedro')));assert.equal(game.getState().talkedToPedro,true);assert.equal(game.getState().nickname,'Topo');assert.equal(game.getDisplayName(),'Topo','Chosen nickname must replace Julito as the dialogue speaker name');const keyChoice=game.getChoices().find(b=>b.textContent.includes('Vengo a por'));assert.ok(keyChoice);await run(()=>keyChoice.onclick());assert.equal(game.getState().hasKey310,true);assert.equal(game.getState().roomAssigned,true);assert.ok(!game.getChoices().some(b=>b.textContent.includes('Vengo a por')));
await run(()=>game.getChoices().find(b=>b.textContent.includes('Eso es todo')).onclick());
game.selectVerb('COGER');await run(()=>game.interact(h('marca')));await run(()=>game.interact(h('marca')));assert.deepEqual([...game.getState().tookPapers],['marca']);assert.equal(game.getState().hasMarca,true);
game.select('USAR','marca');await run(()=>game.interact(h('correo')));assert.equal(game.getState().hasMarca,false);assert.equal(game.getState().tookPapers.length,0);
game.select('USAR','bag');await run(()=>game.interact(h('prim')));assert.equal(game.getState().hasKey310,true);
game.selectVerb('USAR');await run(()=>game.interact(h('sofa')));assert.equal(game.getState().hasTobacco,true);assert.ok(game.getState().collectedItems.includes('tobacco'));
game.selectVerb('MIRAR');await run(()=>game.inventoryClick('tobacco'));assert.equal(game.getState().inspectedTobacco,true);assert.equal(game.getState().hasComerciaNote,false,'First tobacco inspection must only describe the packet');await run(()=>game.inventoryClick('tobacco'));assert.equal(game.getState().hasComerciaNote,true,'Second tobacco inspection must reveal La Comercial invitation');assert.ok(game.getState().collectedItems.includes('comerciaNote'));
game.selectVerb('USAR');await run(()=>game.interact(h('elevator')));assert.equal(game.getState().calledElevator,false,'Empi letter must be required to use the elevator');
game.selectVerb('COGER');await run(()=>game.interact(h('mat')));assert.equal(game.getState().hasEmpiLetter,true);assert.ok(game.getState().collectedItems.includes('empiLetter'));
game.openInventory();assert.equal(game.getInventory().open,true);assert.equal(game.getInventory().count,5,'Independent inventory must list every collected item');elements.get('inventory-modal').close();
game.selectVerb('USAR');await run(()=>game.interact(h('elevator')));assert.equal(game.getState().calledElevator,false,'Rules book must be required to use the elevator');
game.selectVerb('EMPUJAR');await run(()=>game.interact(h('pedro')));game.selectVerb('COGER');await run(()=>game.interact(h('rulesBook')));assert.equal(game.getState().hasRulesBook,true);game.selectVerb('USAR');await run(()=>game.interact(h('elevator')));assert.equal(game.getState().calledElevator,true);
assert.ok(animation.perspectiveScale('lobby',551)>animation.perspectiveScale('lobby',287),'Foreground character must be larger');
assert.ok([...Array(32)].every((_,i)=>{const f=animation.movementStyle({clock:0,gait:i/4,moving:true,direction:2,scale:1,speed:135}).frame;return f>=0&&f<8;}),'Walk frame must stay inside the 8-frame cycle');
assert.ok([...Array(4)].every((_,dir)=>[...Array(8)].every((__,frame)=>{const index=animation.walkFrameIndex(dir,frame);return index>=0&&index<24;})),'Every directional walk cycle must use a valid clean frame');
assert.ok(!src.includes(']],true,e)'), 'Intro dialogue must wait for CONTINUAR instead of advancing automatically');
assert.equal(content.isAnthemLine('Soy un hincha del equipo, el Logroñés'),true);
assert.equal(game.anthemCount(),0,'Singing must never trigger anthem audio');
assert.equal(content.isAnthemLine('¿Aceptan el himno del Logroñés como música latina?'),false);
assert.equal(content.singingText('Julito','Soy un hincha'), '♪ Soy un hincha ♪');
assert.equal(content.singingText('Pedro','Soy un hincha'), 'Soy un hincha');
assert.equal(content.singingText('Julito','♪ Soy un hincha ♪'), '♪ Soy un hincha ♪');
assert.equal(content.singingText('Julito','«Las riojanas». Esto sí que es convivencia.'),'♪ «Las riojanas» ♪. Esto sí que es convivencia.');
await run(async()=>{const speech=game.say('Julito','Soy un hincha');assert.equal(game.getLine(),'♪ Soy un hincha ♪');game.next();await speech;});
console.log('PASS: '+count+' verb/hotspot combinations; '+data.HOTSPOTS.length**2+' navigation pairs; independent inventory; key, tobacco, Empi letter and rules book elevator gates; mission tracking; paper pickup, duplicate pickup and return; Prim combination; ending.');
// Resume the actual game after a completed episode, then finish optional exploration.
const completed=structuredClone(game.getState());
assert.equal(completed.secondSceneCode,true);
game.reset();await run(()=>game.continueGame());
assert.equal(game.getState().hasEmpiLetter,true);
assert.equal(game.getState().hasRulesBook,true);
assert.equal(game.getState().nickname,completed.nickname);
assert.equal(game.getState().calledElevator,false,'Continue must reopen reception, not a half-finished elevator');
assert.deepEqual([...game.getState().readTopics],completed.readTopics);
game.selectVerb('USAR');await run(()=>game.interact(h('prim')));
assert.equal(game.getState().primTrusted,true);
// The full exploration reward remains reachable from the resumed state.
for(const [group,field] of [['signs','inspectedSigns'],['uses','usedTargets'],['dialogues','readTopics'],['objects','collectedItems']])game.getState()[field]=[...content.MISSION[group]];
assert.equal(game.missionStats().percent,100);
game.selectVerb('USAR');await run(()=>game.interact(h('elevator')));
assert.equal(game.getState().bonusSeen,true,'100% must unlock Pedro’s confidence');
assert.equal(saves.readSave(storage).bonusSeen,true,'Reward must persist');
game.begin();game.selectVerb('USAR');await run(()=>game.interact(h('prim')));
assert.equal(game.getState().primClueSeen,true,'Befriending Prim must reveal the mat lead');
assert.equal(game.getState().hasEmpiLetter,false,'A clue must not collect the letter automatically');
game.selectVerb('COGER');await run(()=>game.interact(h('mat')));
assert.equal(saves.readSave(storage).hasEmpiLetter,true,'Collection must autosave');
console.log('PASS: actual resume, preserved conversations and inventory, Prim clue, 100% reward and autosave.');
// Editable nickname stays in Pedro's conversation and updates the real state.
game.begin();game.selectVerb('HABLAR CON');await run(()=>game.interact(h('pedro')));
await run(()=>game.getChoices().find(b=>b.textContent.includes('Vengo a por')).onclick());
nicknameAnswer='  El   Potele  ';
await run(()=>game.getChoices().find(b=>b.textContent.includes('cambiar mi mote')).onclick());
assert.equal(game.getState().nickname,'El Potele');
assert.equal(game.getState().hasKey310,true);
assert.equal(game.getDisplayName(),'El Potele');
assert.ok(game.getChoices().some(b=>b.textContent.includes('Eso es todo')));
nicknameAnswer=null;await run(()=>game.getChoices().find(b=>b.textContent.includes('cambiar mi mote')).onclick());
assert.equal(game.getState().nickname,'El Potele','Cancel must preserve the current nickname');
await run(()=>game.getChoices().find(b=>b.textContent.includes('Eso es todo')).onclick());
assert.equal(game.isBusy(),false,'Changing or cancelling a nickname must not lock the conversation');
assert.equal(saves.readSave(storage).nickname,'El Potele');
await run(()=>game.say('Pedro','Muy bien, [MOTE]. Intentaré recordarlo.'));
assert.equal(game.getLine(),'Muy bien, El Potele. Intentaré recordarlo.','Name replacement must happen before typing');
// Regression: completing 100% during a long conversation must never lose the reward.
for(const [group,field] of [['signs','inspectedSigns'],['uses','usedTargets'],['dialogues','readTopics'],['objects','collectedItems']])game.getState()[field]=[...content.MISSION[group]];
game.setBusy(true);const longSpeech=game.say('Pedro','Tómate tu tiempo. Esta conversación no tiene límite.');
await game.maybeReward();game.tick(t+=30000);
assert.equal(game.getState().rewardShown,false);
assert.equal(game.getState().hasMasterKey,false,'Do not silently grant a reward while its dialogue is blocked');
await run(()=>longSpeech);game.setBusy(false);
elements.get('inventory-modal').showModal();await game.maybeReward();
assert.equal(game.getState().rewardShown,false,'An open inventory must defer the reward');
elements.get('inventory-modal').close();await run(()=>game.maybeReward());
assert.equal(game.getState().rewardShown,true);assert.equal(game.getState().hasMasterKey,true);
assert.equal(game.inventoryItems().filter(id=>id==='masterKey').length,1,'The master key must appear exactly once in the actual inventory');
const lastRewardLine=game.getLine();await game.maybeReward();assert.equal(game.getLine(),lastRewardLine);
game.reset();await run(()=>game.continueGame());assert.equal(game.getState().hasMasterKey,true);assert.equal(game.getState().rewardShown,true);
assert.equal(game.inventoryItems().filter(id=>id==='masterKey').length,1);
// Visibility is derived from save state when loading finishes, regardless of elapsed time.
game.reset();elements.get('start').disabled=false;game.refreshContinue();
assert.equal(elements.get('continue-game').hidden,false);assert.equal(elements.get('continue-game').disabled,false);
console.log('PASS: custom/cancelled nickname, typing substitution, deferred 100% reward, visible master key, resume and load-independent Continue.');

// Skipping during every early awaited stage must prevent stale intro mutations.
for(let stop=0;stop<9;stop++){
 timers.clear();game.reset();let done=false;
 const pending=game.intro().then(()=>done=true);
 for(let i=0;i<stop;i++){
  const next=timers.entries().next().value;
  if(next){timers.delete(next[0]);next[1]();}
  await Promise.resolve();await Promise.resolve();
 }
 game.enterLobby();
 for(let i=0;i<30&&!done;i++){
  const callbacks=[...timers.values()];timers.clear();for(const fn of callbacks)fn();
  game.next();await Promise.resolve();await Promise.resolve();
 }
 assert.ok(done,'Skipped intro must settle');await pending;
 const snapshot=game.sceneSnapshot();assert.equal(snapshot.scene,'lobby');
 assert.equal(snapshot.x,229);assert.equal(snapshot.y,551);assert.equal(snapshot.pose,null);
 assert.equal(game.isBusy(),false);
}
game.begin();game.selectVerb('HABLAR CON');await run(()=>game.interact(h('colegiala')));
assert.equal(game.sceneSnapshot().x,714);assert.equal(game.sceneSnapshot().y,382);
assert.equal(game.sceneSnapshot().activeInteraction,null);
console.log('PASS: nine intro cancellation stages and Maria approach/interaction cleanup.');

// Complete the real cutscene and cancel independently during each animated stage.
const stages=new Set();let arrivals=[],visibleIntroLines=0;
game.reset();
await run(async()=>{
 const pending=game.intro();
 while(game.sceneSnapshot().scene==='exterior'){
  const snap=game.sceneSnapshot();stages.add(snap.introStage);
  const detail=game.introDetails();
  if(detail.speechVisible){
   visibleIntroLines++;assert.equal(snap.introStage,'farewell','No dialogue during parking or exit');
   assert.equal(detail.door,0);assert.equal(detail.y,530);assert.equal(detail.visible,true);
  }
  if(snap.introStage==='arrival')arrivals.push({...snap.car});
  await new Promise(resolve=>context.setTimeout(resolve));
 }
 await pending;
});
const introStages=['arrival','parking','door-opening','exit','door-closing','farewell','wide-shot','approach','opening-cmd','entering','closing-cmd'];
for(const stage of introStages)assert.ok(stages.has(stage),stage);
assert.ok(visibleIntroLines>0);
assert.equal(game.sceneSnapshot().scene,'lobby');assert.equal(game.isBusy(),false);
assert.ok(arrivals.some(car=>car.x>300&&car.x<900),'Car must travel through intermediate positions');
assert.ok(arrivals.every((car,i)=>i===0||(car.x<=arrivals[i-1].x&&car.y<=arrivals[i-1].y)),'Arrival must never reverse');
for(const stage of introStages){
 timers.clear();game.reset();let cancelled=false;
 await run(async()=>{
  const pending=game.intro();
  while(!cancelled){
   const snap=game.sceneSnapshot();
   if(snap.introStage===stage&&(stage!=='arrival'||snap.car.x<900)){
    game.enterLobby();cancelled=true;
   }else await new Promise(resolve=>context.setTimeout(resolve));
  }
  await pending;
 });
 const snap=game.sceneSnapshot();assert.equal(snap.scene,'lobby');assert.equal(snap.x,229);assert.equal(snap.y,551);
 assert.equal(game.introDetails().introShot,0,'Skipping restores the fixed lobby camera');
 assert.equal(snap.introStage,null);assert.equal(snap.entryAlpha,1);assert.equal(snap.cmdDoor,0);assert.equal(game.isBusy(),false);
}
console.log('PASS: dialogue only after exit, full car/CMD sequence, skipping all eleven stages.');
for(const duration of [3500,3000,14000])assert.ok(readingDelays.includes(duration),`Intro must provide ${duration} ms of reading time`);
console.log('PASS: Bilbao 3.5 s, Deusto 3 s and mission explanation 14 s.');

// Pedro's topic menu must return after every answer, including repeated topics.
game.begin();game.getState().talkedToPedro=true;game.getState().hasKey310=true;
game.getState().heardLogrones=true;game.selectVerb('HABLAR CON');await run(()=>game.interact(h('pedro')));
for(const text of ['exactamente','norma','lloviendo','Canal+','maleta','Comercial','perro']){
 const query=text==='lloviendo'?'tiempo':text;
 const option=game.getChoices().find(b=>b.textContent.includes(query));assert.ok(option,query);
 await run(()=>option.onclick());assert.ok(game.choicesVisible(),`Menu returns after ${query}`);assert.equal(game.isBusy(),true);
 assert.ok(game.getChoices().some(b=>b.textContent.includes('exactamente')),'Read topics remain available');
}
const weather=game.getChoices().find(b=>b.textContent.includes('tiempo'));
await run(async()=>{const first=weather.onclick();await weather.onclick();await first;});
assert.ok(game.choicesVisible(),'Double activation must not swallow the menu');
await run(()=>game.getChoices().find(b=>b.textContent.includes('Eso es todo')).onclick());
assert.equal(game.choicesVisible(),false);assert.equal(game.isBusy(),false);
game.selectVerb('HABLAR CON');await run(()=>game.interact(h('pedro')));assert.ok(game.choicesVisible(),'Pedro can be approached again');
console.log('PASS: all Pedro topics, repeat questions, double activation and conversation reopening.');
