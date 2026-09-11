import {visible} from './data.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

// A road-following curve with a steady approach and a short, smooth braking phase.
export function arrivalPose(progress){
 const t=clamp(progress,0,1),brake=.66;
 const travelled=t<=brake?t:brake+(1-brake)*(1-(1-(t-brake)/(1-brake))**3)/3;
 const u=travelled/(brake+(1-brake)/3),v=1-u;
 return {x:900*v*v*v+3*650*v*v*u+3*390*v*u*u+300*u*u*u,
  y:800*v*v*v+3*790*v*v*u+3*590*v*u*u+548*u*u*u};
}

// Cinematic route authored directly against exterior.png. The family Passat has
// already driven away at this point. Julito uses the open asphalt corridor just
// beyond the foreground balustrade, stays left of the parked red car, and turns
// towards the entrance only after clearing its front corner.
export const EXTERIOR_INTRO_ROUTE=[
 [405,555],
 [430,535],
 [450,510],
 [462,486],
 [468,462],
 [478,445],
 [491,432],
 [503,423]
];

function authorExteriorIntroRoute(player,path,scene){
 if(scene!=='exterior'||path.__cmdIntroRoute||!path.length)return;
 const final=path[path.length-1];
 const isCMDApproach=final&&Math.abs(final[0]-503)<2&&Math.abs(final[1]-423)<2&&player.y>540;
 if(!isCMDApproach)return;
 path.splice(0,path.length,...EXTERIOR_INTRO_ROUTE.map(point=>[...point]));
 Object.defineProperty(path,'__cmdIntroRoute',{value:true,configurable:true});
}

export function perspectiveScale(scene,y){
 if(scene==='exterior')return clamp(.31+(y-375)/430,.31,.54);
 const stops=[[287,82,.88],[382,166,.62],[455,198,.30],[551,220,.23]];
 if(y<=287)return clamp(82+(y-287)*.88,70,82)/154;
 if(y>=551)return clamp(220+(y-551)*.23,220,236)/154;
 const i=stops.findIndex((p,j)=>j<stops.length-1&&y<stops[j+1][0]);
 const [a,ha,ma]=stops[i],[b,hb,mb]=stops[i+1],span=b-a,t=(y-a)/span;
 const height=(2*t**3-3*t*t+1)*ha+(t**3-2*t*t+t)*span*ma+(-2*t**3+3*t*t)*hb+(t**3-t*t)*span*mb;
 return height/154;
}

export function approachSpeed(current,target,dt){
 const response=target<current?11:5.4;
 return current+(target-current)*(1-Math.exp(-response*dt));
}

export function movementStyle({clock,gait,moving,direction,scale,speed}){
 const phase=((gait%(Math.PI*2))+Math.PI*2)%(Math.PI*2),stride=Math.sin(phase),lift=(1-Math.cos(phase*2))*.5,intensity=clamp(speed/145,.3,1.25);
 return {bob:moving?lift*(.85+.3*intensity)*scale:Math.sin(clock*1.9)*.38*scale,lean:moving?(direction===2?1:direction===3?-1:0)*stride*.38*intensity:0,shadowScale:moving?1-lift*.055:1,frame:Math.floor((phase/(Math.PI*2)*8)+.5)%8};
}

export function walkFrameIndex(direction,frame){
 const front=[0,1,2,1,0,5,0,1],back=[8,11,12,15,12,11,8,15];
 return direction===0?front[frame%8]:direction===1?back[frame%8]:16+frame%8;
}

export function idleFrame(clock,count,pace=1){
 const holds=[0,0,0,1,0,2,0,0,3,0,4,5,4,0,6,0,0,7];
 return holds[Math.floor(clock*pace)%holds.length]%count;
}

export function directionRow(direction){return direction===0?0:direction===1?1:2;}

export function headingFor(dx,dy,previous=2){
 if(Math.hypot(dx,dy)<.001)return previous;
 const angle=Math.atan2(dy/.65,dx),old=previous*Math.PI/4;
 const delta=Math.atan2(Math.sin(angle-old),Math.cos(angle-old));
 return Math.abs(delta)<Math.PI/8+.12?previous:(Math.round(angle/(Math.PI/4))+8)%8;
}
export function headingDirection(heading){return [2,2,0,3,3,3,1,2][heading];}
export function advanceHeading(current,target,dt){
 if(current===undefined)return target;
 const delta=Math.atan2(Math.sin(target-current),Math.cos(target-current));
 return current+Math.sign(delta)*Math.min(Math.abs(delta),dt*12);
}

export function advanceWalk(player,path,energy,gait,speed,dt,scene){
 authorExteriorIntroRoute(player,path,scene);
 let steps=0;
 for(let time=Math.min(.1,Math.max(0,dt));time>1e-8&&path.length;){
  const tick=Math.min(time,1/120);time-=tick;
  const scale=perspectiveScale(scene,player.y),dest=path[0];
  const dx=dest[0]-player.x,dy=dest[1]-player.y;
  const distance=Math.hypot(dx,dy/.65);
  if(distance<1e-6){path.shift();continue;}
  let remaining=distance;
  for(let i=1;i<path.length;i++)remaining+=Math.hypot(path[i][0]-path[i-1][0],(path[i][1]-path[i-1][1])/.65);
  const target=speed*(.58+.42*scale);
  energy=approachSpeed(energy,Math.min(target,Math.max(16,Math.sqrt(remaining*640))),tick);
  let travel=energy*tick;
  while(travel>1e-8&&path.length){
   const [x,y]=path[0],vx=x-player.x,vy=y-player.y,d=Math.hypot(vx,vy/.65);
   if(d<1e-6){path.shift();continue;}
   const amount=Math.min(d,travel),before=Math.floor(gait/Math.PI);
   player.heading=headingFor(vx,vy,player.heading??2);
   player.angle=advanceHeading(player.angle,player.heading*Math.PI/4,tick);
   player.dir=headingDirection((Math.round(player.angle/(Math.PI/4))+8)%8);
   const from=[player.x,player.y],candidate=[player.x+vx/d*amount,player.y+vy/d*amount];
   if(scene==='lobby'&&!visible(from,candidate)){
    path.length=0;return {energy:0,gait,steps,blocked:true};
   }
   [player.x,player.y]=candidate;
   gait+=amount/Math.max(34,78*scale)*Math.PI*2;
   steps+=Math.floor(gait/Math.PI)-before;travel-=amount;
   if(amount>=d){player.x=x;player.y=y;path.shift();}
  }
 }
 return {energy:path.length?energy:0,gait,steps};
}
