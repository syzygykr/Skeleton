// 개발용: node verify.cjs. Playwright는 검증 환경에만 필요하며 웹페이지 실행 의존성은 없다.
const {pathToFileURL}=require('url');
const path=require('path');
async function main(){
  const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
  const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(path.join(__dirname,'index.html')).href);
    await page.waitForFunction(()=>window.MuseumViewer||!document.querySelector('#error').hidden);
    if(await page.locator('#error').isVisible())throw Error(await page.locator('#error').textContent());
    await page.waitForTimeout(250);
    await page.locator('#cv').focus();
    const initial=await page.evaluate(()=>({target:[...MuseumViewer.controls.state.target],yaw:MuseumViewer.controls.state.yaw}));
    await page.keyboard.down('ArrowRight');await page.keyboard.down('w');await page.waitForTimeout(150);
    const rotating=await page.evaluate(()=>({target:[...MuseumViewer.controls.state.target],yaw:MuseumViewer.controls.state.yaw}));
    if(rotating.target.some((v,i)=>v!==initial.target[i])||rotating.yaw<=initial.yaw)throw Error('PC rotation priority');
    await page.keyboard.up('ArrowRight');await page.waitForTimeout(150);await page.keyboard.up('w');
    const moved=await page.evaluate(()=>MuseumViewer.controls.state.target);
    if(moved.every((v,i)=>v===rotating.target[i]))throw Error('PC WASD movement');
    await page.keyboard.press('Home');await page.waitForTimeout(50);
    await page.locator('[data-mode="interior"]').click();
    const inside=await page.evaluate(()=>({mode:MuseumViewer.controls.state.mode,pitch:MuseumViewer.controls.state.pitch,eye:MuseumViewer.controls.camera().eye}));
    if(inside.mode!=='interior'||inside.pitch!==0||Math.abs(inside.eye[1]-1.575)>1e-8)throw Error('Interior entry');
    await page.locator('#cv').focus();await page.keyboard.down('ArrowRight');await page.waitForTimeout(150);await page.keyboard.up('ArrowRight');
    const eyeAfter=await page.evaluate(()=>MuseumViewer.controls.camera().eye);
    if(eyeAfter.some((v,i)=>Math.abs(v-inside.eye[i])>1e-8))throw Error('Interior camera position changed during rotation');
    await page.screenshot({path:path.join(__dirname,'preview-interior.png')});
    const savedPose=await page.evaluate(()=>({eye:MuseumViewer.controls.camera().eye,yaw:MuseumViewer.controls.state.yaw,pitch:MuseumViewer.controls.state.pitch}));
    await page.keyboard.press('Space');
    if(await page.evaluate(()=>MuseumViewer.controls.state.mode)!=='exterior')throw Error('Space exterior toggle');
    await page.keyboard.press('Space');
    const restored=await page.evaluate(()=>({mode:MuseumViewer.controls.state.mode,eye:MuseumViewer.controls.camera().eye,yaw:MuseumViewer.controls.state.yaw,pitch:MuseumViewer.controls.state.pitch}));
    if(restored.mode!=='interior'||restored.eye.some((v,i)=>Math.abs(v-savedPose.eye[i])>1e-8)||restored.yaw!==savedPose.yaw||restored.pitch!==savedPose.pitch)throw Error('Space pose restoration');
    await page.locator('[data-mode="exterior"]').click();
    if(await page.evaluate(()=>MuseumViewer.controls.state.mode)!=='exterior')throw Error('Exterior mode restore');
    const info=await page.evaluate(()=>({floors:MuseumViewer.model.floors.filter(f=>f.group==='floor').length,ceilings:MuseumViewer.model.floors.filter(f=>f.group==='ceiling').length,parts:MuseumViewer.model.parts.length,glError:MuseumViewer.gl.getError()}));
    if(info.glError!==0)throw Error('WebGL error '+info.glError);
    await page.screenshot({path:path.join(__dirname,'preview.png')});
    await page.locator('[data-view="top"]').click();await page.waitForTimeout(100);
    await page.screenshot({path:path.join(__dirname,'preview-top.png')});
    await page.locator('[data-view="gallery"]').click();await page.waitForTimeout(100);
    await page.screenshot({path:path.join(__dirname,'preview-gallery.png')});
    await page.locator('[data-view="immersive"]').click();await page.waitForTimeout(100);
    await page.screenshot({path:path.join(__dirname,'preview-immersive.png')});
    await page.locator('[data-view="right"]').click();
    await page.locator('#rooms button').nth(0).click();
    await page.evaluate(()=>{MuseumViewer.controls.state.target=[(400-650)*.035,.8,(230-340)*.035];MuseumViewer.controls.state.distance=13;});
    await page.waitForTimeout(100);
    await page.screenshot({path:path.join(__dirname,'preview-transition.png')});
    await page.locator('[data-view="top"]').click();
    await page.locator('#rooms button').nth(3).click();await page.waitForTimeout(100);
    await page.screenshot({path:path.join(__dirname,'preview-entrance.png')});
    await page.evaluate(()=>{MuseumViewer.controls.state.target=[(294-650)*.035,.5,(400-340)*.035];MuseumViewer.controls.state.distance=22;});
    await page.waitForTimeout(100);
    await page.screenshot({path:path.join(__dirname,'preview-bow-details.png')});
    await page.locator('#rooms button').nth(6).click();await page.waitForTimeout(100);
    await page.screenshot({path:path.join(__dirname,'preview-donated.png')});
    await page.locator('[data-view="partition"]').click();await page.waitForTimeout(100);
    await page.screenshot({path:path.join(__dirname,'preview-partition.png')});
    for(const name of ['front','left','right']){await page.locator(`[data-view="${name}"]`).click();await page.waitForTimeout(50);}
    await page.locator('#ceiling').check();
    await page.screenshot({path:path.join(__dirname,'preview-ceilings.png')});
    await page.locator('#ceiling').uncheck();
    await page.locator('#displays').uncheck();await page.locator('#displays').check();await page.locator('#details').uncheck();await page.locator('#details').check();
    await page.locator('#structure').uncheck();await page.locator('#structure').check();
    await page.locator('#glass').uncheck();await page.locator('#glass').check();
    const fullMatrices=await page.evaluate(()=>MuseumViewer.model.parts.map(p=>Array.from(MuseumViewer.partMatrix(p))));
    await page.locator('#low').check();
    await page.evaluate(full=>{
      MuseumViewer.model.parts.forEach((p,i)=>{const after=Array.from(MuseumViewer.partMatrix(p)),changed=after.some((v,k)=>Math.abs(v-full[i][k])>1e-6);if(p.group==='wall'){if(!changed)throw Error('Wall not lowered '+p.id);}else if(changed)throw Error('Non-wall moved '+p.id);});
    },fullMatrices);
    await page.screenshot({path:path.join(__dirname,'preview-low.png')});
    await page.locator('#walls').uncheck();await page.locator('#frames').uncheck();await page.locator('#names').uncheck();
    await page.locator('#rooms button').nth(4).click();
    await page.locator('#cv').focus();await page.keyboard.press('Home');
    const state=await page.evaluate(()=>({target:MuseumViewer.controls.state.target,distance:MuseumViewer.controls.state.distance}));
    if(!state.target.every(Number.isFinite)||!Number.isFinite(state.distance))throw Error('Invalid camera');
    await page.setViewportSize({width:640,height:850});await page.waitForTimeout(100);
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
    if(errors.length)throw Error(errors.join('\n'));
    if(await page.evaluate(()=>MuseumViewer.gl.getError())!==0)throw Error('WebGL error after controls');
    console.log(JSON.stringify({ok:true,...info,checks:['WebGL2','geometry','six views including partition','ceiling/structure/glass toggles','display toggles','room focus','Home','mobile width','no page errors']}));
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});


