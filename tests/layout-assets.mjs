import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ASSET_FILES} from '../dist/assets.js';

const css=fs.readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
assert.match(css,/#scene\{aspect-ratio:8\/5/, 'The original scene composition remains the default');
assert.match(css,/@media \(min-width:901px\) and \(min-height:600px\)/, '16:9 is restricted to desktop-sized viewports');
assert.ok(!css.includes('@media (min-width:701px){\n #scene{aspect-ratio:16/9}'),'Landscape phones must not receive the desktop crop');

for(const file of Object.values(ASSET_FILES)){
 const url=new URL('../dist/assets/'+file,import.meta.url);
 assert.ok(fs.existsSync(url),'Missing required asset: '+file);
 assert.ok(fs.statSync(url).size>0,'Empty required asset: '+file);
}
assert.equal(new Set(Object.values(ASSET_FILES)).size,Object.values(ASSET_FILES).length,'Every runtime image has one manifest entry');
console.log('PASS: desktop-only 16:9 rules and complete runtime asset manifest.');
