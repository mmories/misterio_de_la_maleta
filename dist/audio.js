import {ANTHEM_BPM,ANTHEM_NOTES,ANTHEM_DURATION} from './anthem.js';
// Procedural VGA score, including a sample-free instrumental anthem adaptation.
const THEMES={
 title:{bpm:94,transpose:0,wave:'triangle',progression:[45,41,48,43,45,50,41,43],melody:[69,72,76,72,71,67,64,67,69,74,77,74,72,69,67,64,76,74,72,69,71,72,74,67,72,71,69,65,68,71,69,0]},
 exterior:{bpm:82,transpose:-5,wave:'sine',progression:[45,48,41,43,45,40,41,43],melody:[69,0,76,74,72,0,71,67,65,0,69,72,71,68,69,0,72,0,77,76,74,0,72,69,67,0,71,74,72,69,67,0]},
 lobby:{bpm:76,transpose:-12,wave:'triangle',progression:[45,43,41,40,48,43,45,41],melody:[76,74,72,69,71,72,74,67,72,71,69,65,68,71,69,0,69,72,74,76,74,72,71,67,65,68,71,72,69,67,64,0]},
 credits:{bpm:88,transpose:-5,wave:'square',progression:[48,43,45,41,48,50,43,48],melody:[72,76,79,84,83,79,76,74,72,76,81,79,76,74,72,67,69,72,76,81,79,76,74,71,72,74,76,79,76,72,67,0]}
};

// Authored A/B phrases, with harmonies kept in key instead of random transposition.
const ARRANGEMENTS={
 title:{swing:.07,thirds:[3,4,4,4,3,3,4,4],answer:[76,0,79,76,77,76,72,69,79,0,76,72,74,71,67,0,81,79,77,76,77,74,69,0,77,76,72,69,74,71,67,0]},
 exterior:{swing:.025,thirds:[3,4,4,4,3,4,4,4],answer:[76,0,72,69,79,76,72,0,77,0,72,69,74,71,67,0,76,74,72,69,71,68,64,0,77,76,72,69,74,71,67,0]},
 lobby:{swing:.09,thirds:[3,4,4,4,4,4,3,4],answer:[72,0,76,72,74,71,67,0,77,76,72,69,71,68,64,0,79,76,72,0,74,71,67,0,76,72,69,0,77,72,69,0]},
 credits:{swing:.045,thirds:[4,4,3,4,4,3,4,4],answer:[79,0,84,83,79,74,71,0,81,79,76,72,77,76,72,0,84,79,76,72,81,77,74,0,79,77,74,71,76,74,72,0]}
};

export class AudioEngine{
 constructor(){this.music=true;this.sound=true;this.ctx=null;this.theme='title';this.step=0;this.next=0;this.voices=new Set();this.anthemUntil=0;this.seed=1994;}
 async unlock(){
  if(!this.ctx){
   this.ctx=new (window.AudioContext||window.webkitAudioContext)();
   this.master=this.ctx.createGain();this.master.gain.value=.72;
   this.musicBus=this.ctx.createGain();this.musicBus.gain.value=.18;
   this.fxBus=this.ctx.createGain();this.fxBus.gain.value=.32;
   this.musicBus.connect(this.master);this.fxBus.connect(this.master);this.master.connect(this.ctx.destination);
   this.timer=setInterval(()=>this.schedule(),50);
  }
  if(this.ctx.state==='suspended')await this.ctx.resume();
 }
 setTheme(theme){this.stopVoices();this.anthemUntil=0;this.theme=THEMES[theme]?theme:'title';this.step=0;this.next=this.ctx?this.ctx.currentTime+.08:0;if(this.ctx&&this.musicBus){const t=this.ctx.currentTime;this.musicBus.gain.cancelScheduledValues(t);this.musicBus.gain.setTargetAtTime(this.music ? .18 : 0,t,.12);}}
 stopVoices(){for(const voice of this.voices){if(!voice.isMusic)continue;try{voice.stop();}catch{}this.voices.delete(voice);}}
 toggleMusic(){this.music=!this.music;if(this.ctx&&this.musicBus){this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);this.musicBus.gain.setTargetAtTime(this.music ? .18 : 0,this.ctx.currentTime,.06);}if(!this.music){this.stopVoices();this.anthemUntil=0;}this.next=this.ctx?this.ctx.currentTime+.08:0;return this.music;}
 random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
 tone(midi,time,duration,{type='triangle',gain=.16,bus=this.musicBus,detune=0}={}){
  if(!this.ctx||!bus||!midi)return;const osc=this.ctx.createOscillator(),amp=this.ctx.createGain();osc.type=type;osc.frequency.value=440*2**((midi-69)/12);osc.detune.value=detune;amp.gain.setValueAtTime(.0001,time);amp.gain.exponentialRampToValueAtTime(Math.max(.001,gain),time+.018);amp.gain.exponentialRampToValueAtTime(.0001,time+duration);osc.connect(amp);amp.connect(bus);osc.start(time);osc.stop(time+duration+.03);osc.isMusic=bus===this.musicBus;this.voices.add(osc);osc.onended=()=>{this.voices.delete(osc);osc.disconnect();amp.disconnect();};
 }
 noise(time,duration,{frequency=900,gain=.05,bus=this.musicBus}={}){
  if(!this.ctx||!bus)return;const length=Math.max(1,Math.floor(this.ctx.sampleRate*duration)),buffer=this.ctx.createBuffer(1,length,this.ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(this.random()*2-1)*(1-i/length);const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),amp=this.ctx.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=frequency;amp.gain.value=gain;source.connect(filter);filter.connect(amp);amp.connect(bus);source.start(time);source.isMusic=bus===this.musicBus;this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();filter.disconnect();amp.disconnect();};
 }
 schedule(){
  if(!this.ctx||!this.music||document.hidden)return;
  const now=this.ctx.currentTime;if(now<this.anthemUntil)return;
  if(this.next<now)this.next=now+.03;
  const theme=THEMES[this.theme],arr=ARRANGEMENTS[this.theme],tick=60/theme.bpm/2;
  while(this.next<now+.18){
   const s=this.step,local=s%64,bar=Math.floor(local/8),slot=local%8,phrase=Math.floor(s/64)%4;
   const root=theme.progression[bar]+theme.transpose%12,third=arr.thirds[bar];
   const time=this.next+(slot%2?tick*arr.swing:0),quiet=this.theme==='exterior';
   if(slot%2===0){
    const melody=(phrase%2?arr.answer:theme.melody)[local/2];
    if(melody){
     const duration=tick*(slot===6?1.75:1.25);
     this.tone(melody+theme.transpose,time,duration,{type:theme.wave,gain:quiet?.12:.15});
     // Quiet octave layer gives the lead a warm, early sound-card timbre.
     if(!quiet)this.tone(melody+theme.transpose-12,time+.008,duration*.8,{type:'sine',gain:.035});
    }
   }
   if(slot===0||slot===4)this.tone(root+(slot===4?7:0),time,tick*1.6,{type:'triangle',gain:.17});
   if(slot===2||slot===6)for(const interval of [12,12+third,19])this.tone(root+interval,time,tick*.65,{type:'triangle',gain:quiet?.018:.032});
   // Broken chords answer the lead, with a thinner texture every other phrase.
   if(!quiet&&phrase!==2&&slot%2===1)this.tone(root+24+[0,third,7,third][Math.floor(slot/2)],time,tick*.52,{type:'sine',gain:.055});
   if(!quiet&&slot%2===1)this.noise(time,.025,{frequency:3800,gain:slot===7?.018:.009});
   if(slot===2||slot===6)this.noise(time,.055,{frequency:1250,gain:quiet?.008:.026});
   if(!quiet&&(slot===0||slot===4))this.tone(33,time,.085,{type:'sine',gain:.12});
   if(bar===7&&slot===7&&phrase%2)this.noise(time,.08,{frequency:2100,gain:.035});
   this.next+=tick;this.step++;
  }
 }
 playLogrones(){
  if(!this.ctx||!this.music||this.ctx.currentTime<this.anthemUntil)return;
  const t=this.ctx.currentTime+.04,beat=60/ANTHEM_BPM;
  this.stopVoices();let cursor=t;
  ANTHEM_NOTES.forEach(([note,beats])=>{
   const duration=beats*beat;
   if(note){
    this.tone(note,cursor,duration*.86,{type:'square',gain:.115,detune:-2});
    this.tone(note-12,cursor+.006,duration*.82,{type:'triangle',gain:.09});
    this.tone(note,cursor+beat*.75,duration*.6,{type:'sine',gain:.022});
   }
   cursor+=duration;
  });
  this.anthemUntil=t+ANTHEM_DURATION+.5;this.next=this.anthemUntil;this.step=0;
  for(let i=0;t+i*beat<cursor;i++){
   const time=t+i*beat,root=[49,44,46,44,49,42,44,49][Math.floor(i/4)%8];
   this.tone(root+(i%2?7:0),time,beat*.65,{type:'triangle',gain:.14});
   this.tone(32,time,.075,{type:'sine',gain:.13});
   if(i%2)this.noise(time,.065,{frequency:1800,gain:.055});
   this.noise(time+beat*.5,.024,{frequency:4500,gain:.018});
  }
 }
 effect(kind){
  if(!this.ctx||!this.sound)return;const t=this.ctx.currentTime;if(['key','item','bell'].includes(kind)){this.tone(kind==='bell'?83:76,t,.28,{type:'sine',gain:.34,bus:this.fxBus});this.tone(kind==='bell'?79:88,t+.13,.38,{type:'sine',gain:.2,bus:this.fxBus});return;}if(kind==='engine'){for(let i=0;i<18;i++)this.tone(35+i%3,t+i*.09,.13,{type:'sawtooth',gain:.035*(1-i/22),bus:this.fxBus,detune:i%2?5:-5});this.noise(t,1.7,{frequency:170,gain:.13,bus:this.fxBus});return;}if(kind==='throw'){this.noise(t,.32,{frequency:1250,gain:.11,bus:this.fxBus});this.tone(64,t,.11,{type:'triangle',gain:.16,bus:this.fxBus});this.tone(55,t+.16,.15,{type:'triangle',gain:.12,bus:this.fxBus});return;}const settings={door:[.25,450,.15],step:[.065,500,.055],paper:[.28,3500,.12],case:[.16,180,.16],elevator:[1.7,250,.14]},[duration,frequency,gain]=settings[kind]||[.2,1000,.1];this.noise(t,duration,{frequency,gain,bus:this.fxBus});
 }
}
