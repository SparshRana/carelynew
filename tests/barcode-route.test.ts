import test from 'node:test';
import assert from 'node:assert/strict';
import {POST} from '../app/api/medicine/barcode/route';
test('barcode endpoint rejects malformed payloads and preserves unknown identifiers without inventing details',async()=>{
 const request=(body:unknown)=>new Request('https://carely.invalid/api/medicine/barcode',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 for(const body of [null,[],{gtin:'01234567890123',batch:{}},{gtin:'01234567890123',expiry:3}])assert.equal((await POST(request(body))).status,400);
 const response=await POST(request({gtin:'not-a-code'}));
 const result=await response.json();assert.equal(result.found,false);assert.equal(result.reason,'no_product_identifier');assert.equal(result.product,undefined);
});
