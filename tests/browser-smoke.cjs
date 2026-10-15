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
  await page.waitForTimeout(500);
  assert.deepEqual(errors,[],'Browser exceptions: '+errors.join('\n'));
  console.log('PASS - playable ArcMap FPS browser test:',JSON.stringify(summary));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
