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
for(const theme of ['title','exterior','lobby','credits']){audio.setTheme(theme);audio.schedule();}
for(const effect of ['key','item','bell','engine','door','step','paper','case','elevator'])audio.effect(effect);
audio.playLogrones();
assert.ok(audio.anthemUntil>audio.ctx.currentTime,'The Logroñés fanfare must be scheduled');
assert.equal(audio.toggleMusic(),false);
assert.equal(audio.toggleMusic(),true);
console.log('PASS: procedural themes, effects and original Logroñés fanfare schedule correctly.');

// Inspect musical events over two complete phrases, not just successful API calls.
const score=new AudioEngine();await score.unlock();let notes=[],drums=[];
score.tone=(note,time,duration,opts={})=>notes.push({note,time,duration,...opts});
score.noise=(time,duration,opts={})=>drums.push({time,duration,...opts});
for(const theme of ['title','exterior','lobby','credits']){
 score.setTheme(theme);notes=[];drums=[];
 while(score.step<128){score.ctx.currentTime=score.next;score.schedule();}
 assert.ok(notes.length>128,'Layered score must include accompaniment');
 assert.ok(drums.length>30,'Score must retain a pulse');
 assert.ok(notes.every(n=>Number.isFinite(n.time)&&n.duration>0&&n.note>=28&&n.note<=96));
 const lead=notes.filter(n=>n.gain===.15||n.gain===.12&&n.type==='sine'&&theme==='exterior');
 assert.notDeepEqual(lead.slice(0,24).map(n=>n.note),lead.slice(-24).map(n=>n.note),'A and B melodies must differ');
}
score.playLogrones();const count=notes.length;score.schedule();assert.equal(notes.length,count,'Background must pause beneath the cue');
assert.ok(notes.slice(-10).every(n=>n.bus===undefined),'Cue uses the music bus, not effects');
score.setTheme('lobby');assert.equal(score.anthemUntil,0,'Scene changes release the cue lock');
score.playLogrones();score.toggleMusic();assert.equal(score.anthemUntil,0,'Muting cancels the cue lock');
const stopped=[];const musicVoice={isMusic:true,stop:()=>stopped.push('music')},fxVoice={isMusic:false,stop:()=>stopped.push('fx')};
score.voices.add(musicVoice);score.voices.add(fxVoice);score.stopVoices();assert.deepEqual(stopped,['music']);
console.log('PASS: arranged A/B themes, cue isolation, mute and scene-change cancellation; effects preserved.');

const recording=new AudioEngine();await recording.unlock();recording.anthemBuffer={duration:22.68};
recording.playLogrones();assert.equal(recording.voices.size,1);
assert.ok(recording.anthemUntil>recording.ctx.currentTime+22);
const voice=[...recording.voices][0];assert.equal(voice.buffer,recording.anthemBuffer);
recording.playLogrones();assert.equal(recording.voices.size,1,'Repeated lines cannot overlap recordings');
recording.toggleMusic();assert.equal(recording.voices.size,0);
assert.equal(recording.anthemUntil,0);
console.log('PASS: supplied anthem recording plays once and obeys music mute.');
