const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function perspectiveScale(scene,y){
 if(scene==='exterior')return clamp(.31+(y-375)/430,.31,.54);
 const depth=clamp((y-275)/276,0,1);
 return .54+.96*Math.pow(depth,1.25);
}

export function approachSpeed(current,target,dt){
 const response=target<current?11:5.4;
 return current+(target-current)*Math.min(1,response*dt);
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
