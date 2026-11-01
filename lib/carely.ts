/** User-entered pack details are never treated as verified product data. */
export type Medicine = {product:string;manufacturer:string;strength:string;form:string;release:string;batch:string;origin?:'manual';demo?:boolean;owner?:string;expiry?:string;notes?:string};
export const fields=['product','manufacturer','strength','form','release','batch'] as const;
export const norm=(v:string)=>v.trim().replace(/\s+/g,' ').toLowerCase();
export const ownerKey=(m:Medicine)=>norm(m.owner||'Me')||'me';
export const key=(m:Medicine)=>JSON.stringify([...fields.map(f=>norm(m[f])),ownerKey(m)]);
export const initial:Medicine[]=[];
export const STORAGE_KEY='carely:cabinet:v2';
export const LEGACY_STORAGE_KEY='carely:demo:v1';
export const add=(items:Medicine[],m:Medicine)=>items.some(x=>key(x)===key(m))?items:[...items,m];
export function validateMedicine(m:Medicine){
 if(!m||typeof m.product!=='string'||!m.product.trim())return 'Enter the medicine name. Other pack details can be added later.';
 if(fields.some(f=>typeof m[f]!=='string'||m[f].length>150))return 'Keep each medicine field under 150 characters.';
 if(m.expiry!==undefined&&(typeof m.expiry!=='string'||m.expiry&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(m.expiry)))return 'Choose a valid expiry month.';
 if(m.notes!==undefined&&(typeof m.notes!=='string'||m.notes.length>500))return 'Keep your note under 500 characters.';
 if(m.owner!==undefined&&(typeof m.owner!=='string'||m.owner.length>80))return 'Keep the family label under 80 characters.';
 return '';
}
export function restore(raw:string|null):{items:Medicine[]}{
 try{const parsed=JSON.parse(raw||'null');if(!parsed||!Array.isArray(parsed.items))return {items:[]};
 const items:Medicine[]=[];const seen=new Set<string>();
 for(const value of parsed.items){if(!value||value.origin!=='manual'||value.demo||validateMedicine(value))continue;const id=key(value);if(seen.has(id))continue;seen.add(id);items.push({...value,origin:'manual'});}
 return {items};
 }catch{return {items:[]};}
}
export function restoreLegacy(raw:string|null){return restore(raw);}
export function resetStorage(storage:Pick<Storage,'removeItem'>){storage.removeItem(STORAGE_KEY);storage.removeItem(LEGACY_STORAGE_KEY);storage.removeItem(STORAGE_KEY+':checks');return {items:[] as Medicine[]};}
export function updateMedicine(items:Medicine[],oldKey:string,m:Medicine){return items.filter(x=>key(x)!==oldKey).reduce(add,[m]);}
export function removeMedicine(items:Medicine[],entryKey:string){return items.filter(m=>key(m)!==entryKey);}
/** Load never overwrites an existing device record; cloud remains available for conflict review. */
export function mergeCabinets(local:Medicine[],remote:Medicine[]){
 const items=[...local];const index=new Map(local.map((m,i)=>[key(m),i]));let conflicts=0;
 for(const m of remote){const i=index.get(key(m));if(i===undefined){index.set(key(m),items.length);items.push(m);}else{
  const current=items[i];if((current.expiry&&m.expiry&&current.expiry!==m.expiry)||(current.notes&&m.notes&&current.notes!==m.notes))conflicts++;
  items[i]={...m,...current,expiry:current.expiry||m.expiry||'',notes:current.notes||m.notes||''};
 }}return {items,conflicts};
}
