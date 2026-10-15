/* ArcMap Office Rampage v0.3: independent synthesized, layered game firearm audio.
   User-gesture unlocked Web Audio API; all sounds created locally with no downloads.
   Synthesized sound design, NOT a licensed recording of actual weapons. */
export class WeaponAudio {
 constructor(){this.ctx=null;this.noiseBuffer=null;this.fireLoop=null;this.motorLoop=null;this.loopType=null;this.lastFire=-10;this.recentShots=0}
 unlock(){
  const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
  if(!this.ctx){this.ctx=new A();const c=this.ctx,b=c.createBuffer(1,c.sampleRate*2,c.sampleRate),samples=b.getChannelData(0);
    for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1);
    this.noiseBuffer=b;
  }
  if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
 }
 envelope(start,attack,release,level=1){
  if(!this.ctx)return null;
  const c=this.ctx,g=c.createGain(),t=c.currentTime;
  g.gain.setValueAtTime(.0001,t);
  g.gain.exponentialRampToValueAtTime(Math.max(.00011,level),t+Math.max(.002,attack));
  g.gain.exponentialRampToValueAtTime(.0001,t+attack+release);
  return g;
 }
 noise(d=.14,vol=.07,lowpass=7000,highpass=70){
  if(!this.ctx)return;
  const c=this.ctx,n=c.createBufferSource();n.buffer=this.noiseBuffer;
  const low=c.createBiquadFilter();low.type='lowpass';low.frequency.value=lowpass;
  const high=c.createBiquadFilter();high.type='highpass';high.frequency.value=highpass;
  const out=this.envelope(0,.002,d,vol);
  n.connect(high).connect(low).connect(out).connect(c.destination);
  n.start(c.currentTime,Math.random());n.stop(c.currentTime+d+.04);
 }
 tone(f,d=.13,shape='sawtooth',vol=.07,end=null){
  if(!this.ctx)return;const c=this.ctx,t=c.currentTime,o=c.createOscillator();
  o.type=shape;o.frequency.setValueAtTime(Math.max(f,30),t);
  if(end)o.frequency.exponentialRampToValueAtTime(Math.max(30,end),t+d);
  const g=this.envelope(t,.005,Math.max(.01,d-.005),vol);
  o.connect(g).connect(c.destination);o.start(t);o.stop(t+d+.035);
 }
 boom(f=.16,d=.17,vol=.22){
  if(!this.ctx)return;
  const c=this.ctx,t=c.currentTime,o=c.createOscillator(),out=c.createGain();
  o.type='sine';o.frequency.setValueAtTime(Math.max(50,120*f*7),t);
  o.frequency.exponentialRampToValueAtTime(Math.max(32,200*f),t+d);
  out.gain.setValueAtTime(Math.max(.0001,vol),t);out.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(out).connect(c.destination);o.start(t);o.stop(t+d+.03);
 }
 fire(weapon){
  if(!this.ctx)return;
  switch(weapon){
   case 'rifle':
    this.noise(.12,.19,5500,140);this.noise(.065,.16,9000,1800);this.boom(.26,.21,.21);
    this.tone(800,.022,'triangle',.014,200);break;
   case 'smg':
    this.noise(.085,.15,7500,550);this.noise(.035,.09,11000,2200);
    this.boom(.35,.095,.13);this.tone(1250,.018,'triangle',.016,490);break;
   case 'shotgun':
    this.noise(.32,.26,4100,65);this.noise(.19,.24,8500,1450);
    this.boom(.17,.36,.36);this.tone(340,.11,'square',.017,70);break;
   case 'minigun':
    this.noise(.060,.12,5700,380);this.noise(.027,.095,10000,1900);
    this.boom(.38,.07,.10);break;
   case 'flamethrower': // sustained loop drives the roar
    break;
   case 'laser':
    this.tone(680,.15,'sawtooth',.078,1800);
    this.tone(1400,.10,'sine',.047,550);
    this.noise(.08,.03,6300,2800);break;
   case 'cannon':
    this.tone(190,.37,'sawtooth',.16,85);
    this.tone(730,.34,'triangle',.105,1900);
    this.boom(.14,.43,.28);this.noise(.31,.074,4500,300);break;
  }
  this.recentShots++;
 }
 createLoop(weapon){
  if(!this.ctx||!this.noiseBuffer)return;
  const c=this.ctx,t=c.currentTime;
  const source=c.createBufferSource();source.buffer=this.noiseBuffer;source.loop=true;
  const low=c.createBiquadFilter();low.type='lowpass';low.frequency.value=weapon==='flamethrower'?1250:2900;
  const high=c.createBiquadFilter();high.type='highpass';high.frequency.value=weapon==='flamethrower'?80:340;
  const gain=c.createGain();gain.gain.value=0;
  source.connect(high).connect(low).connect(gain).connect(c.destination);source.start();
  gain.gain.setTargetAtTime(weapon==='flamethrower'?.13:.06,t,.06);
  let rotor=null;
  if(weapon==='minigun'){
   const tone=c.createOscillator(),rg=c.createGain();tone.type='sawtooth';
   tone.frequency.setValueAtTime(55,t);tone.frequency.linearRampToValueAtTime(120,t+.20);
   rg.gain.setValueAtTime(0,t);rg.gain.setTargetAtTime(.027,t,.12);
   tone.connect(rg).connect(c.destination);tone.start();rotor={tone,gain:rg};
  }
  this.fireLoop={source,gain,rotor,low,high};this.loopType=weapon;
 }
 stopLoop(){
  if(!this.ctx||!this.fireLoop)return;
  const item=this.fireLoop;this.fireLoop=null;this.loopType=null;
  const t=this.ctx.currentTime;
  item.gain.gain.cancelScheduledValues(t);item.gain.gain.setTargetAtTime(0,t,.045);
  if(item.rotor){item.rotor.gain.gain.setTargetAtTime(0,t,.04);item.rotor.tone.stop(t+.24)}
  item.source.stop(t+.24);
 }
 update(weapon,pressed,phase){
  if(!this.ctx)return;
  const desired=phase==='running'&&pressed&&(weapon==='minigun'||weapon==='flamethrower')?weapon:null;
  if(desired!==this.loopType){this.stopLoop();if(desired)this.createLoop(desired)}
 }
 stop(){this.stopLoop()}
 enemy(){this.tone(280,.25,'sawtooth',.044,120)}
 hurt(){this.boom(.4,.19,.14)}
 click(){this.tone(730,.07,'triangle',.034,350)}
}
