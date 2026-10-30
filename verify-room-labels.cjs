const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),{pathToFileURL}=require('url'),path=require('path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:960},hasTouch:mobile,isMobile:mobile}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.join(__dirname,'index.html')).href);await page.waitForFunction(()=>window.MuseumViewer?.surfaceStats);
  const rooms=await page.evaluate(()=>MuseumLayout.rooms.map(r=>({id:r.id,name:r.name})));
  assert.equal(rooms.find(r=>r.id==='bow').name,'중앙 로비');assert.equal(rooms.find(r=>r.id==='video').name,'영상실');assert.equal(rooms.find(r=>r.id==='long').name,'주 전시실');assert.equal(rooms.find(r=>r.id==='link').name,'중앙 복도');
  for(const room of rooms){
   await page.evaluate(id=>{const r=MuseumLayout.rooms.find(r=>r.id===id),pts=r.polygon.map(MuseumGeometry.point);MuseumViewer.controls.setView({target:[pts.reduce((s,p)=>s+p[0],0)/pts.length,.5,pts.reduce((s,p)=>s+p[1],0)/pts.length],distance:12,yaw:0,pitch:.9});},room.id);
   await page.evaluate(()=>new Promise(requestAnimationFrame));
   const label=page.locator(`[data-room="${room.id}"]`);if(mobile)await label.tap();else await label.click();
   await page.waitForFunction(()=>MuseumViewer.controls.state.mode==='interior');
   if(room.id==='long'){
    await page.waitForTimeout(120);
    const mid=await page.evaluate(()=>({render:MuseumViewer.camera.eye,end:MuseumViewer.controls.camera().eye,active:MuseumViewer.controls.state.transitioning}));
    assert(mid.active&&mid.render.some((v,i)=>Math.abs(v-mid.end[i])>.01),'Room entry must animate before arriving');
   }
   await page.waitForFunction(()=>!MuseumViewer.controls.state.transitioning);
   const result=await page.evaluate(id=>{const r=MuseumLayout.rooms.find(r=>r.id===id),p=MuseumGeometry.point(r.entryAt);return {eye:MuseumViewer.controls.camera().eye,expected:[p[0],MuseumViewer.controls.state.minEyeHeight,p[1]],locked:document.pointerLockElement===document.querySelector('#cv')};},room.id);
   assert(result.eye.every((v,i)=>Math.abs(v-result.expected[i])<1e-8),'Wrong room destination '+room.id);assert.equal(await page.locator('[data-navigation="interior"]').getAttribute('aria-pressed'),'true');
   if(room.id==='outdoor'){assert(await page.locator('.room-label:not([hidden])').count()>0,'Interior room labels must remain visible');await page.screenshot({path:path.join(__dirname,mobile?'preview-interior-labels-mobile.png':'preview-interior-labels.png')});}
   if(!mobile){assert(!await page.evaluate(()=>!!document.pointerLockElement));await page.keyboard.press('Space');await page.waitForFunction(()=>!document.pointerLockElement);}else await page.locator('[data-navigation="orbit"]').tap();
  }
  await page.locator('[data-navigation="plan"]').click();await page.evaluate(()=>new Promise(requestAnimationFrame));assert.equal(await page.locator('.room-label:not(:disabled)').count(),0);
  await page.screenshot({path:path.join(__dirname,mobile?'preview-room-labels-mobile.png':'preview-room-labels.png')});assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS renamed labels, nine safe destinations via PC clicks/mobile taps, PC pointer lock, active mode and plan-view isolation');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
