import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
/** Decorative-only renderer. No layout, input handling or app state is owned here. */
export function createCapsuleScene(canvas:HTMLCanvasElement){
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});
 renderer.setClearColor(0xffffff,0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
 renderer.transmissionResolutionScale=.35;
 const scene=new THREE.Scene();const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,2000);camera.position.z=700;
 const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.06);scene.environment=environment.texture;room.dispose();pmrem.dispose();
 scene.add(new THREE.AmbientLight(0xe8faff,1.4));const keyLight=new THREE.DirectionalLight(0xffffff,3);keyLight.position.set(-150,250,450);scene.add(keyLight);const rim=new THREE.DirectionalLight(0xa6e9fa,2);rim.position.set(200,-100,100);scene.add(rim);
 const points=[new THREE.Vector2(.38,0),new THREE.Vector2(.38,.64)];for(let i=1;i<=10;i++){const a=i/10*Math.PI/2;points.push(new THREE.Vector2(.38*Math.cos(a),.64+.38*Math.sin(a)));}
 const half=new THREE.LatheGeometry(points,24);const seamGeometry=new THREE.TorusGeometry(.382,.008,6,32);
 const materials=[0x83d0df,0xa8d0f1,0xeaf6fc].map(color=>new THREE.MeshPhysicalMaterial({color,roughness:.14,metalness:0,transmission:.55,thickness:.7,attenuationColor:new THREE.Color(color),attenuationDistance:.8,ior:1.35,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.35,side:THREE.DoubleSide}));
 const seamMaterial=new THREE.MeshStandardMaterial({color:0xd4f1f6,roughness:.26,metalness:.15});
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=64;const ctx=shadowCanvas.getContext('2d')!;const gradient=ctx.createRadialGradient(64,32,0,64,32,32);gradient.addColorStop(0,'rgba(15,76,92,.18)');gradient.addColorStop(1,'rgba(15,76,92,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,64);const shadowTexture=new THREE.CanvasTexture(shadowCanvas);const shadowGeometry=new THREE.PlaneGeometry(1,1);const shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});
 const capsules=Array.from({length:6},(_,i)=>{const group=new THREE.Group();const top=new THREE.Mesh(half,materials[i%3]);const bottom=new THREE.Mesh(half,materials[(i+1)%3]);bottom.rotation.z=Math.PI;bottom.position.y=-.012;const seam=new THREE.Mesh(seamGeometry,seamMaterial);seam.rotation.x=Math.PI/2;group.add(top,bottom,seam);scene.add(group);const shadow=new THREE.Mesh(shadowGeometry,shadowMaterial);scene.add(shadow);return {group,shadow,side:i%2===0?-1:1,phase:i*1.47,depth:i%3,baseY:0,baseX:0,size:18};});
 let width=1,height=1,gutter=12,lastFrame=-1000,lastTime=0,elapsed=0,mouseX=0,mouseY=0,targetX=0,targetY=0,paused=false,reduced=false,visible=!document.hidden,disposed=false;
 function resize(){width=innerWidth;height=innerHeight;renderer.setSize(width,height,false);camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();
 // Scissor protects the reading column, even on narrow screens. Mobile keeps only small peripheral fragments.
 gutter=Math.max(10,Math.min(170,width>1248?(width-1200)/2-12:width<=650?14:24));
 capsules.forEach((c,i)=>{c.size=Math.min(width<=650?22:32,gutter*.48)*(1-c.depth*.12);c.baseX=c.side*(width/2-gutter*.52);c.baseY=height*(.34-Math.floor(i/2)*.32);c.group.scale.setScalar(c.size);c.shadow.scale.set(c.size*2.4,c.size*1.15,1);});render();
 }
 function render(){if(disposed)return;renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);renderer.setScissor(0,0,gutter,height);renderer.render(scene,camera);renderer.setScissor(width-gutter,0,gutter,height);renderer.render(scene,camera);renderer.setScissorTest(false);}
 function frame(time:number){if(time-lastFrame<1000/30)return;elapsed+=lastTime?Math.min((time-lastTime)/1000,.05):0;lastTime=time;lastFrame=time;mouseX+=(targetX-mouseX)*.045;mouseY+=(targetY-mouseY)*.045;
 capsules.forEach(c=>{c.group.position.set(c.baseX+mouseX*(2+c.depth),c.baseY+Math.sin(elapsed*.25+c.phase)*10+mouseY*5,-c.depth*25);c.group.rotation.set(.32+Math.sin(elapsed*.1+c.phase)*.18,.25+elapsed*.035+c.phase,.35*Math.sin(c.phase)+Math.sin(elapsed*.15+c.phase)*.12);c.shadow.position.set(c.group.position.x+5,c.group.position.y-c.size*.95,-100-c.depth*25);});render();}
 const fine=matchMedia('(hover:hover) and (pointer:fine)');const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const pointer=(e:PointerEvent)=>{if(!reduced&&fine.matches){targetX=(e.clientX/width-.5)*2;targetY=-(e.clientY/height-.5)*2;}};
 const leave=()=>{targetX=targetY=0;};
 function schedule(){lastTime=0;renderer.setAnimationLoop(!paused&&!reduced&&visible?frame:null);if(reduced)render();}
 const visibility=()=>{visible=!document.hidden;schedule();};const preference=()=>{reduced=motion.matches;schedule();};
 const themeChanged=()=>{const dark=document.documentElement.dataset.theme==='dark';renderer.toneMappingExposure=dark?1.12:.9;materials.forEach(m=>{m.envMapIntensity=dark?1.7:1.35;});render();};
 const themeObserver=new MutationObserver(themeChanged);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});themeChanged();
 const lost=(e:Event)=>{e.preventDefault();paused=true;renderer.setAnimationLoop(null);canvas.dataset.webgl='unavailable';};
 window.addEventListener('pointermove',pointer,{passive:true});document.documentElement.addEventListener('pointerleave',leave);document.addEventListener('visibilitychange',visibility);motion.addEventListener('change',preference);canvas.addEventListener('webglcontextlost',lost);const observer=new ResizeObserver(resize);observer.observe(document.documentElement);reduced=motion.matches;resize();frame(0);schedule();canvas.dataset.webgl='ready';
 return {pause(value:boolean){paused=value;schedule();},dispose(){disposed=true;renderer.setAnimationLoop(null);observer.disconnect();themeObserver.disconnect();window.removeEventListener('pointermove',pointer);document.documentElement.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',preference);canvas.removeEventListener('webglcontextlost',lost);half.dispose();seamGeometry.dispose();seamMaterial.dispose();materials.forEach(m=>m.dispose());shadowTexture.dispose();shadowGeometry.dispose();shadowMaterial.dispose();environment.dispose();renderer.dispose();renderer.forceContextLoss();}};
}
