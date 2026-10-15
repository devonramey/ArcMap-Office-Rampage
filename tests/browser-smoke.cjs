/* GitHub Actions browser smoke test for the playable FPS prototype. */
const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), http=require('node:http');
const {chromium}=require('playwright-core');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const server=http.createServer((req,res)=>{
 const url=decodeURIComponent((req.url||'/').split('?')[0]);
 const filename=path.resolve(root,'.'+(url==='/'?'/index.html':url));
 if(!filename.startsWith(root)||!fs.existsSync(filename)){res.writeHead(404);res.end();return}
 res.setHeader('Content-Type',types[path.extname(filename)]||'text/plain');
 fs.createReadStream(filename).pipe(res);
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const chrome=[process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>x&&fs.existsSync(x));
 assert.ok(chrome,'Chrome or Chromium required');
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:960}});
  const errors=[];page.on('pageerror',err=>errors.push(String(err)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'load'});
  await page.waitForFunction('window.ARCMAP_OFFICE_DEBUG',{timeout:30000});
  assert.equal(await page.locator('#menu').isVisible(),true);
  await page.locator('[data-weapon="shotgun"]').click();
  await page.locator('#launch').click();
  await page.waitForFunction('window.ARCMAP_OFFICE_DEBUG.game.phase==="running"',{timeout:10000});
  const summary=await page.evaluate(()=>{
    const d=window.ARCMAP_OFFICE_DEBUG,s=d.game;
    const keys=Object.keys(d.WPN),counts=[],initialAmmo=s.ammo;
    for(let i=0;i<keys.length;i++){
      const key=new KeyboardEvent('keydown',{bubbles:true,code:'Digit'+(i+1)});
      document.dispatchEvent(key);
      s.elapsed+=1;s.lastShot=-10;
      d.shoot();
      counts.push({name:s.weapon,ammo:s.ammo,damage:d.WPN[s.weapon].damage});
    }
    const fx={...d.vfx.stats,active:d.vfx.active};
    const audioShots=d.sound.recentShots,contextReady=!!d.sound.ctx;
    d.sound.update('flamethrower',true,'running');const flameLoop=d.sound.loopType;
    d.sound.update('minigun',true,'running');const rotaryLoop=d.sound.loopType;
    d.sound.update('rifle',false,'running');const soundStopped=d.sound.loopType===null;
    return {phase:s.phase,initialWeapon:'shotgun',initialAmmo,weapons:keys,counts,enemies:d.hostiles.length,targets:d.targets.length,props:d.props.length,solid:d.colliders.length,renderer:!!d.renderer.getContext(),fx,audioShots,contextReady,flameLoop,rotaryLoop,soundStopped};
  });
  assert.equal(summary.phase,'running');assert.equal(summary.initialWeapon,'shotgun');
  assert.equal(summary.initialAmmo,Infinity);
  assert.deepEqual(summary.weapons,['rifle','shotgun','smg','flamethrower','minigun','laser','cannon']);
  assert.equal(summary.counts.length,7);
  for(const item of summary.counts){assert.equal(item.ammo,Infinity,'Ammo must never decrease: '+item.name);assert.ok(item.damage>=14);}
  assert.equal(summary.enemies,12);assert.ok(summary.targets>=12&&summary.props>=5&&summary.solid>30);
  assert.equal(await page.locator('#ammo').textContent(),'∞');
  assert.equal(await page.locator('#reload-hint').textContent(),'NO RELOADS • INFINITE SUPPLY');
  assert.ok(summary.fx.tracers>=4,'Visible moving 3D bullets should spawn for the firearms');
  assert.ok(summary.fx.flames>=8,'Flamethrower should spawn soft flame sprites');
  assert.ok(summary.fx.beams>=4,'Laser weapons should create 3D energy beams');
  assert.ok(summary.fx.casings>=3,'Ballistic weapons should eject cases');
  assert.ok(summary.fx.active>0,'Active weapon projectile effects should persist beyond the firing frame');
  assert.ok(summary.contextReady&&summary.audioShots>=7,'Weapon audio engine should start after clicking Deploy');
  assert.equal(summary.flameLoop,'flamethrower');
  assert.equal(summary.rotaryLoop,'minigun');
  assert.equal(summary.soundStopped,true,'Continuous weapon sounds must stop when firing ends');
  await page.waitForTimeout(200);
  // Simulate legitimate damage processing rather than bypassing the combat and mission logic.
  // A completed floor must unlock the elevator, enter the briefing UI, and load next geometry.
  const floors=[];
  for(let floor=1;floor<=3;floor++){
    const result=await page.evaluate(()=>{
      const d=window.ARCMAP_OFFICE_DEBUG,s=d.game;
      const initial={floor:s.floor,name:d.FLOORS[s.floor-1].name,enemies:d.hostiles.length,geometry:d.colliders.length,props:d.props.length,health:s.health};
      for(const enemy of [...d.hostiles]){
        if(enemy.alive)d.hitEnemy(enemy,'torso',10000,enemy.root.position.clone().add(new d.camera.position.constructor(0,1,0)),new d.camera.position.constructor(0,0,-1));
      }
      initial.killed=s.kills;initial.campaignKills=s.campaignKills;initial.exitReady=s.exitReady;
      d.camera.position.set(0,1.65,-16);
      d.interact();
      initial.exitPhase=s.phase;
      return initial;
    });
    floors.push(result);
    assert.equal(result.floor,floor);
    assert.equal(result.enemies,[12,16,20][floor-1],'Wrong enemy count on floor '+floor);
    assert.equal(result.killed,result.enemies,'Clear objective failed');
    assert.equal(result.exitReady,true,'Elevator did not unlock');
    assert.ok(result.geometry>20,'Each floor must have world geometry and collisions');
    assert.ok(result.props>=5,'Each floor must have throwable items');
    if(floor<3){
      assert.equal(result.exitPhase,'transition','Elevator must display floor briefing');
      assert.equal(await page.locator('#floor-transition').isVisible(),true);
      assert.equal((await page.locator('#transition-name').textContent()).trim(),['','RECORDS & BREAK ROOM','SERVER OPERATIONS'][floor]);
      await page.locator('#continue-floor').click();
      await page.waitForTimeout(1400);
      const continuation=await page.evaluate(()=>({floor:window.ARCMAP_OFFICE_DEBUG.game.floor,phase:window.ARCMAP_OFFICE_DEBUG.game.phase,enemyCount:window.ARCMAP_OFFICE_DEBUG.hostiles.length,loadedTitle:document.querySelector('#hud-floor')?.textContent,pointer:!!document.pointerLockElement}));
      console.log('DEBUG FLOOR CONTINUATION:',JSON.stringify({requested:floor+1,continuation,errors}));
      assert.equal(continuation.floor,floor+1,'Elevator continuation must load next floor');
      assert.equal(continuation.phase,'running','Floor continuation should restore gameplay');
      assert.equal((await page.locator('#hud-floor').textContent()).trim(),'FLOOR 0'+(floor+1));
      assert.equal(await page.locator('#ammo').textContent(),'∞');
    }else{
      assert.equal(result.exitPhase,'won','Last elevator must complete campaign');
      assert.equal(await page.locator('#summary').isVisible(),true);
      assert.equal((await page.locator('#summary-title').textContent()).trim(),'BUILDING CLEARED');
      assert.equal((await page.locator('#result-kills').textContent()).trim(),'48');
    }
  }
  assert.deepEqual(floors.map(x=>x.campaignKills),[12,28,48],'Campaign kills should persist between levels');
  assert.deepEqual(errors,[],'Browser exceptions: '+errors.join('\n'));
  console.log('PASS - three-floor campaign transitions:',JSON.stringify(floors));
  console.log('PASS - playable ArcMap FPS browser test:',JSON.stringify(summary));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
