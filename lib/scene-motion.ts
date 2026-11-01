export const clampProgress=(value:number)=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
/** Shared deterministic timeline: both entry and reverse scroll use the same scene weights. */
export function sceneFrame(progress:number){const p=clampProgress(progress);const x=p*2;return {progress:p,index:Math.round(x),weights:[0,1,2].map(i=>Math.max(0,1-Math.abs(x-i))),phoneTilt:3-6*p,phoneLift:-12*Math.sin(p*Math.PI)};}
export function scrollProgress(top:number,height:number,viewportHeight:number,stickyTop:number){return clampProgress((stickyTop-top)/Math.max(1,height-viewportHeight+stickyTop));}
