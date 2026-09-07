import assert from 'node:assert/strict';
import {openNicknameEditor} from '../dist/nickname.js';
class Element {
 constructor(){this.children=[];this.parts=new Map();this.open=false;this.value='';this.html='';}
 set innerHTML(value){this.html=value;}
 setAttribute(){}
 querySelector(key){if(!this.parts.has(key))this.parts.set(key,new Element());return this.parts.get(key);}
 append(child){this.children.push(child);}
 showModal(){this.open=true;}
 close(){this.open=false;this.onclose?.();}
 remove(){this.removed=true;}
 select(){} focus(){this.focused=true;}
}
const body=new Element();globalThis.document={body,createElement:()=>new Element()};
let pending=openNicknameEditor('A" autofocus="yes');let dialog=body.children.at(-1);
assert.equal(dialog.querySelector('#nickname-input').value,'A" autofocus="yes');
assert.ok(!dialog.html.includes('autofocus'),'User text must never be interpolated into markup');
let input=dialog.querySelector('#nickname-input');input.value='  ';dialog.querySelector('#nickname-accept').onclick();assert.equal(dialog.open,true);assert.equal(input.focused,true);
input.value='  El   Potele  ';dialog.querySelector('#nickname-accept').onclick();assert.equal(await pending,'El Potele');assert.equal(dialog.removed,true);
pending=openNicknameEditor('Topo');dialog=body.children.at(-1);let prevented=false;dialog.oncancel({preventDefault(){prevented=true;}});assert.equal(await pending,null);assert.equal(prevented,true);
pending=openNicknameEditor('Topo');dialog=body.children.at(-1);dialog.querySelector('.nickname-presets').children[2].onclick();assert.equal(await pending,'El Riojano');
delete globalThis.document;console.log('PASS: real nickname dialog apply, blank input, Escape, presets and safe text insertion.');
