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
    const info=await page.evaluate(()=>({floors:MuseumViewer.model.floors.length,parts:MuseumViewer.model.parts.length,glError:MuseumViewer.gl.getError()}));
    if(info.glError!==0)throw Error('WebGL error '+info.glError);
    await page.screenshot({path:path.join(__dirname,'preview.png')});
    await page.locator('[data-view="top"]').click();await page.waitForTimeout(100);
    await page.screenshot({path:path.join(__dirname,'preview-top.png')});
    for(const name of ['front','left','right']){await page.locator(`[data-view="${name}"]`).click();await page.waitForTimeout(50);}
    await page.locator('#low').check();await page.locator('#walls').uncheck();await page.locator('#frames').uncheck();await page.locator('#names').uncheck();
    await page.locator('#rooms button').nth(4).click();
    await page.locator('#cv').focus();await page.keyboard.press('Home');
    const state=await page.evaluate(()=>({target:MuseumViewer.controls.state.target,distance:MuseumViewer.controls.state.distance}));
    if(!state.target.every(Number.isFinite)||!Number.isFinite(state.distance))throw Error('Invalid camera');
    await page.setViewportSize({width:640,height:850});await page.waitForTimeout(100);
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
    if(errors.length)throw Error(errors.join('\n'));
    console.log(JSON.stringify({ok:true,...info,checks:['WebGL2','geometry','five views','display toggles','room focus','Home','mobile width','no page errors']}));
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
