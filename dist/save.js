import {newState} from './data.js';
import {cleanNickname} from './nickname.js';
export const SAVE_KEY='misterio-maleta:partida-v2';
export const LEGACY_KEYS=['misterio-maleta:partida-v1','maleta-partida-v1'];

function restore(payload){
 if(![1,2].includes(payload?.version)||payload.state?.introCompleted!==true)return null;
 const fresh=newState(),saved=payload.state;
 for(const key of Object.keys(fresh)){
  const value=saved[key];
  if(Array.isArray(fresh[key])){
   if(value!==undefined&&(!Array.isArray(value)||value.some(x=>typeof x!=='string')))return null;
   if(value)fresh[key]=[...new Set(value)];
  }else if(key==='hintLevels'){
   fresh[key]={};
   if(value&&typeof value==='object'&&!Array.isArray(value))for(const [id,level] of Object.entries(value)){
    if(/^[a-zA-Z]+$/.test(id)&&Number.isInteger(level)&&level>=0&&level<=3)Object.defineProperty(fresh[key],id,{value:level,writable:true,enumerable:true,configurable:true});
   }
  }else if(key==='nickname'){
   if(value!==undefined&&value!==null&&typeof value!=='string')return null;
   fresh[key]=cleanNickname(value)||null;
  }else if(value!==undefined){if(typeof value!==typeof fresh[key])return null;fresh[key]=value;}
 }
 if(fresh.tookPapers.some(id=>!['correo','mundo','abc','marca'].includes(id)))return null;
 if(!fresh.collectedItems.includes('bag'))fresh.collectedItems.unshift('bag');
 fresh.hasMarca=fresh.tookPapers.includes('marca');
 if(fresh.hasRulesBook)fresh.rulesOnFloor=false;
 // The old module marked the surprise before showing it. Offer it once again
 // after migration, preserving a master key already awarded and all progress.
 if(payload.version===1)fresh.rewardShown=false;
 return fresh;
}
export function readSave(storage){
 try{
  storage??=globalThis.localStorage;
  const parse=key=>{try{return JSON.parse(storage?.getItem(key)||'null');}catch{return null;}};
  const current=restore(parse(SAVE_KEY));
  if(current)return current;
  const legacy=LEGACY_KEYS.map(parse).filter(Boolean).sort((a,b)=>(Number(b.savedAt)||0)-(Number(a.savedAt)||0));
  for(const payload of legacy){const state=restore(payload);if(state)return state;}
  return null;
 }catch{return null;}
}
export function writeSave(state,storage){
 try{storage??=globalThis.localStorage;storage.setItem(SAVE_KEY,JSON.stringify({version:2,savedAt:Date.now(),state}));return true;}catch{return false;}
}
