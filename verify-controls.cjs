const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
class Target{constructor(){this.handlers={};}addEventListener(k,f){(this.handlers[k]??=[]).push(f);}fire(k,e={}){for(const f of this.handlers[k]||[])f({preventDefault(){},...e});}}
const win=new Target(),doc=new Target(),canvas=new Target();canvas.focus=()=>{};canvas.clientHeight=800;
const ctx={window:win,document:doc,matchMedia:()=>({matches:false}),Math};vm.createContext(ctx);
for(const file of ['layout.js','details.js','geometry.js','collision.js','controls.js']){vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),ctx);Object.assign(ctx,win);}
const collision=win.MuseumCollision(win.MuseumGeometry.build(),win.MuseumLayout),c=win.MuseumControls(canvas,{move:collision.move,spawn:collision.spawn});
const press=code=>canvas.fire('keydown',{code}),release=code=>win.fire('keyup',{code}),step=n=>{for(let i=0;i<n;i++)c.update(1/60);},equal=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-8);
c.setView({target:[0,.5,0],yaw:0,pitch:.4,distance:20});const target=[...c.state.target],outsideEye=c.camera().eye;press('ArrowRight');step(60);release('ArrowRight');assert(equal(c.state.target,target));assert(!equal(c.camera().eye,outsideEye),'Exterior orbits target');
press('KeyW');press('ArrowUp');const still=[...c.state.target];step(120);release('ArrowUp');assert(equal(c.state.target,still),'Rotation priority');assert.equal(c.state.orthographic,true);release('KeyW');
press('ArrowDown');c.update(1e-8);release('ArrowDown');assert.equal(c.state.orthographic,false);
c.setMode('interior');assert.equal(c.state.pitch,0);assert.equal(c.state.orthographic,false);assert.equal(c.camera().eye[1],1.575);const indoorEye=c.camera().eye;
press('ArrowRight');step(150);release('ArrowRight');press('ArrowUp');step(180);release('ArrowUp');assert(equal(c.camera().eye,indoorEye),'Interior rotation is stationary');assert.equal(c.state.pitch,-Math.PI/3,'Look up limit');assert.equal(c.state.orthographic,false,'Interior always perspective');
press('ArrowDown');step(180);release('ArrowDown');assert.equal(c.state.pitch,Math.PI/3,'Look down limit');assert.equal(c.state.orthographic,false);
const beforeZoom=c.camera().eye;canvas.fire('wheel',{deltaY:-100,deltaMode:0});assert(equal(c.camera().eye,beforeZoom),'Indoor zoom cannot pass walls');assert(c.state.fov<45);
const p=win.MuseumGeometry.point([860,320]);c.setMode('interior',[p[0],1.575,p[1]]);c.state.yaw=Math.PI/2;press('KeyW');step(600);release('KeyW');assert(c.camera().eye[0]>win.MuseumGeometry.point([840,320])[0],'Actual wall blocks interior motion');
const open=win.MuseumGeometry.point([900,240]);c.setMode('interior',[open[0],1.575,open[1]]);c.state.yaw=Math.PI;press('KeyW');step(90);release('KeyW');assert(c.camera().eye[2]>win.MuseumGeometry.point([900,256])[1],'Open doorway permits passage');
const block={position:[0,1.4,0],size:[10,2.8,.16],yaw:0,group:'wall'};const sweep=win.MuseumCollision({parts:[block]},{solidWalls:[],envelope:win.MuseumLayout.envelope});assert(sweep.move([0,1.575,2],[0,1.575,-100])[2]>.16,'No tunneling');const slide=sweep.move([0,1.575,1],[2,1.575,-2]);assert(slide[0]>1.9&&slide[2]>.16,'Slide along wall');
c.setView({target:[0,.5,0],yaw:0,pitch:0,distance:20});press('KeyW');step(60);release('KeyW');assert(Math.abs(c.state.target[2]+13.5)<1e-8,'Exterior 1.5x speed');
press('ArrowRight');step(1200);release('ArrowRight');assert(c.state.yaw>Math.PI*4,'Unlimited yaw');win.fire('blur');
console.log('PASS exterior orbit/free motion, interior stationary rotation/height/horizontal entry, rotation priority, top projection, doorway, swept wall collision and sliding, 1.5x exterior speed, unlimited yaw');

c.setMode('interior');c.state.pitch=.2;const yaw=c.state.yaw;press('ArrowRight');step(1);release('ArrowRight');assert(c.state.yaw<yaw,'Interior right direction');press('ArrowLeft');step(1);release('ArrowLeft');assert(Math.abs(c.state.yaw-yaw)<1e-8,'Interior left direction');
const snapshot={eye:c.camera().eye,yaw:c.state.yaw,pitch:c.state.pitch,fov:c.state.fov};win.fire('keydown',{code:'Space'});assert.equal(c.state.mode,'exterior');win.fire('keydown',{code:'Space',repeat:true});assert.equal(c.state.mode,'exterior','Ignore autorepeat');win.fire('keydown',{code:'Space'});assert.equal(c.state.mode,'interior');assert(equal(c.camera().eye,snapshot.eye));assert.equal(c.state.yaw,snapshot.yaw);assert.equal(c.state.pitch,snapshot.pitch);assert.equal(c.state.fov,snapshot.fov);
c.setView({target:[0,0,0]});c.setMode('interior');assert(equal(c.camera().eye,snapshot.eye),'View preset must preserve interior snapshot');
console.log('PASS interior arrow directions, +/-60 pitch limits, always perspective, Space toggle/repeat suppression, full interior pose restoration');

const run=()=>{const t=new Target();t.focus=()=>{};return {t,c:win.MuseumControls(t)};};
const straight=run();straight.c.setMode('interior',[0,1.575,0]);straight.c.state.yaw=0;straight.t.fire('keydown',{code:'KeyW'});for(let i=0;i<60;i++)straight.c.update(1/60);assert(Math.abs(straight.c.camera().eye[2]+3)<1e-8,'Interior speed must be 3 units/sec');
const combined=run();combined.c.setMode('interior',[0,1.575,0]);combined.c.state.yaw=0;combined.t.fire('keydown',{code:'KeyW'});combined.t.fire('keydown',{code:'ArrowRight'});for(let i=0;i<60;i++)combined.c.update(1/60);assert(combined.c.state.yaw<0,'Rotate while walking');assert(combined.c.camera().eye[0]>0&&combined.c.camera().eye[2]<0,'Move while rotating');assert.equal(combined.c.camera().eye[1],1.575);
console.log('PASS simultaneous interior walking/turning and 2x movement speed');

const fixture={position:[0,.35,0],size:[2,.7,1],yaw:0,group:'displays'};
const furniture=win.MuseumCollision({parts:[fixture]},{solidWalls:[],envelope:win.MuseumLayout.envelope});
assert(furniture.move([0,1.575,2],[0,1.575,-10])[2]>.5,'Low display blocks body');assert(furniture.blocked([0,1.575,0]),'Spawn cannot be inside display');
const overhead=win.MuseumCollision({parts:[{...fixture,position:[0,2.5,0],size:[2,.2,1],group:'details'}]},{solidWalls:[],envelope:win.MuseumLayout.envelope});assert.equal(overhead.move([0,1.575,2],[0,1.575,-2])[2],-2,'Overhead details remain passable');
const model=win.MuseumGeometry.build(),all=win.MuseumCollision(model,win.MuseumLayout),table=model.parts.find(p=>p.id==='gallery-table-1-deck');
assert(all.blocked([table.position[0],1.575,table.position[2]]),'Actual table blocks walking beneath deck');
const top=model.parts.find(p=>p.id==='maru-worktop');let x=0,z=0;for(let i=0;i<top.mesh.pos.length;i+=3){x+=top.mesh.pos[i];z+=top.mesh.pos[i+2];}assert(all.blocked([x/(top.mesh.pos.length/3),1.575,z/(top.mesh.pos.length/3)]),'Rounded mesh worktop collision');
console.log('PASS low displays, real gallery table, custom worktop, spawn exclusion and overhead clearance');
