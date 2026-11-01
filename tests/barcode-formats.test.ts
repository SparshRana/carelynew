import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMedicineBarcode} from '../lib/barcode';
test('UPC-E expands to its actual UPC-A identity instead of being treated as EAN-8',()=>{
 assert.equal(parseMedicineBarcode('04252614','UPC_E').gtin,'00042100005264');
 assert.equal(parseMedicineBarcode('04252615','UPC_E').gtin,null);
});
test('GS1 Digital Link preserves encoded slash in batch and serial values',()=>{
 const result=parseMedicineBarcode('https://example.invalid/01/09506000134352/10/LOT%2F123?17=271231&21=SER%2F9','QR_CODE');
 assert.equal(result.gtin,'09506000134352');assert.equal(result.batch,'LOT/123');assert.equal(result.serial,'SER/9');assert.equal(result.expiry,'2027-12-31');
});
test('retail code lengths normalize to GTIN-14 and checksum failures remain unknown',()=>{
 assert.equal(parseMedicineBarcode('4006381333931').gtin,'04006381333931');
 assert.equal(parseMedicineBarcode('4006381333932').gtin,null);
 assert.equal(parseMedicineBarcode('https://example.invalid/unknown').gtin,null);
});
