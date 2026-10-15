/* ArcMap Office Rampage v0.1. Three.js FPS, no server-side gameplay. */
import * as THREE from './vendor/three.module.js';
const $=s=>document.getElementById(s), clamp=THREE.MathUtils.clamp,rand=(a,b)=>a+Math.random()*(b-a), V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const TOTAL=12,MINX=-19.4,MAXX=19.4,MINZ=-17.4,MAXZ=17.4;
const WPN={
 rifle:{name:'ASSAULT RIFLE',clip:30,store:180,damage:25,rate:.112,reload:1.6,spread:.012,pellets:1,recoil:.17,auto:true},
 shotgun:{name:'PUMP SHOTGUN',clip:8,store:48,damage:16,rate:.84,reload:2.05,spread:.081,pellets:9,recoil:.40,auto:false},
 smg:{name:'COMPACT SMG',clip:40,store:260,damage:17,rate:.073,reload:1.38,spread:.028,pellets:1,recoil:.11,auto:true},
 revolver:{name:'HEAVY REVOLVER',clip:6,store:48,damage:63,rate:.53,reload:1.72,spread:.008,pellets:1,recoil:.36,auto:false}
};
const game={phase:'menu',weapon:'rifle',ammo:30,reserve:180,health:100,kills:0,elapsed:0,lastShot:-10,reloading:0,trigger:false,yaw:0,pitch:0,velocityY:0,grounded:true,recoil:0,bob:0,combo:0,hitAt:0,hitTime:0,damageTime:0,toastTime:0,subtitleTime:0,nearDoor:null,exitReady:false};
const el={menu:$('menu'),pause:$('pause'),summary:$('summary'),hud:$('hud'),toast:$('toast'),health:$('health'),healthbar:$('healthbar'),ammo:$('ammo'),reserve:$('reserve'),weapon:$('weapon-name'),detail:$('objective-detail'),killbar:$('killbar'),clock:$('clock'),sub:$('subtitles'),hit:$('hitmarker'),vignette:$('damage-vignette'),map:$('minimap'),interaction:$('interaction'),reload:$('reload-hint')};
const canvas=$('world');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(1.6,devicePixelRatio||1));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x14212c);scene.fog=new THREE.FogExp2(0x152431,.016);
const camera=new THREE.PerspectiveCamera(78,innerWidth/innerHeight,.06,110);
camera.rotation.order='YXZ';scene.add(camera);
const ambient=new THREE.HemisphereLight(0xa5d8ff,0x394135,1.95);scene.add(ambient);
const sunlight=new THREE.DirectionalLight(0xcfe3fa,1.65);sunlight.position.set(-11,13,-15);
sunlight.castShadow=true;sunlight.shadow.mapSize.set(1024,1024);
sunlight.shadow.camera.left=-26;sunlight.shadow.camera.right=26;sunlight.shadow.camera.top=25;sunlight.shadow.camera.bottom=-25;scene.add(sunlight);
const material=(color,roughness=.74,metalness=.08)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const plaster=material(0x647780,.92),wood=material(0x826e5b,.76),steel=material(0x8b979c,.42,.5),trim=material(0x223540,.43),chairMat=material(0x2b3c47,.91),screenMat=new THREE.MeshStandardMaterial({color:0x15323b,emissive:0x2896aa,emissiveIntensity:.30,roughness:.35});
const glass=new THREE.MeshPhysicalMaterial({color:0xc7e5f2,transparent:true,opacity:.28,metalness:.08,roughness:.19,side:THREE.DoubleSide,depthWrite:false});
const colliders=[],solidMeshes=[],hostiles=[],targets=[],props=[],particles=[],doors=[],keys=new Set();
let carried=null;
const raycaster=new THREE.Raycaster();
function box(parent,w,h,d,m,x,y,z,casts=false){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
 mesh.position.set(x,y,z);mesh.castShadow=casts;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function solid(x,z,w,d){colliders.push({x,z,w,d});}
function wall(x,z,w,d,h=3.4,m=plaster,physical=true){
 const mesh=box(scene,w,h,d,m,x,h/2,z,true);solidMeshes.push(mesh);
 if(physical)solid(x,z,w,d);return mesh;
}
function label(text,w=3,h=.37){
 const c=document.createElement('canvas');c.width=768;c.height=112;const g=c.getContext('2d');
 g.fillStyle='#152f3e';g.fillRect(0,0,c.width,c.height);g.fillStyle='#e1f9ee';
 g.font='bold 47px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(text,384,58);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}));
}
function office(){
 box(scene,40,.36,36,material(0x212e37,.96),0,-.17,0);
 box(scene,39.3,.025,35.5,material(0x42525a,.98),0,.004,0);
 const seam=material(0x283b43,.99);
 for(let x=-19;x<=19;x+=2)box(scene,.014,.006,35.5,seam,x,.020,0);
 for(let z=-17;z<=17;z+=2)box(scene,39.3,.006,.014,seam,0,.020,z);
 wall(0,-17.7,40,.36);wall(0,17.7,40,.36);wall(-19.7,0,.36,35.7);wall(19.7,0,.36,35.7);
 wall(-14,-2.1,11,.22);wall(-3.0,-2.1,3.3,.22);wall(3,-2.1,3.3,.22);wall(14,-2.1,11,.22);
 wall(-8.15,-4.9,.18,5.1);wall(-8.15,-14,.18,6.1);wall(8.1,-13,.18,7.1);
 wall(-13.5,-6,10.1,.14,2.9,glass,false);
 // ceiling grid and fluorescent strips
 box(scene,40,.19,.34,trim,0,3.48,-17.55);box(scene,40,.19,.34,trim,0,3.48,17.55);
 for(let x=-19;x<=19;x+=2)box(scene,.022,.018,35.4,material(0x445966),x,3.32,0);
 for(let z=-17;z<=17;z+=2)box(scene,39,.018,.022,material(0x445966),0,3.32,z);
 for(let x=-15;x<=18;x+=8)for(let z=-14;z<=14;z+=8){
  box(scene,2.35,.035,.57,new THREE.MeshBasicMaterial({color:0xe1f4fc}),x,3.27,z);
  const light=new THREE.PointLight(0xe2f0fe,11,11,2);light.position.set(x,3.1,z);scene.add(light);
 }
 for(let x of [-14,-7,8,15]){
  const frame=box(scene,4.2,2.2,.12,trim,x,1.86,-17.32);
  box(scene,4.05,2.07,.015,new THREE.MeshBasicMaterial({color:0x325a74}),x,1.86,-17.24);
  box(scene,.065,2.1,.075,steel,x,1.86,-17.16);
 }
 const head=label('GEOSPATIAL OPERATIONS • FLOOR 01',6,.45);head.position.set(0,2.78,17.48);head.rotation.y=Math.PI;scene.add(head);
 const doorPivot=new THREE.Group();doorPivot.position.set(-.98,0,-2.1);scene.add(doorPivot);
 box(doorPivot,1.91,2.78,.09,material(0x47606d),.95,1.40,0,true);
 box(doorPivot,.10,.07,.20,steel,1.77,1.23,.10);
 doors.push({pivot:doorPivot,x:0,z:-2.1,angle:0,target:0,open:false});
 const meeting=label('CONFERENCE / TRAINING',3.8,.34);meeting.position.set(-13.2,2.7,-1.80);meeting.rotation.y=Math.PI;scene.add(meeting);
 // elevator destination
 box(scene,3.2,3,.12,steel,0,1.5,-17.34,true);box(scene,.055,2.9,.18,trim,0,1.49,-17.20);
 const exit=label('SECURITY ELEVATOR / EXIT',3,.35);exit.position.set(0,3.19,-17.08);scene.add(exit);
 const glow=new THREE.PointLight(0xf7b46d,4,8,2);glow.position.set(0,2.5,-15.1);scene.add(glow);
 function chair(x,z,rot=0){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);
  box(g,.62,.12,.63,chairMat,0,.54,0,true);box(g,.64,.70,.12,chairMat,0,1.01,-.28,true);
  box(g,.11,.51,.11,steel,0,.28,0);
  for(let j=0;j<5;j++){const a=j*6.28/5;box(g,.10,.08,.47,steel,Math.sin(a)*.15,.12,Math.cos(a)*.10)}
 }
 function desk(x,z,rot=0){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);
  box(g,2,.11,1.06,wood,0,.76,0,true);
  for(const xx of [-.9,.9])for(const zz of [-.41,.41])box(g,.075,.7,.075,steel,xx,.38,zz);
  box(g,.82,.59,.09,trim,-.3,1.40,-.21,true);
  box(g,.69,.47,.01,screenMat,-.3,1.40,-.156);
  const bright=new THREE.MeshBasicMaterial({color:0x5ab9c7});
  for(let j=0;j<4;j++)box(g,.10,.07,.02,bright,-.55+j*.13,1.40,-.148);
  box(g,.07,.21,.07,trim,-.3,1.01,-.21);
  box(g,.47,.025,.22,trim,.48,.83,.22);
  box(g,.12,.14,.12,material(0xd2c6ac),.7,.90,-.27);
  solid(x,z,2.0,1.1);chair(x+Math.sin(rot)*1.1,z+Math.cos(rot)*1.1,rot);
 }
 for(const [i,p] of [[0,[-15,12]],[1,[-10,12]],[2,[-5,12]],[3,[0,11.2]],[4,[5.5,12]],[5,[12,12]],[6,[16,8]],[7,[-15,6]],[8,[-10,6]],[9,[-4,6]],[10,[3.4,6]],[11,[11,6]],[12,[-15,-8]],[13,[-15,-13]],[14,[-3,-8]],[15,[3,-9]],[16,[12,-8]],[17,[15,-12]]]){
  desk(p[0],p[1],i%2?Math.PI:0);
 }
 for(const z of [9,3])for(const x of [-17.4,-11.9,-6.1,.7,7.7,15.7]){
  box(scene,2.1,1.42,.105,material(x<0?0x5a727b:0x58686d,.96),x,.85,z,true);
  box(scene,2.13,.035,.12,steel,x,1.58,z);solid(x,z,2.1,.105);
 }
 function plant(x,z){
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  const pot=new THREE.Mesh(new THREE.CylinderGeometry(.26,.19,.5,9),material(0x967861,.94));pot.position.y=.25;g.add(pot);
  for(let i=0;i<10;i++){const a=i*2.4,leaf=new THREE.Mesh(new THREE.ConeGeometry(.15,.56+Math.random()*.37,5),material(i%2?0x486c4c:0x356046));leaf.position.set(Math.sin(a)*.13,.7+Math.sin(i*3)*.17,Math.cos(a)*.13);leaf.rotation.z=Math.sin(a)*.55;g.add(leaf)}
 }
 for(const p of [[-18,3],[-18,-13],[18,3],[18,-13]])plant(...p);
 for(const p of [[-17,-1],[17,-1],[-16,-11],[17,-11]]){
  const [x,z]=p;box(scene,1.04,1.54,.64,steel,x,.78,z,true);
  for(let j=0;j<3;j++){box(scene,.91,.39,.02,material(0x73838c),x,.31+j*.46,z+.33);box(scene,.18,.02,.03,trim,x,.31+j*.46,z+.35)}
  solid(x,z,1.04,.65);
 }
 box(scene,5.1,.13,1.9,wood,-13,.84,-11.2,true);solid(-13,-11.2,5.1,1.9);
 for(const x of [-15,-13,-11]){chair(x,-9.85,Math.PI);chair(x,-12.65)}
 for(let i=0;i<4;i++){const x=11.4+i*1.6,z=-13.8;
  box(scene,1.02,2.8,.89,trim,x,1.4,z,true);
  for(let j=0;j<7;j++){
   box(scene,.85,.08,.014,steel,x,.27+j*.32,z+.45);
   box(scene,.055,.04,.016,new THREE.MeshBasicMaterial({color:j%2?0x41bfa4:0xf0af6c}),x+.27,.27+j*.32,z+.47);
  }solid(x,z,1.04,.90);
 }
 box(scene,1.4,.9,.60,steel,17,.45,16,true);
 box(scene,.46,.64,.46,new THREE.MeshStandardMaterial({color:0x7eb4d2,transparent:true,opacity:.65}),17,1.18,16,true);
 const poster=label('COFFEE IS NOT A WORKFLOW',3.3,.35);poster.position.set(14.5,2.6,17.48);poster.rotation.y=Math.PI;scene.add(poster);
}
function blocked(x,z,r=.34){
 if(x<MINX+r||x>MAXX-r||z<MINZ+r||z>MAXZ-r)return true;
 for(const b of colliders){
  const xx=Math.max(b.x-b.w/2,Math.min(x,b.x+b.w/2)),zz=Math.max(b.z-b.d/2,Math.min(z,b.z+b.d/2));
  if((x-xx)**2+(z-zz)**2<r*r)return true;
 }
 for(const d of doors)if(d.angle<1.0&&Math.abs(x-d.x)<1+r&&Math.abs(z-d.z)<.18+r)return true;
 return false;
}
function move(x,z,dx,dz,r=.35){
 if(!blocked(x+dx,z,r))x+=dx;
 if(!blocked(x,z+dz,r))z+=dz;
 return {x,z};
}
function direction(){const d=V();camera.getWorldDirection(d);return d.normalize()}
const logo=(()=>{
 const c=document.createElement('canvas');c.width=512;c.height=300;const g=c.getContext('2d');
 const grad=g.createLinearGradient(0,0,512,300);grad.addColorStop(0,'#edf3f2');grad.addColorStop(1,'#a8bdcc');g.fillStyle=grad;g.fillRect(0,0,512,300);
 g.fillStyle='#3186b3';g.fillRect(0,179,512,121);g.fillStyle='#87b740';g.beginPath();g.moveTo(0,185);g.bezierCurveTo(140,157,250,210,390,123);g.lineTo(512,98);g.lineTo(512,300);g.lineTo(0,300);g.fill();
 g.fillStyle='#304554';g.font='bold 88px Arial';g.fillText('ArcGIS',22,115);
 g.fillStyle='#fff';g.font='bold 53px Arial';g.fillText('ArcMap',278,267);g.strokeStyle='#d1dce2';g.lineWidth=7;g.strokeRect(4,4,504,292);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
})();
const expressions={};
function expression(state){
 if(expressions[state])return expressions[state];
 const c=document.createElement('canvas');c.width=256;c.height=156;const g=c.getContext('2d');g.lineCap='round';g.lineWidth=10;g.strokeStyle='#1a2831';
 for(const x of [60,193]){
  const sign=x<100?1:-1;g.beginPath();g.moveTo(x-30,16+(state==='angry'?sign*9:-sign*4));g.lineTo(x+29,22-(state==='angry'?sign*9:-sign*4));g.stroke();
  g.fillStyle='#ffefdf';g.beginPath();g.ellipse(x,71,27,31,0,0,Math.PI*2);g.fill();
  g.fillStyle='#1e303d';g.beginPath();g.arc(x+4,74,10,0,Math.PI*2);g.fill();
 }
 g.fillStyle='#481b27';g.strokeStyle='#26151b';g.lineWidth=6;
 if(state==='angry'){g.beginPath();g.moveTo(90,123);g.quadraticCurveTo(129,103,170,122);g.stroke()}
 else if(state==='dead'){g.beginPath();g.moveTo(97,121);g.lineTo(165,121);g.stroke()}
 else{g.beginPath();g.ellipse(129,126,28,state==='hurt'?22:31,0,0,Math.PI*2);g.fill();g.stroke()}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;expressions[state]=t;return t;
}
function makeGremlin(x,z,i,kind){
 const scale=kind==='brute'?1.35:kind==='crawler'?.72:1;
 const root=new THREE.Group();root.position.set(x,0,z);root.scale.setScalar(scale);scene.add(root);
 const torso=new THREE.Group();torso.position.y=1.02;root.add(torso);
 box(torso,.99,.64,.27,material(0xa4aeb1),0,0,0,true);
 const badge=new THREE.Mesh(new THREE.PlaneGeometry(.97,.61),new THREE.MeshBasicMaterial({map:logo}));badge.position.z=.143;torso.add(badge);
 const face=new THREE.Mesh(new THREE.PlaneGeometry(.43,.25),new THREE.MeshBasicMaterial({map:expression('angry'),transparent:true,depthWrite:false}));face.position.set(-.16,.06,.15);torso.add(face);
 const limbs=[];
 for(const s of [-1,1]){
  const arm=new THREE.Group();arm.position.set(s*.55,.13,0);torso.add(arm);
  box(arm,.20,.54,.22,material(0x27414f),s*.07,-.24,0,true);
  box(arm,.24,.17,.25,material(0x709958),s*.07,-.54,0,true);
  const leg=new THREE.Group();leg.position.set(s*.27,.76,0);root.add(leg);
  box(leg,.23,.56,.24,material(0x27414f),0,-.26,0,true);
  box(leg,.26,.13,.38,material(0x1b2d38),0,-.58,.10,true);
  limbs.push({pivot:arm,s,type:'arm'},{pivot:leg,s,type:'leg'});
 }
 const hp=kind==='brute'?230:kind==='crawler'?54:85;
 const e={root,torso,face,limbs,kind,hp,alive:true,scale,radius:kind==='brute'?.68:kind==='crawler'?.39:.50,speed:kind==='brute'?1.6:kind==='crawler'?4.1:2.5,attack:0,stun:0,hit:0,velocity:V(),anim:rand(0,7),dying:0};
 function hitMesh(parent,w,h,d,x,y,z,part){
  const m=box(parent,w,h,d,new THREE.MeshBasicMaterial({visible:false}),x,y,z);
  m.userData.enemy=e;m.userData.part=part;targets.push(m);return m;
 }
 hitMesh(torso,.95,.62,.30,0,0,0,'torso');
 hitMesh(torso,.39,.25,.15,-.16,.06,.22,'head');
 for(const l of limbs)hitMesh(l.pivot,.22,.51,.25,0,-.27,0,l.type);
 hostiles.push(e);return e;
}
function spawnEnemies(){
 const spawn=[[-13,8],[-6.4,8],[1.3,8],[11.4,8],[-16,1],[6.6,.8],[-2,-5],[5,-5],[-17,-10],[5,-11],[9.5,-7],[-3,-14]];
 spawn.forEach(([x,z],i)=>makeGremlin(x,z,i,i===9?'brute':i===4||i===10?'crawler':'runner'));
}
function clearActors(){for(const e of hostiles)scene.remove(e.root);hostiles.length=0;targets.length=0;
 for(const p of props)scene.remove(p.mesh);props.length=0;carried=null;
 for(const p of particles)scene.remove(p.mesh);particles.length=0;
}
function spawnProps(){
 const items=[[-5.5,14,'crate'],[6.7,10.8,'monitor'],[0.6,4,'printer'],[-17,-4,'crate'],[10,-9,'monitor'],[-3,-12.5,'printer']];
 for(const [x,z,type] of items){
  const g=new THREE.Group();g.position.set(x,type==='monitor'?.6:.27,z);
  if(type==='crate')box(g,.56,.48,.62,wood,0,0,0,true);
  if(type==='monitor'){box(g,.72,.51,.15,trim,0,0,0,true);box(g,.60,.39,.01,screenMat,0,0,.083);box(g,.10,.22,.10,steel,0,-.30,0)}
  if(type==='printer'){box(g,.73,.40,.55,steel,0,0,0,true);box(g,.40,.12,.13,trim,0,.24,.17)}
  scene.add(g);props.push({mesh:g,type,vel:V(),spin:V(),ground:g.position.y,held:false});
 }
}
const gun=new THREE.Group();camera.add(gun);let flash=null;
function buildWeapon(){
 gun.clear();gun.position.set(.31,-.35,-.58);
 const w=game.weapon,main=material(w==='shotgun'?0x765e48:w==='revolver'?0x8b9196:0x536e73,.38,.65),black=material(0x18262f,.39,.47);
 const len=w==='shotgun'?1.02:w==='revolver'?.52:w==='smg'?.62:.85;
 box(gun,.21,.21,len*.80,main,0,-.08,-len*.30,true);
 box(gun,.13,.13,len,black,0,-.07,-len*.67,true);
 box(gun,.08,.08,.49,steel,0,-.05,-len*1.28,true);
 box(gun,.14,.33,.20,black,0,-.34,-.18);
 box(gun,.12,.09,.34,black,0,.06,-.25);
 if(w==='revolver'){const c=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.22,8),steel);c.rotation.z=Math.PI/2;c.position.set(0,-.12,-.37);gun.add(c)}
 if(w==='rifle'||w==='smg')box(gun,.13,.28,.15,black,0,-.30,-.42);
 if(w==='shotgun')box(gun,.2,.15,.40,wood,0,-.11,-.24);
 box(gun,.17,.22,.27,material(0xa58c75,.87),.13,-.36,-.09);
 flash=new THREE.Mesh(new THREE.SphereGeometry(.10,6,4),new THREE.MeshBasicMaterial({color:0xffd3a0}));flash.position.set(0,-.05,-len*1.52);flash.visible=false;gun.add(flash);
}
class Sound{
 constructor(){this.ctx=null}
 unlock(){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!this.ctx)this.ctx=new A();if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{})}
 tone(f,d=.13,shape='sawtooth',vol=.07,end=null){
  if(!this.ctx)return;const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();
  o.type=shape;o.frequency.setValueAtTime(Math.max(f,35),t);if(end)o.frequency.exponentialRampToValueAtTime(Math.max(30,end),t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g).connect(c.destination);o.start(t);o.stop(t+d+.02)
 }
 noise(d=.14,vol=.12){
  if(!this.ctx)return;const c=this.ctx,n=Math.ceil(c.sampleRate*d),b=c.createBuffer(1,n,c.sampleRate),arr=b.getChannelData(0);
  for(let i=0;i<n;i++)arr[i]=(Math.random()*2-1)*(1-i/n);
  const s=c.createBufferSource(),g=c.createGain();g.gain.value=vol;s.buffer=b;s.connect(g).connect(c.destination);s.start();
 }
 shot(){const heavy=game.weapon==='shotgun'||game.weapon==='revolver';this.noise(heavy?.26:.14,heavy?.23:.14);this.tone(heavy?80:145,heavy?.25:.13,'sawtooth',heavy?.11:.07,40)}
 enemy(){this.tone(rand(270,530),.26,'sawtooth',.045,140)}
 hurt(){this.tone(105,.18,'sawtooth',.12,59)}
 click(){this.tone(660,.065,'triangle',.045,390)}
}
const sound=new Sound();
const NAV={step:.88,cols:Math.floor((MAXX-MINX)/.88),rows:Math.floor((MAXZ-MINZ)/.88),dist:[],at:-20,cell:-1};
function navIndex(x,z){
 const cx=clamp(Math.floor((x-MINX)/NAV.step),0,NAV.cols-1),cz=clamp(Math.floor((z-MINZ)/NAV.step),0,NAV.rows-1);
 return cz*NAV.cols+cx;
}
function makeFlow(){
 const cell=navIndex(camera.position.x,camera.position.z);
 if(cell===NAV.cell&&game.elapsed-NAV.at<.8)return;
 NAV.cell=cell;NAV.at=game.elapsed;
 const n=NAV.cols*NAV.rows,q=new Int32Array(n),d=new Int16Array(n);d.fill(30000);let head=0,tail=0;d[cell]=0;q[tail++]=cell;
 while(head<tail){const u=q[head++],x=u%NAV.cols,z=(u/NAV.cols)|0;
  for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const xx=x+a,zz=z+b;if(xx<0||xx>=NAV.cols||zz<0||zz>=NAV.rows)continue;
   const v=zz*NAV.cols+xx;if(d[v]!==30000)continue;
   if(blocked(MINX+(xx+.5)*NAV.step,MINZ+(zz+.5)*NAV.step,.29))continue;
   d[v]=d[u]+1;q[tail++]=v;
  }
 }
 NAV.dist=d;
}
function pathDirection(x,z){
 if(!NAV.dist?.length)return null;
 const id=navIndex(x,z),cx=id%NAV.cols,cz=(id/NAV.cols)|0;let best=NAV.dist[id],x2=null,z2=null;
 for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const xx=cx+a,zz=cz+b;if(xx<0||xx>=NAV.cols||zz<0||zz>=NAV.rows)continue;
  const v=zz*NAV.cols+xx;if(NAV.dist[v]>=best)continue;best=NAV.dist[v];x2=MINX+(xx+.5)*NAV.step;z2=MINZ+(zz+.5)*NAV.step;
 }
 if(x2===null)return null;const dx=x2-x,dz=z2-z,mag=Math.hypot(dx,dz)||1;return {x:dx/mag,z:dz/mag};
}
function visibility(ax,az,bx,bz){
 const dist=Math.hypot(bx-ax,bz-az),steps=Math.ceil(dist/.33);
 for(let i=1;i<steps;i++){const t=i/steps;if(blocked(ax+(bx-ax)*t,az+(bz-az)*t,.04))return false}
 return true;
}
function updateEnemies(dt){
 for(const e of hostiles){
  e.anim+=dt;
  if(!e.alive){
   e.dying+=dt;e.root.rotation.z=THREE.MathUtils.lerp(e.root.rotation.z,1.45,Math.min(1,dt*5));
   e.root.position.x+=e.velocity.x*dt;e.root.position.z+=e.velocity.z*dt;e.velocity.multiplyScalar(Math.pow(.9,dt*60));continue;
  }
  const dx=camera.position.x-e.root.position.x,dz=camera.position.z-e.root.position.z,dist=Math.hypot(dx,dz);
  const sees=visibility(e.root.position.x,e.root.position.z,camera.position.x,camera.position.z);
  e.root.rotation.y=THREE.MathUtils.lerp(e.root.rotation.y,Math.atan2(dx,dz),Math.min(1,dt*6));
  let vx=dx/(dist||1),vz=dz/(dist||1);
  if(!sees){const d=pathDirection(e.root.position.x,e.root.position.z);if(d){vx=d.x;vz=d.z}}
  const speed=e.stun>0?0:e.speed*(dist<1.25?.08:1);
  const m=move(e.root.position.x,e.root.position.z,(vx*speed+e.velocity.x)*dt,(vz*speed+e.velocity.z)*dt,e.radius);
  e.root.position.x=m.x;e.root.position.z=m.z;
  if(dist<e.radius+1.0&&game.elapsed>e.attack&&sees){
    e.attack=game.elapsed+rand(.75,1.2);damagePlayer(e.kind==='brute'?20:e.kind==='crawler'?7:11);sound.enemy();
  }
  e.stun=Math.max(0,e.stun-dt);e.velocity.multiplyScalar(Math.pow(.90,dt*60));
  if(e.hit>0){e.hit-=dt;if(e.hit<=0)e.face.material.map=expression('angry')}
  for(const l of e.limbs){
   l.pivot.rotation.x=dist>1.7?Math.sin(e.anim*(e.kind==='crawler'?16:10)+(l.s===1?0:Math.PI))*(l.type==='leg'?.48:.56):0;
  }
  e.torso.position.y=1.02+Math.abs(Math.sin(e.anim*9))*.065;
 }
}
function particlesAt(pos,count,color=0xf0b36d,power=2){
 for(let i=0;i<count;i++){
  const m=box(scene,rand(.04,.13),rand(.04,.13),rand(.04,.13),new THREE.MeshBasicMaterial({color}),pos.x,pos.y,pos.z);
  particles.push({mesh:m,vel:V(rand(-power,power),rand(.4,power),rand(-power,power)),life:rand(.3,.9)});
 }
}
function hitEnemy(e,part,dmg,point,dir){
 if(!e.alive)return;
 e.hp-=dmg*(part==='head'?1.7:part==='leg'?.75:1);e.stun=.14;e.hit=.4;e.face.material.map=expression('hurt');
 e.velocity.addScaledVector(dir,Math.min(4,dmg*.045));game.hitTime=.18;
 particlesAt(point,Math.min(14,Math.ceil(dmg/5)),0xef6670,2.2);sound.enemy();
 if(e.hp<=0){e.alive=false;game.kills++;game.combo++;game.hitAt=game.elapsed;
  e.face.material.map=expression('dead');e.velocity.addScaledVector(dir,4.5);
  for(let i=targets.length-1;i>=0;i--)if(targets[i].userData.enemy===e)targets.splice(i,1);
  particlesAt(e.root.position.clone().add(V(0,1,0)),25,0xeaa26a,4);
  subtitle('ARCMAP GREMLIN ELIMINATED');
  if(game.kills===TOTAL){game.exitReady=true;toast('ALL HOSTILES ELIMINATED // ELEVATOR UNLOCKED',4)}
 }
 updateHUD();
}
function ammoFlash(){flash.visible=true;game.cooldown=.07}
function tracer(a,b){
 const g=new THREE.BufferGeometry().setFromPoints([a,b]),m=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xffce85,transparent:true,opacity:.55}));
 scene.add(m);particles.push({mesh:m,life:.06,static:true});
}
function shoot(){
 if(game.phase!=='running'||game.reloading>0)return;
 const w=WPN[game.weapon];if(game.elapsed-game.lastShot<w.rate)return;
 if(game.ammo<=0){reload();return}
 game.lastShot=game.elapsed;game.ammo--;game.recoil+=w.recoil;ammoFlash();sound.shot();
 const origin=camera.position.clone(),base=direction();scene.updateMatrixWorld(true);
 for(let i=0;i<w.pellets;i++){
  const dir=base.clone();dir.add(V(rand(-w.spread,w.spread),rand(-w.spread,w.spread),rand(-w.spread,w.spread))).normalize();
  raycaster.set(origin,dir);raycaster.far=65;
  const a=raycaster.intersectObjects(targets,false)[0],b=raycaster.intersectObjects(solidMeshes,false)[0];
  if(a&&(!b||a.distance<b.distance)){
    hitEnemy(a.object.userData.enemy,a.object.userData.part,w.damage,a.point,dir);tracer(origin,a.point);
  }else if(b){particlesAt(b.point,2,0xf7d09c,1.4);tracer(origin,b.point)}
  else tracer(origin,origin.clone().addScaledVector(dir,60));
 }
 updateHUD();
}
function reload(){
 const w=WPN[game.weapon];if(game.reloading||game.ammo>=w.clip||game.reserve<=0||game.phase!=='running')return;
 game.reloading=w.reload;game.trigger=false;sound.click();subtitle('RELOADING');updateHUD();
}
function grab(){
 raycaster.set(camera.position,direction());raycaster.far=3.3;
 let selected=null;let distance=3.3;
 for(const p of props){
  for(const part of p.mesh.children){
   const hit=raycaster.intersectObject(part)[0];if(hit&&hit.distance<distance){distance=hit.distance;selected=p}
  }
 }
 if(!selected){
  for(const p of props){
   const d=p.mesh.position.clone().sub(camera.position),n=d.length();
   if(n<distance&&d.normalize().dot(direction())>.5){selected=p;distance=n}
  }
 }
 if(selected){carried=selected;carried.held=true;carried.vel.set(0,0,0);toast('OBJECT GRABBED • RELEASE RIGHT MOUSE TO THROW');sound.click()}
 else subtitle('NO OBJECT IN RANGE');
}
function throwObject(){
 if(!carried)return;carried.held=false;carried.vel.copy(direction()).multiplyScalar(15).add(V(0,2,0));carried=null;sound.click();
}
function updateProps(dt){
 for(const p of props){
  if(p.held){
   const pos=camera.position.clone().addScaledVector(direction(),2.0).add(V(0,-.25,0));p.mesh.position.lerp(pos,Math.min(1,dt*14));p.mesh.rotation.y+=dt;continue;
  }
  const old=p.mesh.position.clone();
  p.vel.y-=10*dt;p.mesh.position.addScaledVector(p.vel,dt);
  p.mesh.rotation.x+=p.vel.x*dt*.15;p.mesh.rotation.z+=p.vel.z*dt*.15;
  if(p.mesh.position.y<p.ground){p.mesh.position.y=p.ground;p.vel.y=Math.abs(p.vel.y)*.22;p.vel.x*=.72;p.vel.z*=.72}
  if(blocked(p.mesh.position.x,p.mesh.position.z,.3)){p.mesh.position.x=old.x;p.mesh.position.z=old.z;p.vel.x*=-.3;p.vel.z*=-.3}
  if(p.vel.length()>3.5)for(const e of hostiles){
   if(e.alive&&p.mesh.position.distanceTo(e.root.position.clone().add(V(0,1,0)))<1.1*e.scale){
    hitEnemy(e,'torso',p.vel.length()*5,p.mesh.position.clone(),p.vel.clone().normalize());p.vel.multiplyScalar(.15);
   }
  }
  p.vel.multiplyScalar(Math.pow(.986,dt*60));
 }
}
function updateParticles(dt){
 for(let i=particles.length-1;i>=0;i--){
  const p=particles[i];p.life-=dt;
  if(!p.static){p.vel.y-=8*dt;p.mesh.position.addScaledVector(p.vel,dt)}
  if(p.life<=0){scene.remove(p.mesh);p.mesh.geometry?.dispose?.();p.mesh.material?.dispose?.();particles.splice(i,1)}
 }
}
function damagePlayer(n){
 if(game.phase!=='running')return;game.health=Math.max(0,game.health-n);
 game.damageTime=.8;sound.hurt();updateHUD();if(game.health<=0)finish(false);
}
function formatClock(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0')}
function updateHUD(){
 el.health.textContent=Math.ceil(game.health);el.healthbar.style.width=game.health+'%';
 el.ammo.textContent=game.ammo;el.reserve.textContent=game.reserve;el.weapon.textContent=WPN[game.weapon].name;
 el.detail.textContent=game.kills===TOTAL?'Elevator unlocked • Reach the exit':'Hostiles eliminated: '+game.kills+' / '+TOTAL+' • Elevator locked';
 el.killbar.style.width=(game.kills/TOTAL*100)+'%';el.reload.textContent=game.reloading>0?'RELOADING…':'[DELETE / R] RELOAD';
}
function toast(s,t=1.7){el.toast.textContent=s;el.toast.classList.add('visible');game.toastTime=t}
function subtitle(s,t=1.0){el.sub.textContent=s;game.subtitleTime=t}
function phase(p){
 game.phase=p;el.menu.classList.toggle('hidden',p!=='menu');
 el.pause.classList.toggle('hidden',p!=='pause');
 el.summary.classList.toggle('hidden',p!=='won'&&p!=='lost');
 el.hud.classList.toggle('hidden',p==='menu');
}
function weapon(name){
 game.weapon=name;game.ammo=WPN[name].clip;game.reserve=WPN[name].store;game.reloading=0;buildWeapon();updateHUD();
}
function lockMouse(){if(document.pointerLockElement!==canvas)canvas.requestPointerLock?.().catch(()=>toast('CLICK THE WORLD TO ACTIVATE MOUSE LOOK',3))}
function start(){
 sound.unlock();game.health=100;game.kills=0;game.elapsed=0;game.lastShot=-20;game.yaw=0;game.pitch=0;
 game.grounded=true;game.velocityY=0;game.trigger=false;game.exitReady=false;game.combo=0;
 camera.position.set(0,1.65,15.2);camera.rotation.set(0,0,0);
 for(const d of doors){d.open=false;d.target=0;d.angle=0;d.pivot.rotation.y=0}
 clearActors();spawnEnemies();spawnProps();weapon(game.weapon);phase('running');updateHUD();lockMouse();toast('CONTAINMENT BREACH // FLOOR 01',2.7);subtitle('ELIMINATE ALL 12 GREMLINS');
}
function pause(){if(game.phase!=='running')return;game.trigger=false;phase('pause');document.exitPointerLock?.()}
function resume(){if(game.phase!=='pause')return;phase('running');sound.unlock();lockMouse()}
function menu(){game.trigger=false;document.exitPointerLock?.();phase('menu')}
function finish(success){
 if(game.phase!=='running')return;game.trigger=false;document.exitPointerLock?.();phase(success?'won':'lost');
 $('summary-tag').textContent=success?'FLOOR 01 // CLEARED':'FLOOR 01 // OPERATOR DOWN';
 $('summary-title').textContent=success?'FLOOR CLEAR':'OVERRUN';
 $('summary-desc').textContent=success?'No hostile ArcMap gremlins remain. The elevator is secured.':'You were overwhelmed. Re-arm and reclaim the office floor.';
 $('result-kills').textContent=game.kills;$('result-time').textContent=formatClock(game.elapsed);
 $('result-health').textContent=Math.ceil(game.health);
}
function interact(){
 if(game.exitReady&&Math.hypot(camera.position.x,camera.position.z+16.8)<3.1){finish(true);return}
 for(const d of doors){
  if(Math.hypot(camera.position.x-d.x,camera.position.z-d.z)<2.5){
   d.open=!d.open;d.target=d.open?Math.PI/2:0;sound.click();toast(d.open?'DOOR OPEN':'DOOR CLOSED');return;
  }
 }
}
function updateDoors(dt){
 let close=null;
 for(const d of doors){
  d.angle=THREE.MathUtils.lerp(d.angle,d.target,Math.min(1,dt*7));d.pivot.rotation.y=d.angle;
  if(Math.hypot(camera.position.x-d.x,camera.position.z-d.z)<2.5)close=d;
 }
 if(game.exitReady&&Math.hypot(camera.position.x,camera.position.z+16.8)<3.1){
  el.interaction.textContent='[ENTER] TAKE ELEVATOR';el.interaction.classList.remove('hidden');
 }else if(close){el.interaction.textContent=close.open?'[ENTER] CLOSE DOOR':'[ENTER] KICK OPEN DOOR';el.interaction.classList.remove('hidden')}
 else el.interaction.classList.add('hidden');
}
function movement(dt){
 let f=0,s=0;if(keys.has('ArrowUp')||keys.has('KeyW'))f++;if(keys.has('ArrowDown')||keys.has('KeyS'))f--;
 if(keys.has('ArrowRight')||keys.has('KeyD'))s++;if(keys.has('ArrowLeft')||keys.has('KeyA'))s--;
 const n=Math.hypot(f,s)||1;f/=n;s/=n;
 const speed=keys.has('ShiftRight')||keys.has('ShiftLeft')?7.1:4.7;
 const dx=(-Math.sin(game.yaw)*f+Math.cos(game.yaw)*s)*dt*speed;
 const dz=(-Math.cos(game.yaw)*f-Math.sin(game.yaw)*s)*dt*speed;
 const p=move(camera.position.x,camera.position.z,dx,dz,.33);
 camera.position.x=p.x;camera.position.z=p.z;
 if(!game.grounded){
  game.velocityY-=21*dt;camera.position.y+=game.velocityY*dt;
  if(camera.position.y<=1.65){game.grounded=true;game.velocityY=0;camera.position.y=1.65}
 }else camera.position.y=1.65;
 const step=(Math.abs(f)+Math.abs(s))>0;game.bob+=dt*(step?10:2);
 if(game.grounded&&step)camera.position.y+=Math.sin(game.bob)*.028;
 camera.rotation.set(game.pitch,game.yaw,0);
 gun.position.y=-.35+Math.sin(game.bob)*.015+game.recoil*.06;
 gun.position.z=-.58+game.recoil*.25;gun.rotation.x=-game.recoil*.7;
 game.recoil=Math.max(0,game.recoil-dt*2.6);
}
function map(){
 const c=el.map.getContext('2d'),cw=180,ch=140;
 c.clearRect(0,0,cw,ch);c.fillStyle='#122430';c.fillRect(0,0,cw,ch);
 const xx=x=>(x-MINX)/(MAXX-MINX)*cw,zz=z=>(z-MINZ)/(MAXZ-MINZ)*ch;
 c.strokeStyle='#627a87';c.strokeRect(1,1,cw-2,ch-2);c.fillStyle='#354d5c';
 for(const b of colliders)c.fillRect(xx(b.x-b.w/2),zz(b.z-b.d/2),b.w/(MAXX-MINX)*cw,b.d/(MAXZ-MINZ)*ch);
 for(const e of hostiles){if(!e.alive)continue;c.fillStyle=e.kind==='brute'?'#eab26c':'#f96b6a';c.beginPath();c.arc(xx(e.root.position.x),zz(e.root.position.z),e.kind==='brute'?3.2:2.4,0,6.283);c.fill()}
 c.save();c.translate(xx(camera.position.x),zz(camera.position.z));c.rotate(-game.yaw);c.fillStyle='#aaffdb';c.beginPath();c.moveTo(0,-6);c.lineTo(-4,5);c.lineTo(4,5);c.closePath();c.fill();c.restore();
 if(game.exitReady){c.fillStyle='#ffc976';c.fillRect(xx(-1),zz(-16.9),10,5)}
}
function update(dt){
 if(game.phase!=='running')return;
 game.elapsed+=dt;movement(dt);makeFlow();updateEnemies(dt);updateProps(dt);updateDoors(dt);updateParticles(dt);
 if(game.trigger&&WPN[game.weapon].auto)shoot();
 if(game.reloading>0){game.reloading-=dt;if(game.reloading<=0){
  const count=Math.min(WPN[game.weapon].clip-game.ammo,game.reserve);game.ammo+=count;game.reserve-=count;game.reloading=0;sound.click();updateHUD();
 }}
 if(game.cooldown>0){game.cooldown-=dt;if(game.cooldown<=0)flash.visible=false}
 game.hitTime=Math.max(0,game.hitTime-dt);el.hit.classList.toggle('flash',game.hitTime>0);
 game.damageTime=Math.max(0,game.damageTime-dt*1.5);el.vignette.style.opacity=game.damageTime;
 if(game.toastTime>0){game.toastTime-=dt;if(game.toastTime<=0)el.toast.classList.remove('visible')}
 if(game.subtitleTime>0){game.subtitleTime-=dt;if(game.subtitleTime<=0)el.sub.textContent=''}
 el.clock.textContent=formatClock(game.elapsed);
 if(game.elapsed%0.30<dt)map();
}
function pointer(){
 if(document.pointerLockElement!==canvas&&game.phase==='running')pause();
}
function choose(name){
 if(game.phase==='running'){weapon(name);toast('EQUIPPED // '+WPN[name].name)}
 else game.weapon=name;
 sound.click();
}
document.querySelectorAll('[data-weapon]').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('[data-weapon]').forEach(k=>{k.classList.toggle('selected',k===b);k.setAttribute('aria-pressed',String(k===b))});
 choose(b.dataset.weapon);
}));
$('launch').addEventListener('click',start);$('resume').addEventListener('click',resume);
$('restart-pause').addEventListener('click',start);$('menu-pause').addEventListener('click',menu);
$('replay').addEventListener('click',start);$('summary-menu').addEventListener('click',menu);
document.addEventListener('pointerlockchange',pointer);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.phase==='running')pause()});
window.addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
document.addEventListener('keydown',e=>{
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
 keys.add(e.code);if(game.phase!=='running'||e.repeat)return;
 if(e.code==='Space'&&game.grounded){game.grounded=false;game.velocityY=6.5}
 if(e.code==='Delete'||e.code==='KeyR')reload();
 if(e.code==='Enter'||e.code==='KeyE')interact();
 if(e.code==='Digit1')choose('rifle');if(e.code==='Digit2')choose('shotgun');
 if(e.code==='Digit3')choose('smg');if(e.code==='Digit4')choose('revolver');
});
document.addEventListener('keyup',e=>keys.delete(e.code));
document.addEventListener('mousemove',e=>{
 if(game.phase!=='running'||document.pointerLockElement!==canvas)return;
 game.yaw-=e.movementX*.0022;game.pitch=clamp(game.pitch-e.movementY*.0022,-1.34,1.34);
});
canvas.addEventListener('mousedown',e=>{
 if(game.phase!=='running')return;e.preventDefault();
 if(document.pointerLockElement!==canvas){lockMouse();return}
 if(e.button===0){game.trigger=true;shoot()}
 if(e.button===2)grab();
});
document.addEventListener('mouseup',e=>{if(e.button===0)game.trigger=false;if(e.button===2)throwObject()});
canvas.addEventListener('wheel',e=>{
 if(game.phase!=='running')return;e.preventDefault();const a=Object.keys(WPN),i=a.indexOf(game.weapon);
 choose(a[(i+(e.deltaY>0?1:a.length-1))%a.length]);
},{passive:false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
office();buildWeapon();phase('menu');updateHUD();
function frame(time){
 requestAnimationFrame(frame);const dt=Math.min(.045,Math.max(0,(time-(frame.last||time))*.001));frame.last=time;
 if(game.phase==='menu'){
  camera.position.set(4+Math.sin(time*.0003)*.7,1.85,14.4);camera.rotation.set(-.08,-.26+Math.sin(time*.0004)*.07,0);gun.visible=false;
 }else gun.visible=true;
 update(dt);renderer.render(scene,camera);
}
requestAnimationFrame(frame);
window.ARCMAP_OFFICE_DEBUG={game,WPN,renderer,scene,camera,hostiles,targets,props,colliders,start,shoot,damagePlayer,makeGremlin};
