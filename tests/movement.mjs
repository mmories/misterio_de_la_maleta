import assert from 'node:assert/strict';
import {advanceWalk,headingFor} from '../dist/animation.js';
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
