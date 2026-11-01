import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {resolveTheme,themeBootScript} from '../lib/theme';
test('Carely remains light even with a previous dark choice or dark device setting',()=>{for(const stored of ['light','dark',null,'invalid'])for(const system of [true,false])assert.equal(resolveTheme(stored,system),'light');});
test('pre-paint light appearance is independent of unavailable browser storage',()=>{const root={dataset:{theme:'dark'},style:{colorScheme:'dark'}};vm.runInNewContext(themeBootScript,{document:{documentElement:root},localStorage:{getItem:()=>{throw Error('blocked');}},matchMedia:()=>({matches:true})});assert.equal(root.dataset.theme,'light');assert.equal(root.style.colorScheme,'light');});
