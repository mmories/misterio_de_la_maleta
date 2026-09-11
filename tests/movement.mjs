import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EXTERIOR_INTRO_ROUTE,advanceWalk,arrivalPose,headingFor,perspectiveScale} from '../dist/animation.js';
import {HOTSPOTS,findPath,pointInPolygon,visible} from '../dist/data.js';

// Sample the whole reachable floor, not only the authored hotspot destinations.
let destinations=0;
for(let y=280;y<600;y+=13)for(let x=4;x<960;x+=17){
 const to=[x,y];if(!pointInPolygon(to))continue;
 const path=findPath([229,551],to);assert.ok(path,`Unreachable floor ${to}`);
 let from=[229,551];for(const next of path){assert.ok(visible(from,next));from=next;}destinations++;
}
assert.equal(pointInPolygon([270,430]),false,'Prim occupies floor space');
assert.equal(pointInPolygon([660,450]),false,'Table legs block walking');
assert.equal(visible([190,465],[355,404]),false,'No cutting through Prim');
assert.equal(findPath([229,551],[NaN,400]),null);

function simulate(hz,fast=false){
 const player={x:229,y:551,dir:1},path=findPath([229,551],[606,287]);
 let energy=0,gait=0,steps=0,time=0;
 for(let i=0;i<hz*30&&path.length;i++){
  const before=[player.x,player.y],result=advanceWalk(player,path,energy,gait,fast?310:135,1/hz,'lobby');
  energy=result.energy;gait=result.gait;steps+=result.steps;time+=1/hz;
  assert.ok(pointInPolygon([player.x,player.y]),'Feet stay on walkable floor');
  assert.ok(Number.isFinite(player.angle));
  assert.ok(Math.hypot(player.x-before[0],player.y-before[1])<20,'No teleporting');
 }
 assert.equal(path.length,0);assert.deepEqual([player.x,player.y],[606,287]);assert.equal(energy,0);
 return {time,gait,steps};
}
const slow=simulate(30),fast=simulate(144);
assert.ok(Math.abs(slow.time-fast.time)<.12,'Arrival does not depend on refresh rate');
assert.ok(Math.abs(slow.gait-fast.gait)<.06,'Stride follows distance, not frame count');
assert.ok(simulate(60,true).time<simulate(60).time,'Double click still accelerates');
assert.equal(headingFor(0,0,5),5,'Standing preserves facing');
assert.equal(headingFor(100,-1,0),0,'Small course changes do not flicker orientation');

// A waypoint less than one tick away must not discard the rest of the tick.
const p={x:450,y:500},route=[[450.01,500],[470,500]];
advanceWalk(p,route,135,0,135,1/60,'lobby');assert.ok(p.x>450.1);
for(const h of HOTSPOTS)assert.ok(findPath([229,551],h.at),h.id);
console.log(`PASS: ${destinations} floor destinations, collision-safe segments, 30/144 Hz pacing, gait, stopping, corners and fast walking.`);

for(const [y,height] of [[287,82],[382,166],[455,198],[551,220]])assert.ok(Math.abs(perspectiveScale('lobby',y)*154-height)<1e-9);
for(let y=276;y<=599;y++){
 const change=154*(perspectiveScale('lobby',y)-perspectiveScale('lobby',y-1));
 assert.ok(change>0&&change<1.1,'Scale must grow continuously across the full lobby');
}
for(const y of [287,382,455,551]){
 const left=(perspectiveScale('lobby',y)-perspectiveScale('lobby',y-.01))/.01;
 const right=(perspectiveScale('lobby',y+.01)-perspectiveScale('lobby',y))/.01;
 assert.ok(Math.abs(left-right)<.00001,'No growth-rate jump at a calibration point');
}
console.log('PASS: perspective reference heights and smooth growth through y=599.');

// Regressions: left lip, corner and front leg were previously walkable.
for(const point of [[642,400],[639,452],[647,470],[726,511],[740,521]])assert.equal(pointInPolygon(point),false,`Table clearance at ${point}`);
for(const id of ['correo','mundo','abc','marca']){
 const target=HOTSPOTS.find(h=>h.id===id).at;
 assert.ok(target[0]<=610,'Leave room for the suitcase beside the tabletop');
 assert.ok(findPath(HOTSPOTS.find(h=>h.id==='colegiala').at,target));
}
console.log('PASS: table lip, left corner, front leg and newspaper approach clearance.');

// Even an injected straight route must stop at furniture, at both walking speeds.
for(const hz of [30,60,144])for(const speed of [135,310]){
 const player={x:600,y:455},path=[[750,455]];let energy=0,gait=0,blocked=false;
 for(let i=0;i<hz*6&&path.length;i++){
  const result=advanceWalk(player,path,energy,gait,speed,1/hz,'lobby');
  energy=result.energy;gait=result.gait;blocked||=!!result.blocked;
  assert.ok(pointInPolygon([player.x,player.y]));
 }
 assert.ok(blocked);assert.ok(player.x<618);assert.equal(energy,0);
}
console.log('PASS: per-step table collision guard at 30/60/144 Hz and both speeds.');

assert.deepEqual(arrivalPose(1),{x:300,y:548});
let previous=arrivalPose(0);
for(let i=1;i<=200;i++){
 const pose=arrivalPose(i/200);assert.ok(pose.x<=previous.x&&pose.y<=previous.y);previous=pose;
}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
assert.ok(distance(arrivalPose(.98),arrivalPose(1))<distance(arrivalPose(.9),arrivalPose(.92))*.1);
assert.ok(arrivalPose(.45).y>620,'Passat stays in the lower road lane before pulling in');
console.log('PASS: road approach, fixed stop and gentle final braking.');

// The family Passat must leave before Julito starts walking to the entrance.
const gameSource=readFileSync(new URL('../dist/game.js',import.meta.url),'utf8');
const departure=gameSource.indexOf("introStage='departure'");
const approach=gameSource.indexOf('walkRoute(EXTERIOR_INTRO_ROUTE)');
assert.ok(departure>=0&&approach>departure,'Passat departure happens before Julito approaches the CMD');

// Exterior route regression. With the family car gone, Julito uses the narrow
// corridor between the foreground balustrade and the parked red car. Sampling
// interpolated positions prevents future diagonal shortcuts through the car.
const redCar={x1:485,y1:455,x2:650,y2:555};
const inRedCar=([x,y])=>x>=redCar.x1&&x<=redCar.x2&&y>=redCar.y1&&y<=redCar.y2;
assert.deepEqual(EXTERIOR_INTRO_ROUTE.at(-1),[503,423],'Intro route ends at the CMD door');
for(const [x,y] of EXTERIOR_INTRO_ROUTE){
 assert.equal(inRedCar([x,y]),false,`Waypoint ${x},${y} must stay outside the parked red car`);
 assert.ok(!(x<370&&y>525),`Waypoint ${x},${y} must stay clear of the foreground balustrade`);
}
for(const hz of [30,60,144]){
 const player={x:375,y:566,dir:0},path=EXTERIOR_INTRO_ROUTE.map(point=>[...point]);
 let energy=0,gait=0;
 for(let i=0;i<hz*20&&path.length;i++){
  const result=advanceWalk(player,path,energy,gait,135,1/hz,'exterior');energy=result.energy;gait=result.gait;
  assert.equal(inRedCar([player.x,player.y]),false,'Julito must never cross the parked red car');
  assert.ok(!(player.x<370&&player.y>525),'Julito must never cross the foreground balustrade');
 }
 assert.equal(path.length,0,'Exterior intro route reaches the CMD entrance');
 assert.ok(Math.abs(player.x-503)<.001&&Math.abs(player.y-423)<.001,'Exterior intro finishes at the door');
}
console.log('PASS: Passat departs first; Julito avoids the red car and foreground balustrade at 30/60/144 Hz.');
