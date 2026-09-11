import assert from 'node:assert/strict';
import {MISSION} from '../dist/content.js';

const optional=new Set([...MISSION.signs,...MISSION.uses,...MISSION.dialogues,...MISSION.objects]);
for(const id of ['key','tobacco','empiLetter','rulesBook']){
  assert.equal(optional.has(id),false,`${id} must not count toward optional exploration completion`);
}
assert.ok(MISSION.objects.includes('correo'));
assert.ok(MISSION.objects.includes('marca'));
assert.ok(MISSION.dialogues.includes('colegiala'));
assert.ok(MISSION.uses.includes('prim'));
console.log('PASS: required progression is independent from optional 100% exploration.');
