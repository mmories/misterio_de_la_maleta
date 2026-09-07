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
 const stride=Math.sin(gait),contact=Math.abs(stride),intensity=clamp(speed/145,.35,1.35);
 return {bob:moving?contact*(1.25+.45*intensity)*scale:Math.sin(clock*1.9)*.5*scale,lean:moving?(direction===2?1:direction===3?-1:0)*stride*.7*intensity:0,shadowScale:moving?1-contact*.07:1,frame:((Math.floor(gait*1.72)%8)+8)%8};
}

export function idleFrame(clock,count,pace=1){
 const holds=[0,0,0,1,0,2,0,0,3,0,4,5,4,0,6,0,0,7];
 return holds[Math.floor(clock*pace)%holds.length]%count;
}

export function directionRow(direction){return direction===0?0:direction===1?1:2;}
