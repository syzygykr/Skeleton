const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),{pathToFileURL}=require('url'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  for(const mobile of [false,true]){
   const ctx=await b.newContext({isMobile:mobile,hasTouch:mobile,viewport:{width:1440,height:960}}),p=await ctx.newPage(),errors=[];
   p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.join(__dirname,'index.html')).href);await p.waitForFunction(()=>window.MuseumViewer?.surfaceStats);
   for(const [width,height] of [[1440,960],[1920,1080],[768,1024],[390,844],[844,390],[320,568]]){
    await p.setViewportSize({width,height});await p.evaluate(()=>new Promise(requestAnimationFrame));
    const layout=await p.evaluate(()=>{const stage=document.querySelector('.stage').getBoundingClientRect(),panel=document.querySelector('aside').getBoundingClientRect();return {ratio:panel.width/innerWidth,stage:stage.width/innerWidth,right:panel.right,left:panel.left,stageRight:stage.right,top:panel.top,bottom:panel.bottom,overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,buttons:[...document.querySelectorAll('.mode-nav button')].map(b=>{const r=b.getBoundingClientRect();return {left:r.left,right:r.right,height:r.height};})};});
    assert(Math.abs(layout.ratio-.25)<.002,JSON.stringify({mobile,width,layout}));assert(Math.abs(layout.stage-.75)<.002);assert(Math.abs(layout.stageRight-layout.left)<1);assert(Math.abs(layout.right-width)<1);assert.equal(layout.top,0);assert(Math.abs(layout.bottom-height)<1);assert(!layout.overflow);
    assert(layout.buttons.every(r=>r.left>=layout.left&&r.right<=layout.right&&r.height>=44));
    if(mobile){
     const toggle=p.locator('.mobile-panel-toggle');assert(await toggle.isVisible());
     const bounds=await toggle.boundingBox();assert(Math.abs(bounds.x+bounds.width-width)<1);assert(Math.abs(bounds.y+bounds.height/2-height/2)<1);assert(bounds.width>=44);
     const before=await p.evaluate(()=>({camera:MuseumViewer.controls.camera(),mode:MuseumViewer.controls.state.mode}));
     await toggle.tap();assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert(!await p.locator('aside').isVisible());
     await p.evaluate(()=>new Promise(requestAnimationFrame));
     const full=await p.locator('.stage').boundingBox();assert(Math.abs(full.width-width)<1);assert(await toggle.isVisible());
     assert.deepEqual(await p.evaluate(()=>({camera:MuseumViewer.controls.camera(),mode:MuseumViewer.controls.state.mode})),before);
     if(width===390)await p.screenshot({path:path.join(__dirname,'preview-mobile-panel-hidden.png')});
     await toggle.tap();assert.equal(await toggle.getAttribute('aria-expanded'),'true');assert(await p.locator('aside').isVisible());
     const restored=await p.locator('aside').boundingBox();assert(Math.abs(restored.width/width-.25)<.002);
    }else assert(!await p.locator('.mobile-panel-toggle').isVisible());
    if((mobile&&width===390)||(!mobile&&width===1440))await p.screenshot({path:path.join(__dirname,mobile?'preview-layout-mobile.png':'preview-layout-pc.png')});
   }
   assert.deepEqual(errors,[]);assert.equal(await p.evaluate(()=>MuseumViewer.gl.getError()),0);await ctx.close();
  }console.log('PASS 75:25 desktop/mobile layout at 6 viewport sizes, right alignment, mobile panel hide/restore and stable camera, button bounds, no page overflow or WebGL errors');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
