// Offline audition of the same note events scheduled by the real game engine.
// Usage: node scripts/render-anthem.mjs /tmp/logrones-16bit.wav
import fs from 'node:fs';
import {AudioEngine} from '../dist/audio.js';
const score=new AudioEngine(),events=[];score.ctx={currentTime:0};score.musicBus={};
score.tone=(note,time,duration,options)=>events.push({note,time,duration,...options});
score.noise=(time,duration,options)=>events.push({noise:true,time,duration,...options});
score.playLogrones();
const rate=22050,data=new Float64Array(Math.ceil((score.anthemUntil+.2)*rate));let seed=1994;
for(const event of events){
 const start=Math.round(event.time*rate),length=Math.ceil(event.duration*rate);
 const frequency=440*2**(((event.note||69)-69)/12)*2**((event.detune||0)/1200);
 const harmonics=Math.min(21,Math.floor(rate*.45/frequency));let filtered=0;
 for(let i=0;i<length;i++){
  const t=i/rate,phase=2*Math.PI*frequency*t;let value=0;
  if(event.noise){seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const raw=(seed/4294967296*2-1)*(1-i/length),alpha=1-Math.exp(-2*Math.PI*event.frequency/rate);
   filtered+=alpha*(raw-filtered);value=filtered;
  }else if(event.type==='sine')value=Math.sin(phase);
  else for(let h=1;h<=harmonics;h+=2)value+=Math.sin(phase*h)*(event.type==='triangle'?((-1)**((h-1)/2))*8/(Math.PI*Math.PI*h*h):4/(Math.PI*h));
  const envelope=event.noise?event.gain:t<.018?.0001*(event.gain/.0001)**(t/.018):event.gain*(.0001/event.gain)**((t-.018)/Math.max(.001,event.duration-.018));
  if(start+i<data.length)data[start+i]+=value*envelope;
 }
}
const peak=data.reduce((p,v)=>Math.max(p,Math.abs(v)),.001),pcm=Buffer.alloc(data.length*2);
for(let i=0;i<data.length;i++)pcm.writeInt16LE(Math.round(data[i]/peak*28000),i*2);
const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVEfmt ',8);
header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(rate,24);
header.writeUInt32LE(rate*2,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);
fs.writeFileSync(process.argv[2]||'/tmp/logrones-16bit.wav',Buffer.concat([header,pcm]));
console.log(`${events.length} synthesized events, ${data.length/rate}s; no recorded samples.`);
