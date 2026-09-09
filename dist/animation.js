const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function perspectiveScale(scene,y){
 if(scene==='exterior')return clamp(.31+(y-375)/430,.31,.54);
 const depth=clamp((y-275)/276,0,1);
 return .54+.96*Math.pow(depth,1.25);
}

export function approachSpeed(current,target,dt){
 const response=target<current?11:5.4;
 return current+(target-current)*(1-Math.exp(-response*dt));
}

export function movementStyle({clock,gait,moving,direction,scale,speed}){
 const phase=((gait%(Math.PI*2))+Math.PI*2)%(Math.PI*2),stride=Math.sin(phase),lift=(1-Math.cos(phase*2))*.5,intensity=clamp(speed/145,.3,1.25);
 return {bob:moving?lift*(.85+.3*intensity)*scale:Math.sin(clock*1.9)*.38*scale,lean:moving?(direction===2?1:direction===3?-1:0)*stride*.38*intensity:0,shadowScale:moving?1-lift*.055:1,frame:Math.floor((phase/(Math.PI*2)*8)+.5)%8};
}

// Front/back sheets contain inconsistent suitcase swaps. These cycles use only
// frames where the case remains in the same hand; lateral motion uses all 8.
export function walkFrameIndex(direction,frame){
 const front=[0,1,2,1,0,5,0,1],back=[8,11,12,15,12,11,8,15];
 return direction===0?front[frame%8]:direction===1?back[frame%8]:16+frame%8;
}

export function idleFrame(clock,count,pace=1){
 const holds=[0,0,0,1,0,2,0,0,3,0,4,5,4,0,6,0,0,7];
 return holds[Math.floor(clock*pace)%holds.length]%count;
}

export function directionRow(direction){return direction===0?0:direction===1?1:2;}

// Eight logical headings, with hysteresis at sector boundaries. Existing art
// provides front/back/profile views; diagonal headings use the nearest view.
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
// Consume all waypoints reached this tick: no frame-long pauses at corners.
// Simulating small steps also keeps acceleration consistent on slow displays.
export function advanceWalk(player,path,energy,gait,speed,dt,scene){
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
   player.x+=vx/d*amount;player.y+=vy/d*amount;
   gait+=amount/Math.max(34,78*scale)*Math.PI*2;
   steps+=Math.floor(gait/Math.PI)-before;travel-=amount;
   if(amount>=d){player.x=x;player.y=y;path.shift();}
  }
 }
 return {energy:path.length?energy:0,gait,steps};
}
