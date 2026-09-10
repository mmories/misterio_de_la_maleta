import {cleanNickname,openNicknameEditor} from './nickname.js';
import {readSave,writeSave} from './save.js';
import {nextHint} from './hints.js';
import {VERBS,HOTSPOTS,TALK,newState,findPath,pointInPolygon} from './data.js';
import {AudioEngine} from './audio.js';
import {advanceWalk,headingFor,headingDirection,directionRow,idleFrame,movementStyle,perspectiveScale,walkFrameIndex} from './animation.js';
import {isAnthemLine,MISSION,MISSION_OBJECTIVE,PAPER_INFO,MASTER_KEY_DIALOGUE} from './content.js';
const $=id=>document.getElementById(id), canvas=$('canvas'),ctx=canvas.getContext('2d'),audio=new AudioEngine();
let storageWarned=false;
function checkpoint(){
 if(!state.introCompleted||scene==='title'||scene==='exterior')return;
 const ok=writeSave(state);
 if(!ok&&!storageWarned){storageWarned=true;toast('No se puede guardar en este navegador. Mantén esta pestaña abierta.');}
}
function refreshContinue(){const saved=readSave();$('continue-game').hidden=!saved;$('continue-game').disabled=!saved;}
async function continueGame(){const saved=readSave();if(!saved){refreshContinue();return;}await audio.unlock();state=saved;state.calledElevator=false;elevatorOpen=0;selected=null;verb='MIRAR';enterLobby();selectVerb('MIRAR');toast('Partida recuperada. Prim seguía vigilando.');await maybeReward();}
function showHint(){
 if(scene!=='lobby'||busy)return;
 const hint=nextHint(state);
 modal(`<small>PISTAS OPCIONALES · ${hint.level} / 3</small><h2>${hint.title}</h2><p>${hint.text}</p><p>Las pistas no restan porcentaje. Pide otra cuando la necesites.</p>`);
 checkpoint();
}
async function primClue(){
 if(!state.primTrusted||state.hasEmpiLetter)return;
 primAlert=clock+8;
 await lines(state.primClueSeen?[['Julito','Sigue mirando hacia el felpudo. Debe de tener más correspondencia que yo.']]:[['Julito','Prim olfatea mi maleta… y luego mira hacia el felpudo.'],['Pedro','Empi dejaba los recados donde nadie miraba. El casillero le parecía demasiado evidente.'],['Julito','Servicio de correos con pastor alemán. Eso sí es entrega certificada.']]);
 state.primClueSeen=true;
}
function fitToViewport(){const shell=$('shell'),vw=window.innerWidth,vh=window.innerHeight;if(!shell||!Number.isFinite(vw)||!Number.isFinite(vh))return;if(vw<=700){shell.style.zoom='1';return;}shell.style.zoom='1';const available=vh-18,natural=shell.offsetHeight;const scale=Math.min(1,available/natural);shell.style.zoom=String(Math.max(.62,scale));}
if(window.addEventListener)window.addEventListener('resize',fitToViewport);
const images={},frames={},W=960,H=600;
let state=newState(),scene='title',verb='MIRAR',selected=null,hover=null,busy=false,epoch=0,last=performance.now(),clock=0;
let player={x:229,y:551,dir:0,visible:false,pose:null},path=[],moveResolve=null,speed=135,gait=0,moveEnergy=0;
let activeInteraction=null,activeSpeaker=null;
let introTween=null,introStage=null,car={x:-220,y:430,door:0},entryAlpha=1;
function cancelIntroMotion(){if(introTween){introTween.resolve(false);introTween=null;}introStage=null;entryAlpha=1;}
function animateIntro(duration,update,e){
 return new Promise(resolve=>{introTween={elapsed:0,duration,update,resolve};update(0);}).then(()=>assertEpoch(e));
}
function advanceIntro(dt){
 if(!introTween)return;const tween=introTween;tween.elapsed+=dt;const t=Math.min(1,tween.elapsed/tween.duration);tween.update(t);
 if(t===1){introTween=null;tween.resolve(true);}
}
let carParked=false,pedroPose=3,elevatorOpen=0,breath=0,primAlert=0;
let thrownObject=null,throwResolve=null;
let nicknameSelection=null;
let speechResolve=null,typing=null,fullLine='',typed=0,speechTimer=null,toastTimer=null,objectiveTimer=null;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function assertEpoch(e){if(e!==epoch)throw new Error('cancelled');}
function setScene(s){scene=s;$('hotspots').hidden=s!=='lobby';$('ask-hint').hidden=s!=='lobby';$('location').textContent=s==='lobby'?'COLEGIO MAYOR DEUSTO · RECEPCIÓN':'BILBAO · OCTUBRE DE 1994';if($('mission-meter'))updateMissionMeter();}
function toast(t){$('toast').textContent=t;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2600);}
function showTransition(t){$('transition-text').innerHTML=t;$('transition').hidden=false;}
function hideTransition(){$('transition').hidden=true;}
function showObjective(){clearTimeout(objectiveTimer);$('objective').hidden=false;objectiveTimer=setTimeout(()=>{$('objective').hidden=true;},6200);}
function setSentence(){if(scene!=='lobby')return;const obj=hover?HOTSPOTS.find(h=>h.id===hover)?.name:'';$('sentence').textContent=selected?`${verb} ${itemName(selected)}${obj?' CON '+obj.toUpperCase():''}`:`${verb}${obj?' '+obj.toUpperCase():''}`;}
function itemName(id){return {bag:'maleta marrón',key:'llave 310',masterKey:'llave maestra',marca:'Marca',correo:'El Correo',mundo:'El Mundo',abc:'ABC',comerciaNote:'invitación de La Comercial',tobacco:'paquete de tabaco',empiLetter:'carta de Empi',rulesBook:'reglamento de convivencia'}[id]||id;}
const remember=(list,id)=>{if(!list.includes(id))list.push(id);};
function missionStats(){const groups=[['Carteles',state.inspectedSigns,MISSION.signs],['Usos',state.usedTargets,MISSION.uses],['Diálogos',state.readTopics,MISSION.dialogues],['Objetos',state.collectedItems,MISSION.objects]];let done=0,total=0;const rows=groups.map(([label,got,all])=>{const n=all.filter(id=>got.includes(id)).length;done+=n;total+=all.length;return {label,done:n,total:all.length};});return {rows,done,total,percent:Math.round(done/total*100)};}
function updateMissionMeter(){const el=$('mission-meter');el.hidden=scene!=='lobby';if(el.hidden)return;const progress=missionStats();$('mission-percent').textContent=progress.percent+'%';$('mission-fill').style.width=progress.percent+'%';el.setAttribute('aria-label',`Progreso de la misión: ${progress.percent}%`);checkpoint();}
function showMissionDetails(){if(busy)return;const progress=missionStats();modal(`<div class="mission-report"><small>MISIÓN 0 · LA LLEGADA</small><h2>La llegada</h2><section class="mission-objective"><small>OBJETIVO</small><p>${MISSION_OBJECTIVE}</p></section><h3>PROGRESO DE EXPLORACIÓN</h3><div class="report-score">${progress.percent}%</div>${progress.rows.map(r=>`<p class="progress-row"><span>${r.label}</span><b>${r.done} / ${r.total}</b><i><em style="width:${r.done/r.total*100}%"></em></i></p>`).join('')}<small>El progreso incluye acciones opcionales; no necesitas completar el 100% para terminar la misión. El 100% desbloquea la llave maestra y una confidencia de Pedro al subir. Puedes volver a recepción después del final.</small></div>`);}
function inventoryItems(){return ['bag',...(state.hasMasterKey?['masterKey']:[]),...(state.hasKey310?['key']:[]),...state.tookPapers,...(state.hasComerciaNote?['comerciaNote']:[]),...(state.hasTobacco?['tobacco']:[]),...(state.hasEmpiLetter?['empiLetter']:[]),...(state.hasRulesBook?['rulesBook']:[])];}
function inventoryIcon(id){const icon=document.createElement('span');icon.className='symbol';icon.textContent=(id==='key'||id==='masterKey')?'⚿':id==='bag'?'▣':id==='comerciaNote'?'✦':id==='empiLetter'?'✉':id==='tobacco'?'▥':id==='rulesBook'?'▧':'▤';if(images.walk&&images.actions&&!['comerciaNote','tobacco','empiLetter','rulesBook','masterKey'].includes(id)){const ic=document.createElement('canvas');ic.width=64;ic.height=54;ic.setAttribute('aria-hidden','true');const ig=ic.getContext('2d');ig.imageSmoothingEnabled=false;if(id==='bag'){ig.drawImage(frames.walk[0],frames.walk[0].width*.59,frames.walk[0].height*.56,frames.walk[0].width*.41,frames.walk[0].height*.36,17,3,32,48);}else if(id==='key'){ig.drawImage(frames.actions[6],0,45,28,65,21,0,23,54);}else{const h=HOTSPOTS.find(h=>h.id===id),[x,y,w,hh]=h.rect;ig.drawImage(images.reception,x/960*1448,y/600*1086,w/960*1448,hh/600*1086,4,10,56,35);}return ic;}return icon;}
function makeInventoryButton(id){const b=document.createElement('button');b.type='button';b.dataset.item=id;b.className=selected===id?'selected':'';b.setAttribute('role','listitem');b.setAttribute('aria-label',itemName(id)+(selected===id?', seleccionado':''));b.append(inventoryIcon(id));const label=document.createElement('span');label.textContent=itemName(id);b.append(label);if(selected===id){const mark=document.createElement('small');mark.textContent='SELECCIONADO';b.append(mark);}b.onclick=()=>{if($('inventory-modal').open)$('inventory-modal').close();inventoryClick(id);};return b;}
function refreshInventory(){const items=inventoryItems(),n=String(items.length).padStart(2,'0');$('count').textContent=n;$('inventory-total').textContent=n;$('inventory-summary').textContent=selected?'Seleccionado: '+itemName(selected):items.length===1?'1 objeto guardado':items.length+' objetos guardados';$('open-inventory').classList.toggle('has-selection',!!selected);$('items').replaceChildren(...items.map(makeInventoryButton));$('inventory-grid').replaceChildren(...items.map(makeInventoryButton));$('inventory-instruction').textContent=(verb==='USAR'||verb==='DAR')?`Elige qué objeto quieres ${verb.toLowerCase()}.`:'Pulsa un objeto para examinarlo.';checkpoint();}
function openInventory(){if(scene!=='lobby'||busy||$('modal').open)return;refreshInventory();$('inventory-modal').showModal();}
function selectVerb(v){if(busy||scene!=='lobby')return;verb=v;selected=null;for(const b of $('verbs').children)b.classList.toggle('active',b.textContent===v);refreshInventory();setSentence();}
for(const v of VERBS){const b=document.createElement('button');b.textContent=v;b.className=v===verb?'active':'';b.onclick=()=>selectVerb(v);$('verbs').append(b);}
function refreshSceneObjects(){$('hotspot-rulesBook').hidden=!state.rulesOnFloor||state.hasRulesBook;}
function setHotspots(){for(const h of HOTSPOTS){const b=document.createElement('button');b.id='hotspot-'+h.id;b.setAttribute('aria-label',h.name);b.dataset.hotspot=h.id;b.style.zIndex=h.id==='reception'?'1':'2';const [x,y,w,hg]=h.rect;Object.assign(b.style,{left:x/W*100+'%',top:y/H*100+'%',width:w/W*100+'%',height:hg/H*100+'%'});const span=document.createElement('span');span.textContent=h.name;b.append(span);b.onmouseenter=b.onfocus=()=>{hover=h.id;setSentence();};b.onmouseleave=b.onblur=()=>{hover=null;setSentence();};b.onclick=e=>{e.stopPropagation();interact(h);};b.ondblclick=e=>{e.stopPropagation();speed=310;};$('hotspots').append(b);}refreshSceneObjects();}
function cancelSpeech(){activeSpeaker=null;clearInterval(typing);clearTimeout(speechTimer);typing=null;$('speech').hidden=true;const r=speechResolve;speechResolve=null;if(r)r();}
function nextSpeech(){if(!speechResolve)return;if(typed<fullLine.length){typed=fullLine.length;$('line').textContent=fullLine;clearInterval(typing);typing=null;return;}cancelSpeech();}
function speakerName(who){if(who==='Colegiala mayor'&&state.talkedToSenior)return 'María';return who==='Julito'&&state.nickname?state.nickname:who;}
function dialogueText(text){return text.replaceAll('[MOTE]',state.nickname||'Julito');}
function say(who,text,auto=false){text=dialogueText(text);cancelSpeech();activeSpeaker=who;$('choices').hidden=true;$('speaker').textContent=speakerName(who).toUpperCase();fullLine=text;typed=0;$('line').textContent='';$('speech').hidden=false;pedroPose=who==='Pedro'?1:3;if(who==='Julito'&&scene==='lobby')player.talking=true;if(who==='Julito'&&isAnthemLine(text))audio.playLogrones?.();return new Promise(resolve=>{speechResolve=()=>{player.pose=null;player.talking=false;pedroPose=3;resolve();};typing=setInterval(()=>{typed=Math.min(fullLine.length,typed+2);$('line').textContent=fullLine.slice(0,typed);if(typed===fullLine.length){clearInterval(typing);typing=null;}},24);if(auto)speechTimer=setTimeout(cancelSpeech,Math.max(2800,text.length*52));});}
$('next').onclick=e=>{e.stopPropagation();nextSpeech();};$('speech').onclick=nextSpeech;
async function lines(list,auto=false,e=epoch){for(const [who,text] of list){assertEpoch(e);await say(who,text,auto);assertEpoch(e);}}
async function speak(text,who='Julito'){await say(who,text);}
function walk(to,fast=false,direct=false){if(moveResolve){moveResolve(false);moveResolve=null;}path=direct?[to]:findPath([player.x,player.y],to)||[];speed=fast?310:135;if(!path.length){moveEnergy=0;return Promise.resolve(false);}player.pose=null;return new Promise(r=>moveResolve=r);}
function walkRoute(points,fast=false){if(moveResolve){moveResolve(false);moveResolve=null;}path=points.map(point=>[...point]);speed=fast?310:135;if(!path.length){moveEnergy=0;return Promise.resolve(false);}player.pose=null;return new Promise(resolve=>moveResolve=resolve);}
function renderFrame(sprite,x,y,height,flip=false){if(!sprite)return;height=Math.round(height);const width=Math.round(sprite.width/sprite.height*height);ctx.save();ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,1);ctx.drawImage(sprite,Math.round(-width/2),-Math.round(height),Math.round(width),Math.round(height));ctx.restore();}
function faceHotspot(h){
 const [x,y,w,height]=h.rect,[targetX,targetY]=h.face||[x+w/2,y+height/2];
 player.heading=headingFor(targetX-player.x,targetY-player.y,player.heading??2);
 player.angle=player.heading*Math.PI/4;player.dir=headingDirection(player.heading);
}
function playerScale(){return scene==='exterior'?Math.max(40,Math.min(74,42+(player.y-419)*.23))/154:perspectiveScale(scene,player.y);}
function renderPlayer(){
 if(!player.visible)return;
 const scale=playerScale(),height=154*scale,moving=path.length>0;
 const motion=movementStyle({clock,gait,moving,direction:player.dir,scale,speed:moveEnergy});
 ctx.save();ctx.fillStyle='rgba(7,13,14,.3)';ctx.beginPath();ctx.ellipse(player.x,player.y-2,Math.max(11,height*.16)*motion.shadowScale,Math.max(3,height*.032),0,0,Math.PI*2);ctx.fill();ctx.restore();
 let f;
 const iso=scene==='lobby'&&frames.isoWalk;
 const heading=((Math.round((player.angle??((player.heading??2)*Math.PI/4))/(Math.PI/4))%8)+8)%8;
 const isoRow=[2,2,2,3,3,1,1,0][heading];
 if(iso&&player.pickupFrame!==undefined)f=frames.isoPickup[(isoRow===1||isoRow===3?3:0)+player.pickupFrame];
 else if(iso&&player.pose===null){
  if(moving)f=frames.isoWalk[isoRow*8+motion.frame];
  else if(player.talking&&isoRow>=2)f=frames.isoTalk[(isoRow-2)*2+Math.floor(clock*4)%2];
  else f=frames.isoIdle[isoRow*2+(Math.floor(clock*2)%12===11?1:0)];
 }
 else if(player.pose!==null)f=frames.actions[player.pose];
 else if(!moving&&frames.walk)f=frames.walk[directionRow(player.dir)*4];
 else if(player.dir<2&&frames.walk)f=frames.walk[(player.dir===1?4:0)+Math.floor(motion.frame/2)];
 else if(frames.walkSmooth)f=frames.walkSmooth[walkFrameIndex(player.dir,motion.frame)];
 else f=frames.walk[(player.dir===1?4:0)+(moving?[1,2,3,2,1,0,3,0][motion.frame]:0)];
 if(!f)return;
 if(!f.foot){renderFrame(f,player.x,player.y,height,player.dir===3);return;}
 const factor=height/f.bodyHeight,flip=!f.isometric&&player.dir===3;
 // Keep feet planted: breathing changes body height by less than one pixel,
 // instead of translating the whole sprite and making its shoes float.
 const pulse=!moving&&player.pose===null?Math.sin(clock*(player.talking?3.5:1.8))*.003:0;
 ctx.save();ctx.translate(Math.round(player.x),Math.round(player.y));
 if(flip)ctx.scale(-1,1);
 ctx.scale(1,1+pulse);
 ctx.drawImage(f,Math.round(-f.foot[0]*factor),Math.round(-f.foot[1]*factor),Math.round(f.width*factor),Math.round(f.height*factor));
 ctx.restore();
}
// Do not crop these sheets: transparent padding contains the shared foot anchor.
function isometricFrames(img,cols,rows){
 const out=[];
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const frame=document.createElement('canvas');frame.width=256;frame.height=256;
  frame.getContext('2d').drawImage(img,col*256,row*256,256,256,0,0,256,256);
  frame.foot=[128,224];frame.bodyHeight=190;frame.isometric=true;out.push(frame);
 }
 return out;
}
function anchorJulitoFrames(list){
 const bodyHeights=[];
 for(const frame of list){
  const {width:w,height:h}=frame,d=frame.getContext('2d').getImageData(0,0,w,h).data;
  let sum=0,count=0,bottom=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const k=(y*w+x)*4,r=d[k],g=d[k+1],b=d[k+2];
   if(d[k+3]>180){bottom=Math.max(bottom,y);if(y<h*.65&&r>g*1.45&&r>b*1.35&&r>60){sum+=x;count++;}}
  }
  frame.foot=[count?sum/count:w/2,bottom];bodyHeights.push(bottom);
 }
 // Standing poses set the common scale; crouching must make Julito shorter.
 const reference=bodyHeights.slice(0,8).sort((a,b)=>a-b)[4]||1;
 for(const frame of list)frame.bodyHeight=reference;
 return list;
}
async function pickupMotion(floor=false){
 const e=epoch;
 try{
  const poses=floor?[8,9,8]:[7,4];
  for(let i=0;i<poses.length;i++){
   assertEpoch(e);player.pose=poses[i];if(floor)player.pickupFrame=i;
   await sleep(120);
  }
  assertEpoch(e);
 }finally{delete player.pickupFrame;player.pose=null;}
}
// Restore only the silhouettes of foreground furniture from the fixed artwork.
// The floor remains in the background and never erases Julito's shadow.
const LOBBY_OCCLUDERS=[
 {y:328,polygon:[[459,277],[492,277],[492,326],[459,327]]},
 {y:406,polygon:[[0,311],[294,288],[294,405],[0,455]]},
 {y:503,polygon:[[642,398],[802,383],[910,433],[910,451],[751,461],[745,503],[735,503],[734,460],[652,420],[650,450],[644,450]]},
 {y:600,polygon:[[780,447],[842,428],[914,439],[959,445],[959,600],[813,600],[780,556]]}
];
function drawOccluder(polygon){
 ctx.save();ctx.beginPath();polygon.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();ctx.drawImage(receptionBackdrop(),0,0,W,H);ctx.restore();
}
function renderPrim(){if(frames.primIdle){const near=player.visible&&Math.hypot(player.x-269,player.y-442)<145,alert=primAlert>clock||(near&&path.length>0),phase=alert?4+Math.floor(clock*4.5)%4:idleFrame(clock,4,.8),h=alert?80:68,f=frames.primIdle[phase],w=f.width/f.height*h;ctx.save();ctx.fillStyle='rgba(7,12,13,.26)';ctx.beginPath();ctx.ellipse(269,443,w*.37,3.5,0,0,Math.PI*2);ctx.fill();ctx.restore();renderFrame(f,269,443,h);}else if(images.prim){const cellW=images.prim.width/2;ctx.drawImage(images.prim,primAlert>clock?cellW:0,40,cellW,180,205,355,128,76+breath*.4);}}
function renderLobbyActors(){
 const layers=[{y:player.y,draw:renderPlayer},{y:443,draw:renderPrim},{y:394,draw:renderSenior},...LOBBY_OCCLUDERS.map(({y,polygon})=>({y,draw:()=>drawOccluder(polygon)}))];
 layers.sort((a,b)=>a.y-b.y);for(const layer of layers)layer.draw();
}
function throwProgress(){return thrownObject?Math.min(1,(clock-thrownObject.start)/thrownObject.duration):0;}
function advanceThrownObject(){if(thrownObject&&throwProgress()>=1){thrownObject=null;const r=throwResolve;throwResolve=null;if(r)r();}}
function drawThrownObject(){if(!thrownObject)return;const p=throwProgress(),ease=1-(1-p)*(1-p),x=thrownObject.from[0]+(thrownObject.to[0]-thrownObject.from[0])*ease,y=thrownObject.from[1]+(thrownObject.to[1]-thrownObject.from[1])*ease-Math.sin(p*Math.PI)*62;ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(p*11);ctx.fillStyle='#d9c79e';ctx.strokeStyle='#554835';ctx.lineWidth=2;ctx.fillRect(-9,-5,18,10);ctx.strokeRect(-9,-5,18,10);ctx.fillStyle='#8a7655';ctx.fillRect(-5,-3,10,2);ctx.restore();}
function throwAtJulito(){thrownObject={start:clock,duration:.72,from:[184,292],to:[player.x,player.y-112]};audio.effect('throw');return new Promise(resolve=>{throwResolve=resolve;});}
function drawRulesOnFloor(){if(!state.rulesOnFloor||state.hasRulesBook)return;ctx.save();ctx.translate(377,425);ctx.rotate(-.16);ctx.fillStyle='rgba(5,8,8,.28)';ctx.fillRect(-23,7,50,5);ctx.fillStyle='#d8c69d';ctx.strokeStyle='#594a34';ctx.lineWidth=2;ctx.fillRect(-24,-10,48,22);ctx.strokeRect(-24,-10,48,22);ctx.fillStyle='#263e59';ctx.fillRect(-19,-6,38,3);ctx.fillRect(-17,0,34,2);ctx.fillRect(-14,5,28,2);ctx.restore();}
function renderSenior(){
 if(!frames.collegiala)return;
 const talking=activeSpeaker==='Colegiala mayor',engaged=activeInteraction==='colegiala';
 const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:1;
 const lean=engaged?-1.5:0,nod=talking?Math.sin(clock*4)*.7:engaged?Math.sin(clock*1.6)*.25:0;
 ctx.save();ctx.fillStyle='rgba(5,8,8,.2)';ctx.beginPath();ctx.ellipse(831,389,25,3,0,0,Math.PI*2);ctx.fill();ctx.restore();
 ctx.save();ctx.translate(831,394);ctx.rotate((lean+nod)*motion*Math.PI/180);
 renderFrame(frames.collegiala,0,0,150);ctx.restore();
 // A discreet cue marks attention, without enlarging or bouncing the seated body.
 if(engaged&&path.length){ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle='#e8be71';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(714,382,12,3,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
}
function drawAtmosphere(){
// Tiny, deterministic pixels keep the rooms alive while preserving the deliberately crisp VGA art.
ctx.save();
if(scene==='title'||scene==='exterior'){
const haze=ctx.createLinearGradient(0,40,0,390);haze.addColorStop(0,'rgba(208,226,255,.055)');haze.addColorStop(1,'rgba(255,213,151,0)');ctx.fillStyle=haze;ctx.fillRect(0,0,W,390);ctx.globalCompositeOperation='screen';
for(let i=0;i<12;i++){const x=((clock*(5+i%3*1.7)+i*97)%(W+70))-35,y=116+(i*61)%245+Math.sin(clock*.85+i)*4;ctx.fillStyle=i%3?'rgba(255,235,187,.16)':'rgba(204,225,255,.14)';ctx.fillRect(Math.round(x),Math.round(y),2,1);}
}else{
ctx.globalCompositeOperation='screen';
for(let i=0;i<17;i++){const x=115+(i*127+clock*(3+i%2))%720,y=195+(i*53)%300+Math.sin(clock*.7+i*2)*3;ctx.fillStyle=i%4?'rgba(255,236,183,.12)':'rgba(202,224,224,.13)';ctx.fillRect(Math.round(x),Math.round(y),i%5===0?2:1,1);}
ctx.globalAlpha=.12;ctx.fillStyle='#ffe7a8';ctx.fillRect(382,382,105,1);ctx.fillRect(510,414,83,1);ctx.fillRect(281,475,66,1);
}
ctx.restore();
}
function drawExterior(){
 ctx.drawImage(images.exterior,0,0,W,H);
 if(scene!=='exterior'||!introStage||!images.passat)return;
 ctx.save();ctx.translate(Math.round(car.x),Math.round(car.y));
 ctx.fillStyle='rgba(8,12,18,.28)';ctx.beginPath();ctx.ellipse(94,-5,91,9,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(images.passat,0,-94,190,94);
 ctx.restore();
}
function drawCarDoor(){
 if(!introStage||car.door<=0)return;
 // Hinged front door, in the same palette and perspective as the Passat.
 const hingeX=car.x+100,hingeY=car.y-49,spread=car.door*24;
 ctx.save();ctx.translate(hingeX,hingeY);ctx.strokeStyle='#343b43';ctx.lineWidth=1;
 ctx.fillStyle='#899095';ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(-31-spread,-25+spread*.6);ctx.lineTo(-33-spread,17+spread*.6);ctx.lineTo(0,22);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#36516a';ctx.beginPath();ctx.moveTo(-3,-16);ctx.lineTo(-28-spread,-21+spread*.6);ctx.lineTo(-29-spread,-5+spread*.6);ctx.lineTo(-3,1);ctx.closePath();ctx.fill();
 ctx.fillStyle='#24292d';ctx.fillRect(-25-spread,5+spread*.6,6,2);ctx.restore();
}
function drawExteriorPlayer(){
 ctx.save();ctx.globalAlpha=entryAlpha;
 if(introStage==='entering'){ctx.beginPath();ctx.rect(496,383,27,43);ctx.clip();}
 renderPlayer();ctx.restore();drawCarDoor();
}
function drawIntroFrame(){
 if(scene!=='exterior')return;
 ctx.save();ctx.fillStyle='rgba(4,8,12,.88)';ctx.fillRect(0,0,W,18);ctx.fillRect(0,H-18,W,18);ctx.restore();
}
function receptionBackdrop(){return images.receptionV2||images.reception;}
function draw(t){const dt=Math.min(Math.max((t-last)/1000,0),.1);last=t;clock+=dt;advanceIntro(dt);breath=Math.sin(clock*1.8);
if(path.length){
 const movement=advanceWalk(player,path,moveEnergy,gait,speed,dt,scene);
 moveEnergy=movement.energy;gait=movement.gait;
 if(movement.steps)audio.effect('step');
 if(!path.length&&moveResolve){const resolve=moveResolve;moveResolve=null;resolve(true);}
}else moveEnergy=0;
advanceThrownObject();
ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,W,H);
if(images.exterior){if(scene==='lobby'||scene==='end')ctx.drawImage(receptionBackdrop(),0,0,W,H);else drawExterior();drawAtmosphere();if(scene==='title'||scene==='exterior'){ctx.fillStyle=`rgba(255,221,125,${.035+.025*Math.sin(clock*2)})`;ctx.fillRect(502,390,19,13);if(scene==='exterior'){drawExteriorPlayer();drawIntroFrame();}}
if(scene==='lobby'||scene==='end'){
// Pedro is composited behind the existing desk and glazing, preserving depth.
ctx.save();ctx.beginPath();ctx.rect(72,183,126,115);ctx.clip();const pedroIdle=pedroPose===3?Math.sin(clock*1.35):0,pedroShift=pedroPose===3?Math.sin(clock*.42)*.7:0,pedroFrame=pedroPose===3&&frames.pedroIdle?frames.pedroIdle[idleFrame(clock,8,.95)]:frames.pedro[pedroPose];renderFrame(pedroFrame,148+pedroShift,340-pedroIdle*.45,147);ctx.restore();

if(elevatorOpen>0){const a=HOTSPOTS.find(h=>h.id==='elevator').rect;ctx.save();ctx.beginPath();ctx.rect(594,205,30,67);ctx.clip();ctx.fillStyle='#161818';ctx.fillRect(606-elevatorOpen*13,205,elevatorOpen*26,67);ctx.restore();ctx.fillStyle='#f3c474';ctx.fillRect(580,229,3,4);}
drawRulesOnFloor();renderLobbyActors();drawThrownObject();}
}requestAnimationFrame(draw);}
function spriteFrames(img){
 const xs=[60,350,625,900,1215],ys=[0,313,620,926,1254],out=[];
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const sw=xs[col+1]-xs[col],sh=ys[row+1]-ys[row],c=document.createElement('canvas');c.width=sw;c.height=sh;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,xs[col],ys[row],sw,sh,0,0,sw,sh);const data=g.getImageData(0,0,sw,sh),d=data.data,seen=new Uint8Array(sw*sh),q=[];
  function isBackdrop(k){const r=d[k],gg=d[k+1],b=d[k+2];return r>168&&gg>162&&b>142&&Math.max(r,gg,b)-Math.min(r,gg,b)<70;}
  function visit(i){if(i<0||i>=sw*sh||seen[i])return;seen[i]=1;const k=i*4;if(isBackdrop(k)){d[k+3]=0;q.push(i);}}
  for(let x=0;x<sw;x++){visit(x);visit((sh-1)*sw+x);}for(let y=0;y<sh;y++){visit(y*sw);visit(y*sw+sw-1);}for(let n=0;n<q.length;n++){const i=q[n],x=i%sw;if(x>0)visit(i-1);if(x<sw-1)visit(i+1);if(i>=sw)visit(i-sw);if(i<sw*(sh-1))visit(i+sw);}
  const clean=new Uint8ClampedArray(d);for(let y=1;y<sh-1;y++)for(let x=1;x<sw-1;x++){const i=y*sw+x,k=i*4;if(!d[k+3]||!isBackdrop(k))continue;const neighbors=[i-1,i+1,i-sw,i+sw],transparent=neighbors.filter(n=>!d[n*4+3]).length;if(!transparent)continue;let source=-1,best=1e9;for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){const n=(y+oy)*sw+x+ox,nk=n*4;if(d[nk+3]&&!isBackdrop(nk)){const score=Math.abs(ox)+Math.abs(oy);if(score<best){best=score;source=nk;}}}if(source>=0){clean[k]=d[source];clean[k+1]=d[source+1];clean[k+2]=d[source+2];clean[k+3]=Math.min(d[k+3],210);}else clean[k+3]=0;}
  data.data.set(clean);g.putImageData(data,0,0);let l=sw,r=0,top=sh,bottom=0;for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(clean[(y*sw+x)*4+3]){l=Math.min(l,x);r=Math.max(r,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}const pad=2,trimmed=document.createElement('canvas');trimmed.width=r-l+1+pad*2;trimmed.height=bottom-top+1+pad*2;trimmed.getContext('2d').drawImage(c,l,top,r-l+1,bottom-top+1,pad,pad,r-l+1,bottom-top+1);out.push(trimmed);
 }
 return out;
}
function transparentGridFrames(img,cols,rows,{cutoff=72,harden=true}={}){const out=[];for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const sx=Math.round(col*img.width/cols),ex=Math.round((col+1)*img.width/cols),sy=Math.round(row*img.height/rows),ey=Math.round((row+1)*img.height/rows),sw=ex-sx,sh=ey-sy,c=document.createElement('canvas');c.width=sw;c.height=sh;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,sx,sy,sw,sh,0,0,sw,sh);const pixels=g.getImageData(0,0,sw,sh),d=pixels.data;let l=sw,r=-1,t=sh,b=-1;for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){const a=(y*sw+x)*4+3;if(d[a]<cutoff)d[a]=0;else if(harden)d[a]=d[a]<235?235:255;if(d[a]){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}}g.putImageData(pixels,0,0);const pad=2,frame=document.createElement('canvas');frame.width=Math.max(1,r-l+1+pad*2);frame.height=Math.max(1,b-t+1+pad*2);if(r>=l)frame.getContext('2d').drawImage(c,l,t,r-l+1,b-t+1,pad,pad,r-l+1,b-t+1);out.push(frame);}return out;}
function transparentSingleSprite(img){const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0);const pixels=g.getImageData(0,0,c.width,c.height),d=pixels.data,w=c.width,h=c.height,seen=new Uint8Array(w*h),queue=[];const backdrop=i=>d[i*4]>225&&d[i*4+1]>225&&d[i*4+2]>225&&Math.max(d[i*4],d[i*4+1],d[i*4+2])-Math.min(d[i*4],d[i*4+1],d[i*4+2])<24;const visit=i=>{if(i<0||i>=w*h||seen[i]||!backdrop(i))return;seen[i]=1;d[i*4+3]=0;queue.push(i);};for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}for(let n=0;n<queue.length;n++){const i=queue[n],x=i%w;if(x)visit(i-1);if(x<w-1)visit(i+1);if(i>=w)visit(i-w);if(i<w*(h-1))visit(i+w);}let left=w,right=-1,top=h,bottom=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}g.putImageData(pixels,0,0);const pad=3,out=document.createElement('canvas');out.width=right-left+1+pad*2;out.height=bottom-top+1+pad*2;out.getContext('2d').drawImage(c,left,top,right-left+1,bottom-top+1,pad,pad,right-left+1,bottom-top+1);return out;}
async function intro(){
 const e=++epoch;busy=true;player.visible=false;player.pose=null;path=[];carParked=false;cancelIntroMotion();car={x:-220,y:430,door:0};introStage='arrival';state=newState();refreshInventory();$('title').hidden=true;$('skip').hidden=false;$('sentence').textContent='Bilbao. Octubre de 1994.';audio.setTheme('exterior');setScene('exterior');$('transition').classList.toggle('intro-slate',true);showTransition('BILBAO<small>Octubre de 1994</small>');
 try{
  await sleep(1000);assertEpoch(e);hideTransition();audio.effect('engine');
  await animateIntro(2.8,t=>{const eased=1-Math.pow(1-t,3);car.x=-220+520*eased;car.y=430+118*eased;},e);
  carParked=true;introStage='exit';await sleep(220);assertEpoch(e);audio.effect('door');
  await animateIntro(.35,t=>car.door=t,e);
  player.visible=true;player.x=386;player.y=538;player.dir=0;player.pose=8;
  await animateIntro(.55,t=>{player.x=386+15*t;player.y=538+20*t;player.pose=t<.45?8:null;},e);
  audio.effect('case');player.pose=11;await sleep(380);assertEpoch(e);player.pose=null;
  await animateIntro(.3,t=>car.door=1-t,e);audio.effect('door');introStage='farewell';
  await lines([['Desde el coche','¡Escribe cuando llegues!'],['Julito','Pero si ya he llegado.']],false,e);
  await lines([['Julito','Bueno… pues aquí empieza todo.'],['Julito','Mi madre ha metido ropa para cuatro años. La carrera dura cinco.']],false,e);
  introStage='approach';await walkRoute([[496,558],[496,483],[472,451],[491,435],[507,419]]);assertEpoch(e);
  introStage='entering';audio.effect('door');
  await animateIntro(.65,t=>{player.y=419-7*t;entryAlpha=1-t;},e);player.visible=false;
  showTransition('COLEGIO MAYOR DEUSTO');await sleep(700);assertEpoch(e);enterLobby();const lobbyEpoch=epoch;busy=true;await walk([300,498]);assertEpoch(lobbyEpoch);busy=false;
 }catch(err){if(err.message!=='cancelled')throw err;}
}
function enterLobby(){cancelIntroMotion();$('transition').classList.toggle('intro-slate',false);activeInteraction=null;const firstVisit=!state.introCompleted;epoch++;cancelSpeech();if(moveResolve)moveResolve(false);moveResolve=null;path=[];moveEnergy=0;gait=0;carParked=false;player={x:229,y:551,dir:1,visible:true,pose:null};$('title').hidden=true;$('skip').hidden=true;hideTransition();setScene('lobby');state.introCompleted=true;busy=false;audio.setTheme('lobby');$('hint').textContent='Elige un verbo y un objeto. Doble clic para caminar más deprisa.';setSentence();refreshInventory();refreshSceneObjects();updateMissionMeter();if(firstVisit)showObjective();checkpoint();requestAnimationFrame(fitToViewport);}
$('skip').onclick=()=>enterLobby();
function setNickname(value){state.nickname=cleanNickname(value)||'Julito';checkpoint();return state.nickname;}
function chooseNickname(){return new Promise(resolve=>{nicknameSelection=async(nickname,reply=[])=>{nicknameSelection=null;$('choices').hidden=true;$('choices').replaceChildren();setNickname(nickname);await lines(reply);resolve();};const options=[['Topo',[['Julito','Topo. Suena discreto.'],['Pedro','Perfecto. Ya solo te falta aprender a ver en la oscuridad.']]],['Julito',[['Julito','Prefiero Julito. Ya está suficientemente trabajado.'],['Pedro','Conservador en el nombre, aventurero con la maleta.']]],['El Riojano',[['Julito','El Riojano. Para que no haya dudas.'],['Pedro','No las había desde que empezaste a cantar.']]]];$('choices').replaceChildren();for(const [nickname,reply] of options){const b=document.createElement('button');b.textContent=nickname.toUpperCase();b.onclick=()=>nicknameSelection(nickname,reply);$('choices').append(b);}$('choices').hidden=false;});}
async function conversation(){if(!state.talkedToPedro){await lines(TALK.welcome);await lines([['Pedro','Esa maleta… ¿otra vez por aquí?'],['Julito','Yo es la primera vez que vengo.'],['Pedro','Hablaba de la maleta. Bueno. Del modelo.']]);await speak('Entonces elige. ¿Qué mote prefieres que te pongan?','Pedro');await chooseNickname();await lines(TALK.welcomeAfterNickname);state.talkedToPedro=true;remember(state.readTopics,'welcome');remember(state.readTopics,'nickname');updateMissionMeter();}else if(state.hasKey310)await lines(TALK.after);showChoices();}
function showChoices(){
 const options=[...(!state.hasKey310?[['key','Vengo a por la llave de mi habitación.']]:[]),['place','¿Dónde estoy exactamente?'],['rules','¿Hay alguna norma que debería conocer?'],['weather','¿Siempre hace este tiempo en Bilbao?'],['canal','¿Los viernes por la noche sigue funcionando Canal+ o quitas la llave?'],['suitcase','¿Pasa algo con mi maleta?'],...(state.heardLogrones||state.hasComerciaNote?[['comercia','¿La Comercial es una asignatura o una amenaza?']]:[]),['prim','¿Y este perro?'],['changeName','Por cierto, quiero cambiar mi mote.'],['bye','Eso es todo. Gracias, Pedro.']];
 $('choices').replaceChildren();
 for(const [id,label] of options){const b=document.createElement('button');b.textContent=(state.readTopics.includes(id)?'· ':'')+label;b.onclick=async()=>{
  $('choices').hidden=true;
  if(id==='changeName'){const value=await openNicknameEditor(state.nickname||'Julito');if(value!==null)setNickname(value);showChoices();return;}
  if(id==='bye'){remember(state.readTopics,'bye');updateMissionMeter();await speak('Los ascensores están al fondo. La aventura ya es cosa tuya.','Pedro');busy=false;await maybeReward();return;}
  if(id==='prim'){primAlert=clock+6;await lines([['Pedro','Prim. Pastor alemán. Recepcionista adjunto.'],['Julito','¿Y qué hace?'],['Pedro','Lo mismo que yo, pero cae mejor.'],['Pedro','Siempre está aquí. Si levanta las orejas, será por algo.']]);}
  else if(id==='comercia'){await lines([['Pedro','Es un grupo de alumnos con agenda, corbata y una opinión sobre todo.'],['Julito','¿Y se puede entrar?'],['Pedro','Claro. Primero hay que saber que existe. Ya llevas ventaja.']]);}
  else if(state.readTopics.includes(id)&&id==='weather')await speak('Sigue lloviendo. El parte anterior continúa vigente.','Pedro');
  else await lines(TALK[id]);
  remember(state.readTopics,id);
  if(id==='key'){pedroPose=6;player.pose=6;audio.effect('key');await sleep(650);state.roomAssigned=true;state.hasKey310=true;remember(state.collectedItems,'key');player.pose=null;pedroPose=3;refreshInventory();toast('Has conseguido: LLAVE 310');await speak('Los ascensores están al fondo. Y no pierdas la llave: el duplicado también está perdido y la llave maestra no se presta a cualquiera.','Pedro');}
  if(id==='suitcase'){primAlert=clock+5;if(state.hasEmpiLetter)await lines([['Julito','Empi escribió que la maleta había vuelto. Usted también lo ha dicho.'],['Pedro','Entonces ya sois dos los que deberíais hablar más bajo.']]);}updateMissionMeter();showChoices();
 };$('choices').append(b);}
 $('choices').hidden=false;
}
function showPaper(id){const paper=PAPER_INFO[id],card=$('card');if(paper)card.innerHTML=`<article class="newspaper-view"><img src="assets/${paper.image}" alt="Portada de ${paper.name}, octubre de 1994"><div><small>ESPAÑA · OCTUBRE DE 1994</small><h2>${paper.name}</h2><h3>${paper.title}</h3><p>${paper.subtitle}</p></div><button>PLEGAR EL PERIÓDICO</button></article>`;else{const info=['LA COMERCIAL','INVITACIÓN RESERVADA','Reunión a las 19:00. Corbata opcional; hablar de mercados, inevitable.','«La élite de los alumnos de Deusto». La modestia no ha pasado el filtro.'];card.innerHTML=`<small>OCTUBRE DE 1994</small><h2>${info[0]}</h2><h3>${info[1]}</h3><p>${info[2]}</p><hr><p>${info[3]}</p><button>DEJAR DE LEER</button>`;}card.hidden=false;audio.effect('paper');return new Promise(r=>{let closed=false;const close=()=>{if(closed)return;closed=true;audio.effect('paper');card.hidden=true;card.onclick=null;r();};card.querySelector('button').onclick=e=>{e?.stopPropagation?.();close();};card.onclick=close;});}
function showEmpiLetter(){const card=$('card');card.innerHTML='<article class="letter-view"><small>CARTA ENCONTRADA BAJO EL FELPUDO</small><h2>Para quien ocupe la 310</h2><p>Si la maleta marrón ha vuelto, no ha llegado sola.</p><p>Antes de subir, averigua qué recuerda quien guarda todas las llaves. No te fíes de lo que falta: fíjate en lo que alguien se ha molestado en dejar.</p><strong>— EMPI, excolegial</strong><button>GUARDAR LA CARTA</button></article>';card.hidden=false;audio.effect('paper');return new Promise(resolve=>{let closed=false;const close=()=>{if(closed)return;closed=true;audio.effect('paper');card.hidden=true;card.onclick=null;resolve();};card.querySelector('button').onclick=e=>{e?.stopPropagation?.();close();};card.onclick=close;});}
function showRulesBook(){const card=$('card');card.innerHTML='<article class="rules-view"><small>COLEGIO MAYOR DEUSTO · OCTUBRE DE 1994</small><h2>Normas de convivencia</h2><ol><li>Queda prohibido acceder al <b>bloque derecho</b>, reservado a las colegialas. Izquierda y Central son bloques masculinos.</li><li>No se permite introducir ni consumir <b>bebidas alcohólicas</b>. La infracción podrá sancionarse con <b>tarjeta amarilla</b>; la reincidencia, con una conversación de Potele acompañada de gráficos.</li><li>Se guardará silencio desde las 23:00. Cantar el himno del Logroñés no constituye una excepción, aunque se estudia.</li><li>Las visitas deberán anunciarse en recepción. Pedro ya se habrá enterado antes, pero conviene mantener las formas.</li><li>No se dejarán maletas, bicicletas ni estudiantes dormidos en los pasillos.</li><li>Queda prohibido lanzar naranjas al edificio Plaza desde las ventanas. Las actividades oficiales se realizarán únicamente en fin de semana.</li><li>El ColaCao del comedor es para todos. Esta norma se recuerda expresamente a <b>Fran Novoa</b>.</li></ol><p class="rules-signature">La Dirección · Supervisión horaria: Potele</p><button>GUARDAR EL REGLAMENTO</button></article>';card.hidden=false;audio.effect('paper');return new Promise(resolve=>{let closed=false;const close=()=>{if(closed)return;closed=true;audio.effect('paper');card.hidden=true;card.onclick=null;resolve();};card.querySelector('button').onclick=e=>{e?.stopPropagation?.();close();};card.onclick=close;});}
async function newspaperComment(id){const repeated=state.readPapers.includes(id);remember(state.readPapers,id);if(id==='mundo')await lines([['Julito','Roldán sigue dando quebraderos de cabeza al Gobierno. Parece que últimamente no se habla de otra cosa.'],['Julito','Debería ser el periódico regional.']]);else if(id==='correo')await speak(repeated?'A ver qué cuentan del Athletic…':'El Correo. Edición de Vizcaya. Noticias de casa. Bilbao parece ahora bastante lejos.');else if(id==='abc')await speak(repeated?'Don Juan Carlos y doña Sofía. Parece la foto oficial de España.':'El ABC. Los Reyes, el desfile, la Fiesta Nacional… muy ABC.');else if(id==='marca')await lines([['Julito','Raúl González, 17 años. Apuntaré el nombre por si acaso.'],['Julito','Ya. Como todos los años.']]);}
async function inventoryClick(id){if(busy||scene!=='lobby')return;if(verb==='USAR'||verb==='DAR'){selected=selected===id?null:id;refreshInventory();setSentence();return;}busy=true;if(id==='masterKey')await speak('La llave maestra del Colegio Mayor. Pedro me la ha confiado por descubrir todos los secretos de recepción. Mejor reservarla para las puertas que aún no conozco.');else if(id==='key')await speak('Habitación 310, Tercero Central. Una llave de verdad, con un llavero que podría usarse de pisapapeles.');else if(id==='bag')await speak('Mi maleta marrón. Tiene más kilómetros que yo y se queja bastante menos. Mejor la abro en la habitación: aquí tendría que matricular también los calcetines.');else if(id==='tobacco'){if(!state.inspectedTobacco){state.inspectedTobacco=true;await lines([['Julito','Un paquete blando de Fortuna, bastante arrugado. Por una vez, la marca describe exactamente el hallazgo.'],['Julito','Todavía quedan algunos cigarrillos. Menos mal: mi madre me quitó el tabaco de la maleta antes de salir. Según ella era por mi bien. Según yo, era un intento de asesinato a medio plazo.']]);}else if(!state.hasComerciaNote){await lines([['Julito','Un momento… el cartón interior tiene más grosor del normal.'],['Julito','Hay algo doblado detrás del envoltorio.']]);audio.effect('paper');state.hasComerciaNote=true;remember(state.collectedItems,'comerciaNote');refreshInventory();toast('Has encontrado: INVITACIÓN DE LA COMERCIAL');await showPaper('comerciaNote');await speak('Una invitación de La Comercial escondida dentro del tabaco. La élite también necesita un buen escondite.');}else await speak('El paquete está arrugado y ahora ya no esconde nada. Por suerte, todavía conserva lo importante.');}else if(id==='empiLetter'){await showEmpiLetter();await speak('Empi sabía lo de la maleta y la 310. Esta carta no estaba ahí por casualidad.');}else if(id==='rulesBook'){await showRulesBook();await speak('Siete normas y ni una explica cómo esquivar un reglamento en pleno vuelo.');}else{await showPaper(id);if(PAPER_INFO[id])await newspaperComment(id);}player.pose=null;busy=false;checkpoint();await maybeReward();}
async function interact(h){if(busy||scene!=='lobby')return;busy=true;activeInteraction=h.id;try{if(!await walk(h.at))return;faceHotspot(h);if(h.id==='rulesBook'&&!state.rulesOnFloor&&!state.hasRulesBook){await speak('Aquí todavía no hay ningún reglamento. Y casi prefiero no preguntar de dónde vendrá.');return;}if(verb==='MIRAR'&&MISSION.signs.includes(h.id))remember(state.inspectedSigns,h.id);if(verb==='USAR'&&MISSION.uses.includes(h.id))remember(state.usedTargets,h.id);if(selected){await useItem(selected,h);selected=null;refreshInventory();setSentence();return;}if(verb==='MIRAR'){if(h.flag)state[h.flag]=true;if(h.id==='board'){await lines([['Julito','PROGRAMA DE ACTIVIDADES. Esto promete organización, que ya es mucho prometer.'],['Julito','Lunes: Recikleta. Martes: clases de korroskoko. Miércoles: clases de mus.'],['Julito','Jueves: torneo de parchís. Viernes: torneo de futbito.'],['Julito','Sábados y domingos: lanzamiento de naranjas al edificio Plaza.'],['Julito','El baloncesto queda descartado: aquí ya hay demasiada gente intentando llegar demasiado alto.'],['Julito','El Plaza pone la fachada y nosotros la vitamina C. Esto sí es arquitectura participativa.']]);}else if(h.id==='comercia'){state.heardLogrones=true;await lines([['Julito','«La Comercial: la élite de los alumnos de Deusto». Han puesto el ego en letras doradas.'],['Julito','Y debajo alguien ha escrito una canción más útil.'],['Julito','«Soy un hincha del equipo, el Logroñés; riojano de cepa, ganar no se deja…»'],['Julito','«…las riojanas nos ayudan a vencer». Esto sí que es convivencia.']]);}else if(h.id==='rulesBook'){await showRulesBook();await speak('Ahora entiendo el grosor: cada norma viene con amenaza y nota al pie.');}else if(PAPER_INFO[h.id]){await showPaper(h.id);await newspaperComment(h.id);}else if(h.id==='prim'){primAlert=clock+4;await speak('Prim. Pastor alemán. Tiene cara de saber quién vuelve tarde y de no contarlo.');await primClue();}else await speak(h.look||'No parece esconder nada. Eso siempre es sospechoso.');return;}
if(h.id==='plant'&&verb==='USAR'){await lines([['Julito','Voy a comprobar si esta planta es María.'],['Julito','No. Esta solo necesita agua; María necesitaría un escondite bastante menos visible que la recepción.']]);return;}
if(h.id==='pedro'&&verb==='USAR'){await lines([['Julito','Perdona, Pedro. Cuando conozco a alguien me sale tocarle el cuello.'],['Pedro','Pues que se te salga por la puerta.'],['Julito','Entendido. Recepción también atiende límites personales.']]);return;}
if(h.id==='pedro'&&verb==='EMPUJAR'){const repeated=state.pedroPushed;state.pedroPushed=true;remember(state.usedTargets,'pedro');player.pose=7;pedroPose=2;await speak(repeated?'¿Otra vez? Ahora va el reglamento con suplemento.':'¿Se puede saber qué haces? Aquí el mostrador no convierte los empujones en saludos.','Pedro');pedroPose=5;player.pose=null;await throwAtJulito();audio.effect('case');player.pose=9;if(!state.hasRulesBook)state.rulesOnFloor=true;refreshSceneObjects();await sleep(380);pedroPose=3;await lines(repeated?[['Julito','Confirmado: la normativa conserva la misma trayectoria.'],['Pedro','Y todavía me queda el tomo de horarios.']]:[['Pedro','Toma. El reglamento de convivencia. A ver si por vía aérea entra mejor.'],['Julito','Ya veo que aquí las normas no solo se explican: también se proyectan.'],['Pedro','Primer aviso. El segundo viene encuadernado.']]);player.pose=null;return;}
if(h.id==='prim'&&verb==='EMPUJAR'){const repeated=state.primPushed;state.primPushed=true;primAlert=clock+9;player.pose=7;audio.effect('case');await sleep(260);player.pose=null;await lines(repeated?[['Pedro','Julito, te lo he dicho una vez. A Prim no se le empuja.'],['Julito','Solo comprobaba si la norma seguía vigente.'],['Pedro','Sigue vigente. Y Prim también tiene memoria.']]:[['Pedro','¡Eh! A Prim no se le empuja. Él estaba aquí antes que tú y se comporta bastante mejor.'],['Julito','Era un saludo con demasiado impulso.'],['Pedro','Pues saluda con la mano. Y mantenla lejos del perro.'],['Julito','Entendido. Prim: retiro oficialmente el empujón.']]);return;}
if(h.id==='radiator'&&verb==='USAR'){await speak('Está caliente. Oficialmente ya conozco el rincón más acogedor de la recepción.');return;}
if(h.id==='radiator'&&verb==='EMPUJAR'){await speak('Está firmemente sujeto. Alguien ya previó la desesperación de los residentes.');return;}
if(h.id==='phoneBooths'&&['USAR','EMPUJAR'].includes(verb)){state.triedPhoneBooths=true;player.dir=2;await lines([['Julito','Por aquí están las cabinas telefónicas. Voy a intentar girar a la derecha.'],['Pedro','Intentar puedes, pero usarlas no. Están siempre ocupadas por un Precoz Gañán.'],['Julito','¿Precoz?'],['Pedro','Para coger la cabina. Para terminar la llamada, no.'],['Julito','Entonces tendré que esperar a que el Logroñés gane la Copa de Europa para llamar a casa.']]);return;}
if(h.id==='stairs'&&['USAR','SUBIR','EMPUJAR'].includes(verb)){await lines([['Julito','Podría subir por las escaleras…'],['Julito','Pero no es hora de hacer deporte. Y la maleta ya va ganando por puntos.'],['Julito','Ganar no se deja, pero subir tampoco me apetece.']]);return;}
if(h.id==='sofa'&&verb==='USAR'){player.pose=11;if(!state.hasTobacco){await lines([['Julito','Un sofá de skay. Parece diseñado para que uno se arrepienta de sentarse.'],['Julito','Pero… ¿qué es esto entre los cojines?'],['Julito','Un paquete de Fortuna. Literalmente. Mi madre me quitó el mío de la maleta antes de salir y yo empezaba a calcular cuánto podía sobrevivir sin fumar.'],['Julito','Soy un hincha del equipo, el Logroñés… y ahora además del sofá.']]);state.hasTobacco=true;remember(state.collectedItems,'tobacco');refreshInventory();toast('Has encontrado: PAQUETE DE TABACO');}else await speak('El sofá sigue igual de incómodo. Ahora yo estoy bastante más contento.');player.pose=null;return;}
if(h.id==='mat'&&['COGER','USAR'].includes(verb)){if(!state.hasEmpiLetter){await pickupMotion(true);player.pose=4;audio.effect('paper');await lines([['Julito','A ver qué escondes, felpudo…'],['Julito','Una carta para quien ocupe la 310. La firma un excolegial: Empi.']]);player.pose=4;await sleep(320);state.hasEmpiLetter=true;remember(state.collectedItems,'empiLetter');refreshInventory();toast('Has encontrado: CARTA DE EMPI');await showEmpiLetter();await speak('Alguien esperaba que yo encontrase esto. Empieza a gustarme bastante menos mi felpudo.');player.pose=null;}else await speak('Debajo ya no queda nada. El felpudo ha agotado su aportación al misterio.');return;}
if(h.id==='rulesBook'&&verb==='COGER'){await pickupMotion(true);player.pose=4;audio.effect('paper');await sleep(320);state.rulesOnFloor=false;state.hasRulesBook=true;remember(state.collectedItems,'rulesBook');refreshSceneObjects();refreshInventory();toast('Has cogido: REGLAMENTO DE CONVIVENCIA');await speak('Ya es mío. Si Pedro vuelve a lanzarlo, al menos podré alegar duplicidad administrativa.');player.pose=null;return;}
if(h.id==='rulesBook'&&verb==='USAR'){await showRulesBook();await speak('Conviene leerlo: la próxima tarjeta quizá no sea de bienvenida.');return;}
if(verb==='HABLAR CON'){if(h.id==='pedro'){await conversation();return;}if(h.id==='prim'){primAlert=clock+6;await lines([['Julito',`Hola, Prim. Yo soy ${state.nickname||'Julito'}.`],['Julito','¿Tú también acabas de llegar?'],['Pedro','Lleva más tiempo que tú. Y ya conoce las normas.']]);return;}if(h.id==='colegiala'){if(!state.talkedToSenior){const introduction=state.nickname?`Me llaman ${state.nickname}. Julito para las cartas de mi madre.`:'Sí. Me llamo Julito. Acabo de llegar.';const destination=state.roomAssigned?[['Julito','Me han asignado Tercero Central.'],['Colegiala mayor','Esos nunca van a cafetería. Tienen miedo de que alguien les pida conversación.']]:[['Julito','Todavía no sé dónde me han colocado.'],['Colegiala mayor','Entonces habla con Pedro antes de que te adjudique una maceta.']];await lines([['Colegiala mayor','Hola. ¿Eres el nuevo?'],['Julito',introduction],...destination,['Colegiala mayor','Yo soy María. Esta noche estamos intentando montar una clase de salsa. Dime una cosa importante: ¿bailas salsa?'],['Julito','¿La de tomate o la que obliga a mover las caderas?'],['Colegiala mayor','La segunda. La primera parece dominarla el comedor.'],['Julito','Mi especialidad es permanecer inmóvil con mucho ritmo.'],['Colegiala mayor','Esta noche hay clase. Podrías aprender dos pasos.'],['Julito','¿Aceptan el himno del Logroñés como música latina?'],['Colegiala mayor','Solo si consigues cantarlo sin espantar al profesor.'],['Julito','Eso reduce mucho mis posibilidades.'],['Julito','Acabo de llegar y ya veo que la calidad de las chicas del CMD está a gran altura.'],['Colegiala mayor','Gracias. La de tus cumplidos todavía está en periodo de prueba.'],['Julito','Dame un curso. La carrera dura cinco años.']]);state.talkedToSenior=true;remember(state.readTopics,'colegiala');}else await lines([['Colegiala mayor','¿Te has decidido con la salsa?'],['Julito','Estoy practicando el paso más importante: encontrar una excusa.'],['Colegiala mayor','Ese ya te sale. Ahora prueba a mover un pie.'],['Julito','Con la maleta en la mano, cualquier giro acaba en parte médico.'],['Colegiala mayor','Déjala en tu habitación y baja esta noche.'],['Julito','Con la salsa voy a necesitar más de una clase. Con las excusas, en cambio, creo que puedo convalidar créditos.'],['Colegiala mayor','Eso tampoco era una competición muy exigente.']]);return;}await speak('No contesta. Primer contacto social: mejorable.');return;}
if(['correo','mundo','abc','marca'].includes(h.id)&&verb==='COGER'){if(!state.tookPapers.includes(h.id)){await pickupMotion();state.tookPapers.push(h.id);remember(state.collectedItems,h.id);if(h.id==='marca')state.hasMarca=true;player.pose=4;refreshInventory();toast('Has cogido: '+h.name);await showPaper(h.id);await newspaperComment(h.id);player.pose=null;}else await speak('Ya lo tengo. Con una edición me llega.');return;}
if(h.id==='comercia'&&verb==='COGER'){await speak('Está bien pegado a la pared. La Comercial se puede mirar, pero no llevarse puesta.');return;}
if(h.id==='elevator'&&['USAR','EMPUJAR'].includes(verb)){await elevator();return;}
if(h.id==='prim'&&verb==='USAR'){state.primTrusted=true;player.pose=8;primAlert=clock+7;await lines([['Julito','Buen chico, Prim. Un rascadito en el cuello y ya somos familia.'],['Pedro','Ya has hecho tu primer amigo.'],['Julito','Tiene buen criterio.'],['Pedro','También ha intentado hacerse amigo de tu maleta.']]);await primClue();player.pose=null;return;}
if(h.id==='phone'&&verb==='USAR'){audio.effect('bell');await lines([['Pedro','Para llamar a casa, pide línea aquí.'],['Julito','¿Y usted escucha las conversaciones telefónicas cuando pasa una llamada?'],['Pedro','Solo las que se oyen desde aquí. Que, curiosamente, suelen ser todas.'],['Julito','Entonces diré que he llegado y que no he dicho nada interesante.'],['Pedro','Perfecto. Ya vas aprendiendo.']]);return;}
if(h.id==='mailbox'&&['USAR','COGER'].includes(verb)){await speak('Dime tu habitación y te miro el correo. Desde este lado, mejor no desmontes la conserjería.','Pedro');return;}
if(h.id==='entry'&&verb==='USAR'){await speak('El Passat ya se ha ido. Primero la llave; luego conquistar Bilbao.');return;}
const defaults={COGER:'Mejor que se quede donde está. Bastante llevo ya.',USAR:'No encuentro ninguna forma útil de abrirlo, cerrarlo o ponerlo en marcha.',DAR:'Primero tengo que elegir algo del inventario.',EMPUJAR:'No quiero empezar el curso reorganizando el mobiliario.'};await speak(defaults[verb]||'No parece una buena idea.');
}finally{activeInteraction=null;updateMissionMeter();if($('choices').hidden&&scene!=='end'){busy=false;await maybeReward();}}}
async function useItem(item,h){if(item==='masterKey'){await speak(h.id==='pedro'?'Guárdala bien. Y recuerda: poder abrir una puerta no significa tener permiso para entrar.':'La llave maestra abre cerraduras. Mi habitación y sus misterios están arriba. Todavía tengo que terminar aquí.',h.id==='pedro'?'Pedro':'Julito');return;}if(item==='key'&&h.id==='elevator'){await speak('La llave es para la 310. El ascensor, afortunadamente, tiene un botón.');await elevator();return;}if(item==='marca'&&h.id==='pedro'&&verb==='DAR'){await lines([['Pedro','Déjalo en la mesa cuando termines.'],['Julito','¿También le interesa La Fábrica?'],['Pedro','Me interesa que no desaparezcan los periódicos.']]);return;}if(item==='comerciaNote'&&h.id==='pedro'&&['DAR','USAR'].includes(verb)){await lines([['Julito','Me han dado una invitación para La Comercial.'],['Pedro','Entonces ya saben que existes. No te acostumbres.'],['Julito','¿Voy de corbata?'],['Pedro','Ve con llave. Y con paciencia: son las dos cosas imprescindibles hoy.']]);return;}if(item==='bag'&&h.id==='prim'){primAlert=clock+8;await lines([['Julito','¿Qué has olido, Prim?'],['Pedro','Nada. Será el bocadillo.'],['Julito','No llevo bocadillo.'],['Pedro','Entonces será el recuerdo del bocadillo.']]);await primClue();return;}if(item==='key'&&h.id==='pedro'&&verb==='DAR'){await speak('Quédatela. Aún no te has instalado y ya quieres hacer la devolución.','Pedro');return;}if(['marca','abc','mundo','correo'].includes(item)&&['marca','abc','mundo','correo'].includes(h.id)){state.tookPapers=state.tookPapers.filter(x=>x!==item);state.hasMarca=state.tookPapers.includes('marca');audio.effect('paper');await speak('Lo dejo en la mesa. Servicio público cumplido.');return;}await speak(h.id==='prim'?'No voy a darle eso a Prim. Seguro que Pedro tiene algo más apropiado.':'No parece que esas dos cosas vayan juntas.');}
async function rewardMasterKey(){
 if(state.rewardShown||missionStats().percent<100)return;
 await lines(MASTER_KEY_DIALOGUE);
 state.hasMasterKey=true;
 state.rewardShown=true;
 refreshInventory();checkpoint();toast('Has conseguido: LLAVE MAESTRA');
}
async function maybeReward(){
 if(scene!=='lobby'||busy||path.length||!$('speech').hidden||!$('choices').hidden||!$('card').hidden||$('modal').open||$('inventory-modal').open||$('nickname-dialog')?.open)return;
 if(state.rewardShown||missionStats().percent<100)return;
 busy=true;
 try{await rewardMasterKey();}finally{busy=false;}
}
async function elevator(){if(!state.hasTobacco){await lines([['Julito','No puedo subir así. Me falta algo esencial para la supervivencia universitaria.'],['Julito','Necesito encontrar tabaco antes de enfrentarme a una tercera planta. Mi madre retiró el mío de la maleta en un acto que ella llama educación y yo llamo sabotaje.'],['Julito','Un hombre no vive solo de llave, maleta y puré naranja. Y yo, desde luego, no pienso averiguar cuánto dura sin tabaco.']]);return;}if(!state.hasKey310){await lines(TALK.locked);return;}if(!state.hasEmpiLetter){await lines([['Julito','Tengo la llave y provisiones, pero me falta algo.'],['Julito','Prim no deja de mirar hacia la entrada. Quizá debería conocer mejor a mi nuevo compañero.'],['Julito','Tiene pinta de encontrar cosas sin necesidad de formularios.']]);return;}if(!state.hasRulesBook){await lines([['Julito','Todavía me falta algo: conocer y llevar conmigo las normas de convivencia.'],['Julito','Pedro parece tener siempre un reglamento a mano, aunque no tiene cara de entregarlo por las buenas.']]);return;}state.calledElevator=true;checkpoint();if(missionStats().percent===100){await rewardMasterKey();if(!state.bonusSeen){await lines([['Pedro','Un momento. Te has fijado en todo. Eso a Empi también le pasaba.'],['Julito','¿Y cómo acabó?'],['Pedro','Dejó una habitación vacía y una maleta que yo habría jurado no volver a ver.'],['Pedro','Si llaman tres veces a la 310, pregunta quién es antes de abrir.'],['Julito','¿Y si llaman dos?'],['Pedro','Seré yo. Para que no fumes.']]);state.bonusSeen=true;checkpoint();}}audio.effect('elevator');for(let i=0;i<=20;i++){elevatorOpen=i/20;await sleep(35);}audio.effect('bell');await speak('Tercero Central. Con llave, tabaco, la carta de Empi y el reglamento: ahora sí puedo vivir… o investigar.');await walk([610,276]);audio.effect('case');primAlert=clock+8;await lines([['Julito','¿Ese golpe ha salido de dentro de la maleta?'],['Pedro','No la abras aquí.'],['Julito','¿Por qué?'],['Pedro','Porque aquí todavía puedo fingir que no sé nada.']]);player.visible=false;state.secondSceneCode=true;try{localStorage.setItem('maleta-segunda-escena','POTELE');}catch{}audio.setTheme('title');showTransition('TERCERO CENTRAL');await sleep(1600);setScene('end');$('transition-text').innerHTML='FIN DEL EPISODIO 0<small>Has conseguido una contraseña para la siguiente escena:</small>POTELE<small>Guárdala: podrás usarla desde ESCENAS.</small><small>'+ (state.bonusSeen?'100% · CONFIDENCIA DE PEDRO DESBLOQUEADA':'Exploración: '+missionStats().percent+'% · Vuelve para descubrir lo que falta.') +'</small><button id="return-lobby">SEGUIR EXPLORANDO</button><button id="again">VOLVER AL MENÚ</button>';$('return-lobby').onclick=()=>{state.calledElevator=false;elevatorOpen=0;enterLobby();};checkpoint();$('again').onclick=reset;$('sentence').textContent='Contraseña conseguida: POTELE';busy=false;}
function reset(){cancelIntroMotion();if(moveResolve){moveResolve(false);moveResolve=null;}$('transition').classList.toggle('intro-slate',false);activeInteraction=null;nicknameSelection=null;epoch++;cancelSpeech();clearTimeout(objectiveTimer);state=newState();selected=null;verb='MIRAR';elevatorOpen=0;path=[];player.visible=false;$('objective').hidden=true;hideTransition();setScene('title');$('title').hidden=false;$('choices').hidden=true;$('card').hidden=true;$('sentence').textContent='Una maleta. Una llave. Un buen comienzo.';$('hint').textContent='Una aventura para jugar sin prisa.';audio.setTheme('title');busy=false;refreshContinue();refreshInventory();refreshSceneObjects();for(const b of $('verbs').children)b.classList.toggle('active',b.textContent==='MIRAR');requestAnimationFrame(fitToViewport);}
$('canvas').onclick=async e=>{if(scene!=='lobby'||busy)return;const r=canvas.getBoundingClientRect(),to=[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];if(pointInPolygon(to)){selected=null;refreshInventory();setSentence();await walk(to);await maybeReward();}};
// Empty parts of the hotspot layer also allow walking.
$('hotspots').onclick=e=>{if(e.target===$('hotspots'))$('canvas').onclick(e);};$('hotspots').ondblclick=e=>{if(scene==='lobby')speed=310;};
$('continue-game').onclick=continueGame;
$('ask-hint').onclick=showHint;
$('start').onclick=async()=>{
 if(readSave()){
  modal('<h2>¿Empezar de nuevo?</h2><p>La nueva partida sustituirá el progreso guardado al llegar a recepción.</p><button id="new-game">EMPEZAR DE NUEVO</button>');
  $('new-game').onclick=async()=>{$('modal').close();state=newState();await audio.unlock();intro();};
 }else{state=newState();await audio.unlock();intro();}
};
$('music').onclick=async()=>{await audio.unlock();const on=audio.toggleMusic();$('music').textContent='MÚSICA '+(on?'SÍ':'NO');$('music').setAttribute('aria-pressed',String(on));};
$('sound').onclick=async()=>{await audio.unlock();audio.sound=!audio.sound;$('sound').textContent='SONIDO '+(audio.sound?'SÍ':'NO');$('sound').setAttribute('aria-pressed',String(audio.sound));};
function modal(content,kind=''){$('modal-body').innerHTML=content;$('modal').className=kind;$('modal').showModal();}
function openSceneMenu(){if(busy)return;modal('<h2>Escenas</h2><p>Elige un episodio. Las escenas nuevas pedirán la contraseña conseguida al terminar la anterior.</p><button class="scene-choice" data-scene="zero">EPISODIO 0 · LA LLEGADA <small>DISPONIBLE</small></button><button class="scene-choice" data-scene="one">EPISODIO 1 · TERCERO CENTRAL <small>CONTRASEÑA REQUERIDA</small></button>');for(const b of document.querySelectorAll('.scene-choice'))b.onclick=()=>{if(b.dataset.scene==='zero'){$('modal').close();reset();return;}$('modal-body').innerHTML='<div class="password-screen"><small>EPISODIO 1</small><h2>Tercero Central</h2><p>Introduce la contraseña conseguida al terminar la misión anterior.</p><input id="scene-code" autocomplete="off" maxlength="20" aria-label="Contraseña de la escena"><button id="unlock-scene">ACCEDER</button><p id="code-error" role="alert"></p></div>';$('scene-code').focus();const unlock=()=>{if($('scene-code').value.trim().toUpperCase()!=='POTELE'){$('code-error').textContent='Esa contraseña no abre ninguna puerta.';audio.effect('bell');return;}$('modal').close();showTransition('EPISODIO 1 · TERCERO CENTRAL<small>Acceso confirmado. Esta escena se incorporará en la próxima ampliación.</small><button id="back-scenes">VOLVER AL MENÚ</button>');$('back-scenes').onclick=()=>{hideTransition();openSceneMenu();};};$('unlock-scene').onclick=unlock;$('scene-code').onkeydown=e=>{if(e.key==='Enter')unlock();};};}
$('credits').onclick=async()=>{await audio.unlock();const dialog=$('modal');dialog.dataset.musicReturn=audio.theme;audio.setTheme('credits');modal('<div class="credits-stage"><div class="credits-stars"></div><div class="credits-roll"><small>CMD AVENTURAS PRESENTA</small><h2>EL MISTERIO DE LA<br><em>MALETA MARRÓN</em></h2><p>UNA AVENTURA DE JULITO</p><hr><p><b>IDEA, PERSONAJES Y DIRECCIÓN</b><br>MARIO</p><p><b>ADAPTACIÓN Y PROGRAMACIÓN</b><br>CODEX</p><p><b>FONDOS Y PERSONAJES</b><br>MATERIAL APORTADO POR MARIO</p><p><b>ILUSTRACIONES ADICIONALES</b><br>PRIM Y PASSAT</p><p><b>MÚSICA</b><br>TEMA DE CRÉDITOS, SECUENCIADOR DINÁMICO Y FANFARRIA ORIGINAL</p><hr><p>BILBAO · OCTUBRE DE 1994</p><p>«SOY UN HINCHA DEL EQUIPO, EL LOGROÑÉS…»</p><small>PRIM SIGUE VIGILANDO</small></div></div>','credits-modal');};
$('scenes').onclick=openSceneMenu;
$('help').onclick=()=>modal('<h2>Cómo jugar</h2><p>Elige un <b>verbo</b> y pulsa sobre una persona u objeto. Julito se acercará antes de actuar.</p><p>Cada misión presenta un objetivo general. El medidor registra carteles leídos, usos, conversaciones y objetos opcionales; terminar no exige alcanzar el 100%.</p><p>La partida se guarda automáticamente en este navegador. Usa CONTINUAR al volver. PISTAS ofrece ayuda gradual sin penalizarte.</p><p>Abre la <b>mochila</b> o pulsa <b>I</b> para ver todas tus pertenencias. Con <b>USAR</b> o <b>DAR</b>, elige allí un objeto y después su destino.</p><p>Pulsa el diálogo para mostrarlo entero y de nuevo para continuar. Doble clic hace caminar deprisa. <b>Espacio</b> muestra objetos y <b>Esc</b> salta la introducción.</p>');
$('mission-meter').onclick=showMissionDetails;
$('inventory-modal').onclose=()=>{maybeReward();};
$('modal').onclose=()=>{const previous=$('modal').dataset.musicReturn;if(previous){delete $('modal').dataset.musicReturn;audio.setTheme(previous);}maybeReward();};$('close-modal').onclick=()=>$('modal').close();$('open-inventory').onclick=openInventory;$('close-inventory').onclick=()=>$('inventory-modal').close();$('show-hotspots').onclick=()=>{if(scene==='lobby')$('hotspots').classList.toggle('reveal');};
document.addEventListener('keydown',e=>{if($('nickname-dialog')?.open)return;if($('inventory-modal').open){if(e.key==='Escape')$('inventory-modal').close();return;}if($('modal').open)return;if(e.key.toLowerCase()==='i'){e.preventDefault();openInventory();return;}if(e.code==='Space'){e.preventDefault();if(scene==='lobby')$('hotspots').classList.toggle('reveal');}if(e.key==='Escape'){if(scene==='exterior')enterLobby();else if(!$('card').hidden)$('card').querySelector('button').click();else if(!$('choices').hidden){if(nicknameSelection){nicknameSelection(state.nickname||'Julito');return;}$('choices').hidden=true;busy=false;checkpoint();maybeReward();}else{selected=null;refreshInventory();setSentence();}}if(e.key==='Enter'&&!$('speech').hidden)nextSpeech();});
async function load(){try{await Promise.all(Object.entries({exterior:'exterior.png',passat:'passat.png',reception:'reception.png',receptionV2:'reception-v2.png',walk:'julito-walk.png',walkSmooth:'julito-walk-v3.png',isoWalk:'julito-walk_isometric.png',isoIdle:'julito-idle_isometric.png',isoPickup:'julito-interact_pickup.png',isoTalk:'julito-interact_talk.png',actions:'julito-actions.png',pedro:'pedro-actions.png',pedroIdle:'pedro-idle-v2.png',prim:'prim.png',primIdle:'prim-idle-v2.png',colegiala:'colegiala-sofa-v1.png',paperMundo:'newspaper-mundo-v2.png',paperCorreo:'newspaper-correo-v2.png',paperAbc:'newspaper-abc-v2.png',paperMarca:'newspaper-marca-v2.png'}).map(([key,file])=>new Promise((resolve,reject)=>{const img=new Image;img.onload=()=>{images[key]=img;resolve();};img.onerror=()=>reject(new Error('No se pudo cargar '+file));img.src='assets/'+file;})));frames.isoWalk=isometricFrames(images.isoWalk,8,4);frames.isoIdle=isometricFrames(images.isoIdle,2,4);frames.isoPickup=isometricFrames(images.isoPickup,3,2);frames.isoTalk=isometricFrames(images.isoTalk,2,2);frames.walk=anchorJulitoFrames(spriteFrames(images.walk));frames.walkSmooth=anchorJulitoFrames(transparentGridFrames(images.walkSmooth,8,3));frames.actions=anchorJulitoFrames(spriteFrames(images.actions));frames.pedro=spriteFrames(images.pedro);frames.pedroIdle=transparentGridFrames(images.pedroIdle,8,1);frames.primIdle=transparentGridFrames(images.primIdle,8,1,{cutoff:188,harden:false});frames.collegiala=transparentSingleSprite(images.colegiala);setHotspots();refreshInventory();$('hotspots').hidden=true;$('start').disabled=false;$('start').textContent='NUEVA PARTIDA';refreshContinue();requestAnimationFrame(()=>{fitToViewport();requestAnimationFrame(draw);});}catch(err){$('start').textContent='REINTENTAR';$('start').disabled=false;$('start').onclick=()=>location.reload();$('sentence').textContent=err.message+'. Pulsa reintentar.';console.error(err);}}
fitToViewport();
load();
