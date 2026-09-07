import {newState} from './data.js';
export const SAVE_KEY='maleta-partida-v1';
// Only restore known fields with their expected types; transient UI/animations are never saved.
export function readSave(storage){
 try{
  storage??=globalThis.localStorage;
  const payload=JSON.parse(storage?.getItem(SAVE_KEY)||'null');
  if(payload?.version!==1||!payload.state||payload.state.introCompleted!==true)return null;
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
    if(value!==undefined&&value!==null&&!['Topo','Julito','El Riojano'].includes(value))return null;
    fresh[key]=value??null;
   }else if(value!==undefined){if(typeof value!==typeof fresh[key])return null;fresh[key]=value;}
  }
  if(fresh.tookPapers.some(id=>!['correo','mundo','abc','marca'].includes(id)))return null;
  fresh.hasMarca=fresh.tookPapers.includes('marca');
  if(fresh.hasRulesBook)fresh.rulesOnFloor=false;
  return fresh;
 }catch{return null;}
}
export function writeSave(state,storage){
 try{storage??=globalThis.localStorage;storage.setItem(SAVE_KEY,JSON.stringify({version:1,state}));return true;}catch{return false;}
}
