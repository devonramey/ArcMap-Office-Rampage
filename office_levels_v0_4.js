/* ArcMap: Office Rampage v0.4 campaign floor configurations.
   Static browser-compatible environments. Each floor has its own geometry and encounters. */
export const FLOORS=[
 {number:1,name:'THE CUBICLE FARM',area:'GEOSPATIAL OPERATIONS',brief:'Contain the initial outbreak. Clear the cubicles, training room and office desks to access the security elevator.',accent:0xe3b471,
  spawns:[[-13,8,'runner'],[-6.4,8,'runner'],[1.3,8,'runner'],[11.4,8,'runner'],[-16,1,'crawler'],[6.6,.8,'runner'],[-2,-5,'runner'],[5,-5,'runner'],[-17,-10,'runner'],[5,-11,'brute'],[9.5,-7,'crawler'],[-3,-14,'runner']],
  props:[[-5.5,14,'crate'],[6.7,10.8,'monitor'],[.6,4,'printer'],[-17,-4,'crate'],[10,-9,'monitor'],[-3,-12.5,'printer']]},
 {number:2,name:'RECORDS & BREAK ROOM',area:'ARCHIVE / EMPLOYEE SERVICES',brief:'The archives are infested. Fight between the document shelves and break-room counters, then reach the secured lift.',accent:0xe8aa62,
  spawns:[[-8,12,'runner'],[8,12,'runner'],[-15,10,'crawler'],[14,8,'runner'],[-2,7,'runner'],[3,5,'runner'],[-14,2,'runner'],[15,1,'crawler'],[-4,-1,'brute'],[5,-3,'runner'],[-15,-6,'runner'],[14,-6,'runner'],[-4,-9,'crawler'],[4,-10,'runner'],[-11,-13,'runner'],[8,-14,'brute']],
  props:[[-3.3,11.8,'monitor'],[3.1,9,'printer'],[-16.4,7.1,'crate'],[15.8,4,'printer'],[-3.5,-5,'crate'],[2.5,-12,'monitor'],[-11,-8,'crate']]},
 {number:3,name:'SERVER OPERATIONS',area:'DATACENTER / ENGINEERING',brief:'Security systems are collapsing. Fight through server racks and the maintenance corridor to secure the final exit.',accent:0x61daed,
  spawns:[[-8,13,'runner'],[8,13,'crawler'],[-16,12,'runner'],[16,11,'runner'],[-3,9,'runner'],[5,8,'runner'],[-14,5,'crawler'],[13,5,'runner'],[-3,3,'brute'],[3,2,'runner'],[-17,-1,'runner'],[17,-2,'crawler'],[-4,-4,'runner'],[4,-5,'brute'],[-13,-8,'runner'],[13,-8,'runner'],[-3,-10,'crawler'],[3,-11,'runner'],[-12,-14,'runner'],[10,-14,'brute']],
  props:[[-4,13,'printer'],[4,13,'crate'],[-17,8,'monitor'],[17,8,'crate'],[-3,-1,'monitor'],[3,-6,'printer'],[14,-13,'crate'],[-14,-12,'printer']]}
];
export const CAMPAIGN_TOTAL=FLOORS.reduce((n,f)=>n+f.spawns.length,0);

export function buildAlternateFloor(number,C){
 if(number!==2&&number!==3)throw Error('Alternate floor must be 2 or 3');
 const {THREE,scene,box,wall,solid,label,material,steel,trim,wood,glass,doors}=C;
 const isServer=number===3,secondary=material(isServer?0x2e5261:0x6c7376,.66,.22);
 const floorMat=material(isServer?0x273841:0x82766a,.9);
 const dark=material(isServer?0x111e29:0x343e44,.46,.4);
 const metal=material(isServer?0x638399:0x8f9694,.3,.72);
 const warm=material(0xb8956f,.75),blue=material(0x17667c,.35,.3);
 const emissive=(base,glow,intensity=1.6)=>new THREE.MeshStandardMaterial({color:base,emissive:glow,emissiveIntensity:intensity,roughness:.35});
 const bright=emissive(isServer?0x3180a2:0xb9ad92,isServer?0x19bff2:0xffdfbb,1.45);
 // Perimeter, foundation, suspended ceiling and floor-specific flooring.
 box(scene,40,.36,36,dark,0,-.17,0);
 box(scene,39.4,.025,35.4,floorMat,0,.015,0);
 const grout=material(isServer?0x1c303a:0x685e55,.98);
 const pitch=isServer?2.2:1.75;
 for(let x=-19;x<20;x+=pitch)box(scene,.025,.012,35.2,grout,x,.035,0);
 for(let z=-17;z<18;z+=pitch)box(scene,39.2,.012,.024,grout,0,.035,z);
 wall(0,-17.7,40,.36);wall(0,17.7,40,.36);
 wall(-19.7,0,.36,35.7);wall(19.7,0,.36,35.7);
 // Aisles stay connected: no enclosed, inaccessible rooms.
 for(const side of [-1,1]){
   box(scene,.08,.22,35.1,metal,side*19.46,.13,0);
   box(scene,.08,.075,35.1,secondary,side*19.45,3.16,0);
 }
 for(const z of [-17.42,17.42]){
   box(scene,39.3,.22,.09,metal,0,.13,z);
   box(scene,39.3,.09,.11,secondary,0,3.15,z);
 }
 for(let x=-18;x<=18;x+=2.6)box(scene,.018,.021,35.4,metal,x,3.3,0);
 for(let z=-16;z<=16;z+=2.6)box(scene,39.1,.021,.019,metal,0,3.3,z);
 for(let x=-14;x<=16;x+=8)for(let z=-13;z<=14;z+=9){
    box(scene,2.2,.032,.54,new THREE.MeshBasicMaterial({color:isServer?0xd0f4ff:0xffecd7}),x,3.27,z);
    const light=new THREE.PointLight(isServer?0x9de8ff:0xffedd2,isServer?3.8:4.2,13,2);
    light.position.set(x,3.06,z);scene.add(light);
 }
 // Distinct colored level lighting and background.
 const fill=new THREE.PointLight(isServer?0x25b9ee:0xf2b775,isServer?7:4,16,2);
 fill.position.set(isServer?6:-13,2.3,-9);scene.add(fill);
 const fill2=new THREE.PointLight(isServer?0xfa554b:0xc0daeb,isServer?5:3.3,14,2);
 fill2.position.set(isServer?-12:12,2.1,5);scene.add(fill2);
 const header=label(isServer?'SERVER OPERATIONS / FLOOR 03':'ARCHIVES & BREAK ROOM / FLOOR 02',6.5,.41);
 header.position.set(0,2.88,17.47);header.rotation.y=Math.PI;scene.add(header);
 // Lift stays at the same navigable location on all three floors.
 box(scene,3.2,3,.12,metal,0,1.5,-17.31,true);
 box(scene,.045,2.95,.16,dark,0,1.5,-17.20);
 const sign=label(isServer?'SECURE EXIT / CAMPAIGN COMPLETE':'SECURITY ELEVATOR / FLOOR 03',3.7,.30);
 sign.position.set(0,3.20,-17.05);scene.add(sign);
 const beacon=new THREE.PointLight(isServer?0x6efae8:0xffb47d,5,8,2);
 beacon.position.set(0,2.65,-14.9);scene.add(beacon);
 // Cross-department corridor. Center gap is >5m; pathfinding remains traversable.
 wall(-13.3,1.5,12.3,.18,3.2,secondary);
 wall(13.3,1.5,12.3,.18,3.2,secondary);
 const corridorSign=label(isServer?'AUTHORIZED PERSONNEL ONLY':'EMPLOYEE BREAK ROOM / ARCHIVES',5,.32);
 corridorSign.position.set(0,2.5,1.60);corridorSign.rotation.y=Math.PI;scene.add(corridorSign);
 if(!isServer){
   const shelf=(x,z,rot=0)=>{
      const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);
      box(g,2.1,2.55,.69,metal,0,1.28,0,true);
      for(let y=.36;y<=2.3;y+=.4){
        box(g,2.04,.055,.74,dark,0,y,0,true);
        for(let k=0;k<12;k++){
         const color=[0x66889b,0x9c987a,0xb37f6e,0x6d7a83][(k+Math.floor(y*8))%4];
         box(g,.11,.25,.31,material(color,.95),-.91+k*.163,y+.15,0);
        }
      }
      solid(x,z,2.15,.76);
   };
   // Archival cabinets and stocked shelves on the eastern portion.
   for(const z of [12,7,-4,-9]){
     for(const x of [10.4,14.8])shelf(x,z);
   }
   const counter=(x,z,len=3)=>{
      box(scene,len,.19,.85,warm,x,.88,z,true);
      box(scene,len,.75,.60,dark,x,.44,z,true);
      solid(x,z,len,.85);
      box(scene,.43,.17,.32,metal,x+.5,1.05,z,true);
   };
   // Break room at the west; appliance counters, mugs and vending machines.
   for(const z of [8,-5])counter(-14.2,z,4.2);
   counter(-12,-9,3);
   for(const [x,z] of [[-16,3],[-10,3],[-16,-12]]){
     box(scene,1,2,.67,secondary,x,1,z,true);solid(x,z,1,.67);
     for(let k=0;k<5;k++)box(scene,.73,.12,.04,material(k%2?0xdd9366:0x7bb7a3),x,.35+k*.30,z+.35);
     box(scene,.68,.13,.06,bright,x,1.77,z+.35);
   }
   for(const [x,z] of [[-3,11],[4,10],[-3,-7],[4,-8]]){
     box(scene,1.6,.10,.9,wood,x,.82,z,true);solid(x,z,1.6,.9);
     for(const dx of [-.65,.65])for(const dz of [-.34,.34])
        box(scene,.065,.73,.065,metal,x+dx,.40,z+dz);
   }
   for(const [x,z] of [[-5,4],[5,-13],[17,-12]]){
     box(scene,1.15,1.85,.65,secondary,x,.925,z,true);solid(x,z,1.15,.65);
     for(let y=.25;y<1.7;y+=.46){box(scene,.95,.35,.02,metal,x,y,z+.34);}
   }
   const help=label('RECORD RETENTION IS FOREVER',3.9,.34);
   help.position.set(13,2.72,17.41);help.rotation.y=Math.PI;scene.add(help);
 }else{
   const rack=(x,z)=>{
     const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
     box(group,1.33,2.72,.98,dark,0,1.38,0,true);
     for(let j=0;j<8;j++){
       box(group,1.17,.23,.045,metal,0,.40+j*.285,.52);
       for(const dx of [-.4,-.1,.22,.4]){
         box(group,.048,.037,.035,emissive(0x12415c,j%3===0?0xfaa948:0x27eca5,1.7),dx,.41+j*.285,.55);
       }
     }
     for(const xx of [-.62,.62])box(group,.045,2.60,.10,steel,xx,1.38,.49);
     solid(x,z,1.36,1);
   };
   // Main central sightline, navigable side aisles and dense illuminated server banks.
   for(const x of [-15,-11,-7,7,11,15])for(const z of [11,5,-3,-9])rack(x,z);
   for(const [x,z] of [[-3,8],[3,8],[-3,-7],[3,-7]]){
     box(scene,1.55,.09,.78,metal,x,.77,z,true);solid(x,z,1.55,.78);
     for(const dx of [-.61,.61])for(const dz of [-.30,.30])box(scene,.06,.67,.06,dark,x+dx,.39,z+dz);
     box(scene,.64,.55,.085,trim,x,1.15,z-.16,true);
     box(scene,.55,.42,.01,emissive(0x072935,0x1bceee,1.5),x,1.15,z-.106);
   }
   for(const z of [12,0,-11]){
     box(scene,2.8,.08,.11,metal,0,3.05,z);
     const light=new THREE.PointLight(z===0?0xff614b:0x4bcbe8,3.8,11,2);light.position.set(0,2.84,z);scene.add(light);
     const badge=label(z===0?'SECURITY OVERRIDE':'HIGH VOLTAGE / DATA',3.2,.32);
     badge.position.set(0,2.37,z);scene.add(badge);
   }
   for(const x of [-17.6,17.6])for(const z of [14,1,-14]){
     box(scene,.15,2.3,1.6,blue,x,1.15,z,true);
     box(scene,.16,2.25,.05,emissive(0x093e5b,0x35d1f8,1.6),x,1.16,z+.7);
   }
 }
}
