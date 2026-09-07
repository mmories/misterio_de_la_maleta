import assert from 'node:assert/strict';
import {AudioEngine} from '../dist/audio.js';

class Param{setValueAtTime(){} exponentialRampToValueAtTime(){} cancelScheduledValues(){} setTargetAtTime(){}}
class Node{constructor(){this.gain=new Param();this.frequency={value:0};this.detune={value:0};}connect(){return this;}disconnect(){}start(){}stop(){} }
class AudioContextStub{
 constructor(){this.currentTime=1;this.sampleRate=8000;this.state='running';this.destination=new Node();}
 createGain(){return new Node();}createOscillator(){return new Node();}createBufferSource(){return new Node();}createBiquadFilter(){return new Node();}
 createBuffer(_channels,length){const data=new Float32Array(length);return {getChannelData:()=>data};}
 async resume(){}
}

globalThis.window={AudioContext:AudioContextStub};
globalThis.document={hidden:false};
globalThis.setInterval=()=>1;

const audio=new AudioEngine();
await audio.unlock();
for(const theme of ['title','exterior','lobby']){audio.setTheme(theme);audio.schedule();}
for(const effect of ['key','item','bell','engine','door','step','paper','case','elevator'])audio.effect(effect);
audio.playLogrones();
assert.ok(audio.anthemUntil>audio.ctx.currentTime,'The Logroñés fanfare must be scheduled');
assert.equal(audio.toggleMusic(),false);
assert.equal(audio.toggleMusic(),true);
console.log('PASS: procedural themes, effects and original Logroñés fanfare schedule correctly.');
