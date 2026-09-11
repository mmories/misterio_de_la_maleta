import assert from 'node:assert/strict';
import {AudioEngine} from '../dist/audio.js';
import {ANTHEM_ENABLED} from '../dist/anthem.js';

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
assert.equal(audio.anthemUntil,0,'Rejected anthem must not interrupt the background score');
assert.equal(audio.toggleMusic(),false);
assert.equal(audio.toggleMusic(),true);
console.log('PASS: procedural themes and effects; rejected anthem remains silent.');

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
const count=notes.length;score.playLogrones();assert.equal(notes.length,count,'Rejected cue adds no notes');
score.ctx.currentTime=score.next;score.schedule();assert.ok(notes.length>count,'Background continues after singing dialogue');
score.setTheme('lobby');assert.equal(score.anthemUntil,0,'Scene changes release the cue lock');
score.playLogrones();score.toggleMusic();assert.equal(score.anthemUntil,0,'Muting cancels the cue lock');
const stopped=[];const musicVoice={isMusic:true,stop:()=>stopped.push('music')},fxVoice={isMusic:false,stop:()=>stopped.push('fx')};
score.voices.add(musicVoice);score.voices.add(fxVoice);score.stopVoices();assert.deepEqual(stopped,['music']);
console.log('PASS: arranged A/B themes, cue isolation, mute and scene-change cancellation; effects preserved.');

const instrumental=new AudioEngine();await instrumental.unlock();
instrumental.playLogrones();const voiceCount=instrumental.voices.size;
assert.equal(ANTHEM_ENABLED,false);
assert.equal(voiceCount,0,'Withdrawn melody is not synthesized');
assert.equal(instrumental.anthemUntil,0);
instrumental.playLogrones();assert.equal(instrumental.voices.size,voiceCount,'Repeated lines cannot overlap');
instrumental.toggleMusic();assert.equal(instrumental.voices.size,0);
assert.equal(instrumental.anthemUntil,0);
console.log('PASS: withdrawn anthem never starts voices or reserves playback time.');
