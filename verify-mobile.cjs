const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),{pathToFileURL}=require('url'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const context=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}),p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.join(__dirname,'index.html')).href);await p.waitForFunction(()=>window.MuseumViewer?.surfaceStats);
  const cdp=await context.newCDPSession(p),point=(id,x,y)=>({id,x:Math.round(x),y:Math.round(y)}),touch=async(type,points)=>{await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});await p.evaluate(()=>new Promise(requestAnimationFrame));};
  const pose=()=>p.evaluate(()=>({yaw:MuseumViewer.controls.state.yaw,pitch:MuseumViewer.controls.state.pitch,distance:MuseumViewer.controls.state.distance,target:[...MuseumViewer.controls.state.target],eye:MuseumViewer.controls.camera().eye,fov:MuseumViewer.controls.state.fov}));
  const equal=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-7);
  assert(await p.locator('.mobile-hud').isVisible());assert(!await p.locator('.mobile-stick').isVisible());
  const a=await pose();await touch('touchStart',[point(1,75,350)]);await touch('touchMove',[point(1,113,390)]);await touch('touchEnd',[]);const r=await pose();assert(r.yaw<a.yaw&&r.pitch>a.pitch,'One-finger orbit');
  await touch('touchStart',[point(1,83,350)]);await touch('touchStart',[point(1,83,350),point(2,188,350)]);
  const panStart=await pose();await touch('touchMove',[point(1,98,365),point(2,203,365)]);const panEnd=await pose();assert(!equal(panStart.target,panEnd.target),'Two-finger pan');assert(Math.abs(panStart.distance-panEnd.distance)<1e-7);
  await touch('touchMove',[point(1,68,365),point(2,233,365)]);assert((await pose()).distance<panEnd.distance,'Pinch zoom');await touch('touchEnd',[]);
  await p.locator('[data-navigation="interior"]').tap();assert(await p.evaluate(()=>MuseumViewer.controls.state.mode==='interior'&&!document.pointerLockElement),'Touch mode must not lock cursor');
  await p.evaluate(()=>{const q=MuseumGeometry.point([700,540]);MuseumViewer.controls.setMode('interior',[q[0],1.575,q[1]]);});await p.waitForTimeout(80);
  const stick=await p.locator('.mobile-stick').boundingBox(),sx=stick.x+stick.width/2,sy=stick.y+stick.height/2;
  const before=await pose();await touch('touchStart',[point(1,sx,sy)]);await touch('touchMove',[point(1,sx,sy-30)]);
  await touch('touchStart',[point(1,sx,sy-30),point(2,203,350)]);await touch('touchMove',[point(1,sx,sy-30),point(2,236,370)]);await p.waitForTimeout(220);
  const moving=await pose();assert(!equal(before.eye,moving.eye)&&moving.yaw<before.yaw,'Walk and look simultaneously');assert.equal(before.eye[1],moving.eye[1]);assert(Math.abs(moving.pitch)<=Math.PI/4);
  await touch('touchEnd',[]);const stop=await pose();await p.waitForTimeout(140);assert(equal(stop.eye,(await pose()).eye),'Release stops movement');
  const fov=stop.fov;
  await touch('touchStart',[point(1,160,350)]);await touch('touchStart',[point(1,160,350),point(2,240,350)]);
  const pinchStart=await pose();await touch('touchMove',[point(1,145,350),point(2,260,350)]);await touch('touchEnd',[]);
  const pinchEnd=await pose();assert(pinchEnd.fov<fov,'Interior pinch FOV zoom');assert(equal(pinchStart.eye,pinchEnd.eye)&&pinchStart.yaw===pinchEnd.yaw&&pinchStart.pitch===pinchEnd.pitch,'Pinch must preserve position and view direction');
  assert.equal(await p.locator('.mobile-zoom,[data-touch]').count(),0,'No redundant zoom buttons');
  await touch('touchStart',[point(1,sx,sy-30)]);await p.waitForTimeout(80);await touch('touchCancel',[]);const cancelled=await pose();await p.waitForTimeout(100);assert(equal(cancelled.eye,(await pose()).eye),'Cancelled touch stops movement');
  await p.screenshot({path:path.join(__dirname,'preview-mobile-interior.png')});
  await p.locator('[data-navigation="plan"]').tap();assert(await p.evaluate(()=>MuseumViewer.controls.state.orthographic));assert.equal(await p.locator('aside button').count(),3);assert.equal(await p.locator('#exhibit-info').textContent(),'');
  await p.locator('[data-navigation="orbit"]').tap();assert(await p.evaluate(()=>MuseumViewer.controls.state.mode==='exterior'));await p.screenshot({path:path.join(__dirname,'preview-mobile-exterior.png')});
  await p.setViewportSize({width:844,height:390});await p.waitForTimeout(100);assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'Landscape overflow');await p.screenshot({path:path.join(__dirname,'preview-mobile-landscape.png')});
  assert(!await p.evaluate(()=>document.documentElement.scrollHeight>innerHeight),'Landscape page scroll');assert.equal(await p.evaluate(()=>MuseumViewer.gl.getError()),0);assert.deepEqual(errors,[]);
  console.log('PASS mobile orbit, two-finger pan/pinch, simultaneous joystick/look, release/cancel, FOV, three-mode buttons and empty exhibit panel, portrait/landscape, no pointer lock or WebGL errors');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
