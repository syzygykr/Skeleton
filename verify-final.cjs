const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),{pathToFileURL}=require('url'),path=require('path'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const final=path.resolve(__dirname,'../Final'),prefix=pathToFileURL(final+path.sep).href;
 for(const mobile of [false,true]){
  const ctx=await b.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:960},isMobile:mobile,hasTouch:mobile}),p=await ctx.newPage(),errors=[],files=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>errors.push(r.url()+' '+r.failure()?.errorText));p.on('request',r=>{if(r.url().startsWith('file:'))files.push(r.url());});
  await p.goto(pathToFileURL(path.join(final,'index.html')).href);await p.waitForFunction(()=>MuseumViewer?.woodReady&&MuseumViewer.surfaceStats);
  await p.locator('[data-navigation="plan"]').click();assert(await p.evaluate(()=>MuseumViewer.controls.state.orthographic));
  await p.locator('[data-navigation="orbit"]').click();await p.locator('[data-navigation="interior"]').click();assert.equal(await p.evaluate(()=>MuseumViewer.controls.state.mode),'interior');
  if(mobile){const toggle=p.locator('.mobile-panel-toggle');await toggle.tap();assert(!await p.locator('aside').isVisible());await toggle.tap();assert(await p.locator('aside').isVisible());}
  assert(files.every(u=>u.startsWith(prefix)),'External file dependency');assert.equal(await p.evaluate(()=>MuseumViewer.gl.getError()),0);assert.deepEqual(errors,[]);console.log(JSON.stringify({mobile,localFiles:files.length,allInsideFinal:true,textureLoaded:true,webgl:'ok',modes:'ok'}));await ctx.close();
 }
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
