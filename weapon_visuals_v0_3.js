/* Office Rampage v0.3: real three-dimensional tracer motion, casings and soft flame volumes.
   Author-created procedural graphics. No external assets or requests. */
export class WeaponVisuals {
 constructor(THREE,scene,camera){
  this.T=THREE;this.scene=scene;this.camera=camera;this.effects=[];this.time=0;
  this.flameTexture=this.radialTexture([[0,'rgba(255,255,255,1)'],[.21,'rgba(255,249,200,.98)'],[.40,'rgba(255,190,72,.8)'],[.66,'rgba(255,85,13,.32)'],[1,'rgba(60,9,0,0)']]);
  this.glowTexture=this.radialTexture([[0,'rgba(255,255,255,1)'],[.19,'rgba(255,252,224,.96)'],[.43,'rgba(255,172,62,.38)'],[1,'rgba(255,128,9,0)']]);
  this.smokeTexture=this.radialTexture([[0,'rgba(163,156,144,.38)'],[.6,'rgba(72,78,78,.20)'],[1,'rgba(45,53,52,0)']]);
  this.tracerGeometry=new THREE.SphereGeometry(1,9,7);
  this.streakGeometry=new THREE.CylinderGeometry(1,1,1,7);
  this.casingGeometry=new THREE.CylinderGeometry(1,1,1,10);
  this.stats={tracers:0,flames:0,casings:0,beams:0};
 }
 radialTexture(stops){
  const c=document.createElement('canvas');c.width=c.height=128;
  const g=c.getContext('2d'),grad=g.createRadialGradient(64,64,0,64,64,64);
  for(const [p,color] of stops)grad.addColorStop(p,color);
  g.fillStyle=grad;g.fillRect(0,0,128,128);
  const t=new this.T.CanvasTexture(c);t.colorSpace=this.T.SRGBColorSpace;return t;
 }
 add(mesh,data){
  if(this.effects.length>=255){this.remove(this.effects[0]);this.effects.shift()}
  this.scene.add(mesh);this.effects.push({mesh,...data});
  return mesh;
 }
 remove(p){this.scene.remove(p.mesh);p.mesh.material?.dispose?.();if(p.tail){this.scene.remove(p.tail);p.tail.material?.dispose?.()}}
 muzzle(gun){
  gun.updateWorldMatrix(true,false);
  return gun.localToWorld(new this.T.Vector3(0,-.065,gun.userData.muzzleZ??-1.28));
 }
 glow(pos,scale,color,life=.18){
  const mat=new this.T.SpriteMaterial({map:this.glowTexture,color,transparent:true,opacity:.8,blending:this.T.AdditiveBlending,depthWrite:false});
  const sprite=new this.T.Sprite(mat);sprite.position.copy(pos);sprite.scale.set(scale,scale,1);
  this.add(sprite,{type:'glow',life,maxLife:life,vel:new this.T.Vector3()});
 }
 tracer(muzzle,end,weapon='rifle'){
  const T=this.T,forward=end.clone().sub(muzzle),distance=forward.length();
  if(distance<.04)return;
  forward.normalize();
  // Real moving 3D bullet; its illuminated tail tracks it across multiple frames.
  const speed=weapon==='minigun'?89:weapon==='shotgun'?68:weapon==='smg'?80:105;
  const travel=Math.min(distance,65);
  const mat=new T.MeshStandardMaterial({color:0xe7c68c,metalness:.8,roughness:.24,emissive:0xc38333,emissiveIntensity:1.25});
  const bullet=new T.Mesh(this.tracerGeometry,mat);
  bullet.scale.set(.027,.027,weapon==='shotgun'?.05:.085);bullet.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),forward);
  bullet.position.copy(muzzle).addScaledVector(forward,.065);
  const streak=new T.Mesh(this.streakGeometry,new T.MeshBasicMaterial({color:weapon==='minigun'?0xffd79a:0xffe6ad,transparent:true,opacity:.92,blending:T.AdditiveBlending,depthWrite:false}));
  streak.scale.set(.019,weapon==='shotgun'?.34:.65,.019);
  streak.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),forward);
  streak.position.copy(bullet.position).addScaledVector(forward,-.21);
  this.scene.add(streak);
  const lifetime=Math.max(.12,Math.min(.29,travel/speed+.06));
  this.add(bullet,{type:'tracer',life:lifetime,maxLife:lifetime,vel:forward.clone().multiplyScalar(speed),end:end.clone(),forward,tail:streak});
  this.stats.tracers++;
  this.glow(muzzle,.48,0xffce82,.10);
  if(this.effects.length>225)this.effects[0].life=0;
 }
 laser(muzzle,end,heavy=false){
  const T=this.T,v=end.clone().sub(muzzle),len=v.length();
  if(len<.05)return;
  const midpoint=muzzle.clone().addScaledVector(v,.5);
  const direction=v.normalize(),color=heavy?0xef8dff:0x7ffff1;
  for(const [r,alpha] of [[heavy?.1:.048,1],[heavy?.26:.15,.13]]){
    const mesh=new T.Mesh(this.streakGeometry,new T.MeshBasicMaterial({color,transparent:true,opacity:alpha,blending:T.AdditiveBlending,depthWrite:false}));
    mesh.scale.set(r,len,r);mesh.position.copy(midpoint);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction);
    this.add(mesh,{type:'laser',life:heavy?.16:.115,maxLife:heavy?.16:.115});this.stats.beams++;
  }
  this.glow(muzzle,heavy?1.2:.76,color,.16);
  this.glow(end,heavy?.88:.48,color,.19);
 }
 flames(muzzle,forward){
  const T=this.T;
  // Soft overlapping camera-facing flame billboards, with expanding turbulent trajectory.
  // They start at the nozzle instead of spawning as cubes in a distant region.
  for(let i=0;i<10;i++){
    const dir=forward.clone().add(new T.Vector3((Math.random()-.5)*.24,(Math.random()-.5)*.21,(Math.random()-.5)*.24)).normalize();
    const start=muzzle.clone().addScaledVector(forward,i*.09+.10);
    const radius=.17+Math.random()*.2;
    const sprite=new T.Sprite(new T.SpriteMaterial({map:this.flameTexture,color:i%4===0?0xffd862:i%3===0?0xff802e:0xffae4b,opacity:.9,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));
    sprite.position.copy(start);
    sprite.scale.set(radius*2,radius*2.7,1);
    const life=.27+Math.random()*.35;
    this.add(sprite,{type:'flame',vel:dir.multiplyScalar(5.9+Math.random()*4.6),life,maxLife:life,initialSize:radius,phase:Math.random()*Math.PI*2});
    this.stats.flames++;
  }
  this.glow(muzzle,.9,0xffae5e,.12);
 }
 casing(muzzle,weapon){
  if(weapon==='flamethrower'||weapon==='laser'||weapon==='cannon')return;
  if(weapon==='minigun'&&Math.random()<.55)return;
  const T=this.T,mat=new T.MeshStandardMaterial({color:weapon==='shotgun'?0xb33e26:0xd4ad5e,metalness:.7,roughness:.27});
  const mesh=new T.Mesh(this.casingGeometry,mat);
  mesh.scale.set(weapon==='shotgun'?.058:.026,weapon==='shotgun'?.15:.078,weapon==='shotgun'?.058:.026);
  mesh.position.copy(muzzle).add(new T.Vector3(.21,-.17,.15));
  const speed=new T.Vector3(1+Math.random()*2,1.6+Math.random()*1.8,-.1+Math.random()*.45).applyQuaternion(this.camera.quaternion);
  this.add(mesh,{type:'casing',vel:speed,life:1,maxLife:1});
  this.stats.casings++;
 }
 update(dt){
  this.time+=dt;
  for(let i=this.effects.length-1;i>=0;i--){
    const p=this.effects[i];p.life-=dt;
    if(p.life<=0){this.remove(p);this.effects.splice(i,1);continue}
    const fraction=p.life/p.maxLife;
    if(p.type==='tracer'){
      const next=p.mesh.position.clone().addScaledVector(p.vel,dt);
      if(next.clone().sub(p.end).dot(p.forward)>0){p.life=0;continue}
      p.mesh.position.copy(next);p.mesh.rotation.z+=dt*3;
      if(p.tail){p.tail.position.copy(next).addScaledVector(p.forward,-.21);p.tail.material.opacity=Math.min(.9,fraction*3)}
    } else if(p.type==='flame'){
      p.mesh.position.addScaledVector(p.vel,dt);
      p.mesh.position.y+=dt*.52;
      const grow=1+(1-fraction)*1.15;
      p.mesh.scale.set(p.initialSize*2*grow,p.initialSize*2.7*grow,1);
      p.mesh.material.opacity=Math.max(0,Math.min(.93,fraction*1.85));
      p.vel.x+=Math.sin(this.time*26+p.phase)*dt*.9;
      p.vel.y+=dt*1.1;p.vel.multiplyScalar(Math.pow(.985,dt*60));
      if(fraction<.22&&Math.random()<.04){
        const smoke=new this.T.Sprite(new this.T.SpriteMaterial({map:this.smokeTexture,color:0x9c9f9f,transparent:true,opacity:.16,depthWrite:false}));
        smoke.position.copy(p.mesh.position);smoke.scale.set(.5,.5,1);
        this.add(smoke,{type:'smoke',life:.58,maxLife:.58,vel:new this.T.Vector3(0,.45,0)});
      }
    } else if(p.type==='smoke'){
      p.mesh.position.addScaledVector(p.vel,dt);p.mesh.scale.multiplyScalar(1+dt*.9);p.mesh.material.opacity=.13*fraction;
    } else if(p.type==='casing'){
      p.vel.y-=9.81*dt;p.mesh.position.addScaledVector(p.vel,dt);
      p.mesh.rotation.x+=dt*17;p.mesh.rotation.z+=dt*11;
      if(p.mesh.position.y<.035){p.mesh.position.y=.035;p.vel.y=Math.abs(p.vel.y)*.25;p.vel.x*=.62;p.vel.z*=.62}
    } else if(p.mesh.material?.opacity!==undefined){
      p.mesh.material.opacity*=Math.pow(.78,dt*60);
    }
  }
 }
 clear(){
  for(const p of this.effects)this.remove(p);
  this.effects.length=0;
 }
 get active(){return this.effects.length}
}
