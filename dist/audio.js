// Procedural VGA score. All melodies are original and generated in real time.
const THEMES={
 title:{bpm:94,transpose:0,wave:'triangle',progression:[45,41,48,43,45,50,41,43],melody:[69,72,76,72,71,67,64,67,69,74,77,74,72,69,67,64,76,74,72,69,71,72,74,67,72,71,69,65,68,71,69,0]},
 exterior:{bpm:82,transpose:-5,wave:'sine',progression:[45,48,41,43,45,40,41,43],melody:[69,0,76,74,72,0,71,67,65,0,69,72,71,68,69,0,72,0,77,76,74,0,72,69,67,0,71,74,72,69,67,0]},
 lobby:{bpm:76,transpose:-12,wave:'triangle',progression:[45,43,41,40,48,43,45,41],melody:[76,74,72,69,71,72,74,67,72,71,69,65,68,71,69,0,69,72,74,76,74,72,71,67,65,68,71,72,69,67,64,0]}
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
 setTheme(theme){this.theme=THEMES[theme]?theme:'title';this.step=0;this.next=this.ctx?this.ctx.currentTime+.08:0;if(this.ctx&&this.musicBus){const t=this.ctx.currentTime;this.musicBus.gain.cancelScheduledValues(t);this.musicBus.gain.setTargetAtTime(this.music ? .18 : 0,t,.12);}}
 stopVoices(){for(const voice of this.voices){try{voice.stop();}catch{}}this.voices.clear();}
 toggleMusic(){this.music=!this.music;if(this.ctx&&this.musicBus)this.musicBus.gain.setTargetAtTime(this.music ? .18 : 0,this.ctx.currentTime,.06);if(!this.music)this.stopVoices();this.next=this.ctx?this.ctx.currentTime+.08:0;return this.music;}
 random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
 tone(midi,time,duration,{type='triangle',gain=.16,bus=this.musicBus,detune=0}={}){
  if(!this.ctx||!bus||!midi)return;const osc=this.ctx.createOscillator(),amp=this.ctx.createGain();osc.type=type;osc.frequency.value=440*2**((midi-69)/12);osc.detune.value=detune;amp.gain.setValueAtTime(.0001,time);amp.gain.exponentialRampToValueAtTime(Math.max(.001,gain),time+.018);amp.gain.exponentialRampToValueAtTime(.0001,time+duration);osc.connect(amp);amp.connect(bus);osc.start(time);osc.stop(time+duration+.03);this.voices.add(osc);osc.onended=()=>{this.voices.delete(osc);osc.disconnect();amp.disconnect();};
 }
 noise(time,duration,{frequency=900,gain=.05,bus=this.musicBus}={}){
  if(!this.ctx||!bus)return;const length=Math.max(1,Math.floor(this.ctx.sampleRate*duration)),buffer=this.ctx.createBuffer(1,length,this.ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(this.random()*2-1)*(1-i/length);const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),amp=this.ctx.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=frequency;amp.gain.value=gain;source.connect(filter);filter.connect(amp);amp.connect(bus);source.start(time);source.onended=()=>{source.disconnect();filter.disconnect();amp.disconnect();};
 }
 schedule(){
  if(!this.ctx||!this.music||document.hidden)return;const now=this.ctx.currentTime;if(this.next<now)this.next=now+.03;const theme=THEMES[this.theme],tick=60/theme.bpm/2;
  while(this.next<now+.18){const s=this.step,local=s%64,bar=Math.floor(local/8),phrase=Math.floor(s/64),root=theme.progression[bar],variation=phrase%4;if(local%2===0){let melody=theme.melody[(local/2)%theme.melody.length];if(melody){if(variation===1&&local%8===6)melody+=2;if(variation===2&&local>=32)melody-=12;if(variation===3&&local%16===14)melody+=5;this.tone(melody+theme.transpose,this.next,tick*(local%8===6?1.8:1.55),{type:theme.wave,gain:.15});}}if(local%8===0){this.tone(root,this.next,tick*6.4,{type:'triangle',gain:.17});this.tone(root+7,this.next+.012,tick*4.8,{type:'sine',gain:.07});}if(local%4===2)this.tone(root+12+[0,7,12,7][bar%4],this.next,tick*.72,{type:'sine',gain:.065});if(local%8===4)this.noise(this.next,.045,{frequency:780,gain:.024});if(local%16===15&&variation===3)this.noise(this.next,.08,{frequency:1700,gain:.018});this.next+=tick;this.step++;}
 }
 playLogrones(){
  if(!this.ctx||!this.music||this.ctx.currentTime<this.anthemUntil)return;const t=this.ctx.currentTime+.04,beat=.18,melody=[67,67,72,72,74,72,69,67,69,69,74,76,74,72,67,0,72,72,76,76,77,76,74,72,74,69,71,72,67];this.anthemUntil=t+melody.length*beat;this.musicBus.gain.setTargetAtTime(.075,t,.03);melody.forEach((note,i)=>{if(!note)return;this.tone(note,t+i*beat,beat*.86,{type:'square',gain:.11,bus:this.fxBus,detune:-4});this.tone(note-12,t+i*beat,beat*.82,{type:'triangle',gain:.085,bus:this.fxBus});if(i%4===0)this.noise(t+i*beat,.055,{frequency:520,gain:.045,bus:this.fxBus});});this.musicBus.gain.setTargetAtTime(.18,this.anthemUntil,.3);
 }
 effect(kind){
  if(!this.ctx||!this.sound)return;const t=this.ctx.currentTime;if(['key','item','bell'].includes(kind)){this.tone(kind==='bell'?83:76,t,.28,{type:'sine',gain:.34,bus:this.fxBus});this.tone(kind==='bell'?79:88,t+.13,.38,{type:'sine',gain:.2,bus:this.fxBus});return;}if(kind==='engine'){for(let i=0;i<18;i++)this.tone(35+i%3,t+i*.09,.13,{type:'sawtooth',gain:.035*(1-i/22),bus:this.fxBus,detune:i%2?5:-5});this.noise(t,1.7,{frequency:170,gain:.13,bus:this.fxBus});return;}if(kind==='throw'){this.noise(t,.32,{frequency:1250,gain:.11,bus:this.fxBus});this.tone(64,t,.11,{type:'triangle',gain:.16,bus:this.fxBus});this.tone(55,t+.16,.15,{type:'triangle',gain:.12,bus:this.fxBus});return;}const settings={door:[.25,450,.15],step:[.065,500,.055],paper:[.28,3500,.12],case:[.16,180,.16],elevator:[1.7,250,.14]},[duration,frequency,gain]=settings[kind]||[.2,1000,.1];this.noise(t,duration,{frequency,gain,bus:this.fxBus});
 }
}
