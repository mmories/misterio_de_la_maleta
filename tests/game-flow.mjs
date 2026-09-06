// Integration checks execute the real game functions with a minimal DOM/audio adapter.
// Visual composition and real browser input are checked separately in Chrome.
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import * as data from '../dist/data.js';
const elements=new Map();
class Element{constructor(){this.hidden=true;this.children=[];this.style={};this.dataset={};this.classList={toggle(){}};this.textContent='';}append(...a){this.children.push(...a);}replaceChildren(...a){this.children=a;}setAttribute(){}getContext(){return new Proxy({},{get:()=>()=>{}});}querySelector(){return this.child??=new Element();}showModal(){this.open=true;}close(){this.open=false;}}
class AudioStub{setTheme(){}effect(){}async unlock(){}}
let timer=0;const timers=new Map();const context={...data,AudioEngine:AudioStub,console,performance:{now:()=>0},document:{getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);},createElement:()=>new Element(),createTextNode:t=>t,addEventListener(){}},window:{},requestAnimationFrame(){},setTimeout(fn){const id=++timer;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);},setInterval(){return ++timer;},clearInterval(){},assert};
vm.createContext(context);let src=fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/load\(\);\s*$/,'');
vm.runInContext(src+`\nthis.testGame={interact,selectVerb,inventoryClick,enterLobby,getState:()=>state,getChoices:()=>$('choices').children,begin:()=>{state=newState();busy=false;$('choices').hidden=true;$('card').hidden=true;enterLobby();},tick:t=>draw(t),next:()=>{if(speechResolve){nextSpeech();nextSpeech();}},closeCard:()=>{if(!$('card').hidden)$('card').querySelector('button').onclick();},select:(v,item)=>{selectVerb(v);selected=item;},isBusy:()=>busy};`,context);
const game=context.testGame;let t=0;
async function run(action){let finished=false,error;Promise.resolve().then(action).then(()=>finished=true,e=>{error=e;finished=true;});for(let i=0;i<1500&&!finished;i++){game.tick(t+=100);game.next();game.closeCard();const pending=[...timers.values()];timers.clear();for(const fn of pending)fn();await Promise.resolve();await Promise.resolve();}if(error)throw error;assert.ok(finished,'Action must complete');}
const h=id=>data.HOTSPOTS.find(x=>x.id===id);
for(const a of data.HOTSPOTS)for(const b of data.HOTSPOTS)assert.ok(data.findPath(a.at,b.at),a.id+' -> '+b.id);
let count=0;for(const v of data.VERBS)for(const hotspot of data.HOTSPOTS){game.begin();game.selectVerb(v);await run(()=>game.interact(hotspot));count++;}
game.begin();game.selectVerb('USAR');await run(()=>game.interact(h('elevator')));assert.equal(game.getState().calledElevator,false);assert.equal(game.getState().hasKey310,false);
game.selectVerb('HABLAR CON');await run(()=>game.interact(h('pedro')));assert.equal(game.getState().talkedToPedro,true);const keyChoice=game.getChoices().find(b=>b.textContent.includes('Vengo a por'));assert.ok(keyChoice);await run(()=>keyChoice.onclick());assert.equal(game.getState().hasKey310,true);assert.equal(game.getState().roomAssigned,true);assert.ok(!game.getChoices().some(b=>b.textContent.includes('Vengo a por')));
await run(()=>game.getChoices().find(b=>b.textContent.includes('Eso es todo')).onclick());
game.selectVerb('COGER');await run(()=>game.interact(h('marca')));await run(()=>game.interact(h('marca')));assert.deepEqual([...game.getState().tookPapers],['marca']);assert.equal(game.getState().hasMarca,true);
game.select('USAR','marca');await run(()=>game.interact(h('correo')));assert.equal(game.getState().hasMarca,false);assert.equal(game.getState().tookPapers.length,0);
game.select('USAR','bag');await run(()=>game.interact(h('prim')));assert.equal(game.getState().hasKey310,true);
game.selectVerb('USAR');await run(()=>game.interact(h('elevator')));assert.equal(game.getState().calledElevator,true);
console.log('PASS: '+count+' verb/hotspot combinations; '+data.HOTSPOTS.length**2+' navigation pairs; elevator gate; key assignment; no duplicate key; paper pickup, duplicate pickup and return; Prim combination; ending.');
