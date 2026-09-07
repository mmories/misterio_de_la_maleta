import assert from 'node:assert/strict';
import {newState} from '../dist/data.js';
import {readSave,writeSave,SAVE_KEY} from '../dist/save.js';
import {nextHint} from '../dist/hints.js';
let raw=null;const storage={getItem:()=>raw,setItem:(key,value)=>{assert.equal(key,SAVE_KEY);raw=value;}};
const state=newState();state.introCompleted=true;state.hasKey310=true;state.nickname='Topo';state.readTopics=['welcome','key'];state.tookPapers=['marca'];
assert.equal(writeSave(state,storage),true);const restored=readSave(storage);assert.equal(restored.hasKey310,true);assert.equal(restored.hasMarca,true);assert.deepEqual(restored.readTopics,['welcome','key']);
for(const corrupt of ['{','null','{"version":99,"state":{}}','{"version":1,"state":{"introCompleted":true,"hasKey310":"yes"}}','{"version":1,"state":{"introCompleted":true,"tookPapers":["unknown"]}}']){raw=corrupt;assert.equal(readSave(storage),null);}
const denied={getItem(){throw new Error('blocked');},setItem(){throw new Error('quota');}};assert.equal(readSave(denied),null);assert.equal(writeSave(state,denied),false);
Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('SecurityError');}});assert.equal(readSave(),null);assert.equal(writeSave(state),false);delete globalThis.localStorage;
const hints=newState();assert.equal(nextHint(hints).level,1);assert.equal(nextHint(hints).level,2);assert.equal(nextHint(hints).level,3);assert.equal(nextHint(hints).level,3);
hints.hasKey310=true;assert.equal(nextHint(hints).id,'tobacco');assert.equal(hints.hintLevels.tobacco,1);hints.hasTobacco=true;assert.equal(nextHint(hints).id,'letter');hints.hasEmpiLetter=true;assert.equal(nextHint(hints).id,'rules');hints.hasRulesBook=true;assert.equal(nextHint(hints).id,'invitation');
hints.introCompleted=true;writeSave(hints,storage);assert.deepEqual(readSave(storage).hintLevels,hints.hintLevels);
console.log('PASS: versioned save, corrupted/blocked storage, roundtrip and progressive hints.');
