const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'layout.js'),'utf8'),ctx);ctx.MuseumLayout=ctx.window.MuseumLayout;
vm.runInContext(fs.readFileSync(path.join(__dirname,'details.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'geometry.js'),'utf8'),ctx);
const data=ctx.MuseumLayout,model=ctx.window.MuseumGeometry.build(),ids=new Set();
const immersivePolygon=data.rooms.find(r=>r.id==='immersive').polygon;
assert.equal(immersivePolygon.length,4,'Immersive room must be rectangular');
assert.equal(data.shell.find(w=>w.id==='shell-projection').a[0],1056,'Expanded projection wall');
assert(data.floor.polygon.some(p=>p[0]===1056&&p[1]===24),'Expanded immersive floor corner');
assert.deepEqual(Array.from(data.shell.find(w=>w.id==='shell-east-door').b),[1120,256]);
assert(!data.floor.polygon.some(p=>p[0]===980&&p[1]===414),'Removed rear pocket remains in floor');
assert.equal(data.wallCases.length,1,'Only left end-wall hanging case remains');
assert(!data.wallCases.some(c=>c.id==='gallery-hanging-case-690'));
const large=data.glassCases.find(c=>c.id==='gallery-end-showcase');assert.equal(large.top,data.columns.find(c=>c.id==='gallery-pier-3').height);assert.equal(large.depth,1.15);assert.equal(model.parts.filter(p=>p.id.startsWith(large.id+'-glass-')).length,4);
assert((818-690)*data.scale-.44-large.depth>2.8,'Preserve corridor width');
const archCase=data.displays.find(d=>d.id==='arch-corridor-case');
assert(archCase&&archCase.type==='low'&&archCase.size[1]===.85,'Arch case must have floor-standing timber base and low glazing');
assert(!data.wallCases.some(w=>w.id==='gallery-hanging-case-548'),'No cabinet on middle wall');
for(const t of data.galleryTables){
 for(const endpoint of [t.a,t.b]){
  const wall=data.walls.find(w=>w.id.startsWith('gallery-display-pier-')&&Math.abs(Math.abs(w.a[0]-endpoint[0])*data.scale-w.thickness/2)<1e-8);
  assert(wall,'Table ends must meet perpendicular walls');
  assert.equal((t.b[0]-t.a[0])*(wall.b[0]-wall.a[0])+(t.b[1]-t.a[1])*(wall.b[1]-wall.a[1]),0,'Wall must be perpendicular to table');
 }
}
for(const p of model.parts){assert(!ids.has(p.id),'Duplicate '+p.id);ids.add(p.id);assert([...p.position,...p.size,p.yaw].every(Number.isFinite),p.id);assert(p.size.every(v=>v>0),p.id);}
for(const f of model.floors){
  assert.equal(f.mesh.idx.length/3,f.polygon.length-2,f.id);
  let triangleArea=0;
  for(let i=0;i<f.mesh.idx.length;i+=3){const [a,b,c]=Array.from(f.mesh.idx.slice(i,i+3),n=>[f.mesh.pos[n*3],f.mesh.pos[n*3+2]]);const signed=((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;assert(signed<0,'Upward winding '+f.id);triangleArea-=signed;}
  const polygonArea=Math.abs(f.polygon.reduce((s,a,i)=>{const b=f.polygon[(i+1)%f.polygon.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2)*data.scale**2;
  assert(Math.abs(polygonArea-triangleArea)<1e-4,'Area mismatch '+f.id);
}
for(const w of [...(data.shell||[]),...data.walls])for(const [i,o] of (w.openings||[]).entries()){
  const start=ctx.window.MuseumGeometry.point(w.a),end=ctx.window.MuseumGeometry.point(w.b),length=Math.hypot(end[0]-start[0],end[1]-start[1]);
  assert((o.to-o.from)*length>.8,'Narrow opening '+w.id);
  // The center below the lintel must remain clear of every wall piece of this wall.
  const middle=(o.from+o.to)/2,p=[start[0]+(end[0]-start[0])*middle,start[1]+(end[1]-start[1])*middle];
  for(const part of model.parts.filter(p=>p.group==='wall'&&p.id.startsWith(w.id+'-'))){const dx=p[0]-part.position[0],dz=p[1]-part.position[2],x=Math.cos(part.yaw)*dx-Math.sin(part.yaw)*dz,z=Math.sin(part.yaw)*dx+Math.cos(part.yaw)*dz;
    assert(!(Math.abs(x)<part.size[0]/2&&Math.abs(z)<part.size[2]/2&&1<part.position[1]+part.size[1]/2&&1>part.position[1]-part.size[1]/2),'Blocked opening '+w.id+' '+i);
  }
}
assert.equal(data.shell.length,data.envelope.length,'One boundary segment per envelope edge');
for(let i=0;i<data.shell.length;i++){
  const w=data.shell[i],next=data.shell[(i+1)%data.shell.length];
  assert.equal(JSON.stringify(w.a),JSON.stringify(data.envelope[i]),w.id);
  assert.equal(JSON.stringify(w.b),JSON.stringify(next.a),'Open exterior joint '+w.id);
  assert(w.a[0]===w.b[0]||w.a[1]===w.b[1],'Envelope axes '+w.id);
}
const partition=model.parts.find(p=>p.id==='video-bow-partition');assert(partition?.mesh,'Custom boundary mesh');
assert.equal(partition.mesh.idx.length/3,4*data.solidWalls[0].polygon.length-4,'Closed extrusion');
for(const p of model.parts.filter(p=>p.mesh)){assert([...p.mesh.pos,...p.mesh.nrm].every(Number.isFinite),p.id);assert([...p.mesh.idx].every(i=>i<p.mesh.pos.length/3),p.id);}
// 동쪽 열린 통로의 점을 각 벽의 로컬 좌표로 변환해 막힘을 검사한다.
const passage=ctx.window.MuseumGeometry.point([330,310]);
for(const p of model.parts.filter(p=>p.group==='wall'&&!p.mesh)){
 const dx=passage[0]-p.position[0],dz=passage[1]-p.position[2],x=Math.cos(p.yaw)*dx-Math.sin(p.yaw)*dz,z=Math.sin(p.yaw)*dx+Math.cos(p.yaw)*dz;
 assert(!(Math.abs(x)<p.size[0]/2&&Math.abs(z)<p.size[2]/2),'Blocked video/bow circulation '+p.id);
}
assert(Math.max(...data.solidWalls[0].polygon.map(p=>p[0]))<330,'Partition blocks east passage');
// 확대 평면의 핵심 배치: 긴 중앙 진열부 아래 정사각 진열대, 서측 진열부는 하부만.
const square=data.displays.find(d=>d.id==='donated-peninsula-square'),stem=data.niches.find(n=>n.id==='donated-peninsula-recess');
assert(square.at[0]-square.size[0]/data.scale/2>Math.max(stem.a[0],stem.b[0]),'Square overlaps rotated peninsula stem');
assert.equal(data.donatedAlignment.rotationDegrees,-90);
assert.equal(data.donatedAlignment.entrySide,'north-central-corridor');
assert(!data.shell.find(w=>w.id==='shell-donated-east').openings,'Spurious exterior east door');
const door=data.walls.find(w=>w.id==='donated-entry');
assert.equal(door.a[1],256);assert.equal(door.b[1],256);
assert(door.openings[0].from<.2&&door.openings[0].to<.4,'Door must align with corridor at northwest');
assert(!data.niches.some(n=>n.id==='donated-east-recess'||n.id==='donated-south-recess'),'Obsolete perimeter niches');
const clear=data.entranceClearance;
for(const p of model.parts.filter(p=>['details','displays','displayGlass'].includes(p.group)&&!p.mesh)){
  const x=(p.position[0]/data.scale)+data.origin[0],z=(p.position[2]/data.scale)+data.origin[1],w=p.size[0]/data.scale/2,h=p.size[2]/data.scale/2;
  assert(!(x+w>clear.min[0]&&x-w<clear.max[0]&&z+h>clear.min[1]&&z-h<clear.max[1]),'Furniture blocks entrance '+p.id);
}
for(let x=175;x<=235;x+=2){
 const q=ctx.window.MuseumGeometry.point([x,(clear.doorA[1]+clear.doorB[1])/2]);
 for(const p of model.parts.filter(p=>p.group==='wall'&&!p.mesh&&p.position[1]-p.size[1]/2<1&&p.position[1]+p.size[1]/2>1)){
  const dx=q[0]-p.position[0],dz=q[1]-p.position[2],u=Math.cos(p.yaw)*dx-Math.sin(p.yaw)*dz,v=Math.sin(p.yaw)*dx+Math.cos(p.yaw)*dz;
  assert(!(Math.abs(u)<p.size[0]/2&&Math.abs(v)<p.size[2]/2),'Wall blocks entrance '+p.id);
 }
}
const northGlass=data.frames.find(f=>f.id==='entrance-glass-north'),southGlass=data.frames.find(f=>f.id==='entrance-glass-south');
assert.equal(northGlass.a[1],318);assert(southGlass.b[1]<496);assert.equal(northGlass.b[1],clear.doorA[1]);assert.equal(southGlass.a[1],clear.doorB[1]);
const endPost=model.parts.find(p=>p.id==='entrance-glass-south-post-3');
assert(endPost.position[2]+endPost.size[2]/2<=ctx.window.MuseumGeometry.point([205,496])[1]-data.wallThickness+1e-8,'Entrance frame protrudes through south wall');
const counter=data.detailBoxes.find(p=>p.id==='reception-top');
assert(counter.at[1]-counter.size[2]/data.scale/2>clear.doorB[1],'Counter must be south of entrance');
assert(!data.niches.some(p=>p.id==='bow-arrow-wall'),'Remove user-marked structure 3');
const worktop=data.detailExtrusions.find(e=>e.id==='maru-worktop'),backing=data.walls.find(w=>w.id==='bow-worktop-backing'),relief=data.reliefDisplays[0];
assert.equal(backing.a[0],442);assert.equal(backing.b[0],442);
assert.equal(Math.min(...worktop.polygon.map(p=>p[0])),442,'Worktop must touch relocated backing wall');
assert(Math.max(...worktop.polygon.map(p=>p[0]))<relief.a[0]-relief.depth/data.scale-50,'Keep aisle between 1 and 2');
assert.equal(relief.id,'bow-relief-wall');assert(!model.parts.some(p=>p.id.startsWith('bow-relief-wall')&&p.group==='displayGlass'),'Relief support must not be glass cabinet');
assert(!data.displays.some(p=>p.id==='bow-south-case'||p.id==='bow-east-case'),'Duplicate/unconfirmed cases');
function overlap(a,b){for(const yaw of [a.yaw,b.yaw])for(const axis of [[Math.cos(yaw),-Math.sin(yaw)],[Math.sin(yaw),Math.cos(yaw)]]){
 const projection=p=>Math.abs(axis[0]*Math.cos(p.yaw)-axis[1]*Math.sin(p.yaw))*p.size[0]/2+Math.abs(axis[0]*Math.sin(p.yaw)+axis[1]*Math.cos(p.yaw))*p.size[2]/2;
 if(Math.abs(axis[0]*(a.position[0]-b.position[0])+axis[1]*(a.position[2]-b.position[2]))>projection(a)+projection(b)+1e-5)return false;
}return true;}
const walls=[...data.shell,...data.walls];
const maruCorner=model.parts.find(p=>p.junction?.[0]===552&&p.junction[1]===480);
assert(maruCorner.position[0]+maruCorner.size[0]/2<=ctx.window.MuseumGeometry.point([552,480])[0]+1e-8,'Maru/bow corner protrudes past straight facade');
for(const id of ['donated-west-upper','donated-west-jog-a','donated-west-jog-b','donated-west-shoulder']){
 const w=data.shell.find(w=>w.id===id),dx=w.b[0]-w.a[0],dz=w.b[1]-w.a[1];
 assert(Math.abs(w.inset[0]*dx+w.inset[1]*dz)<1e-8,'Rear outline thickness must be perpendicular');
 assert(w.inset[0]*(-dz)+w.inset[1]*dx>0,'Rear wall must lie inside outline');
}
assert.equal(data.galleryTables.length,2,'Only two timber tables remain');
assert(!data.galleryTables.some(t=>t.id==='gallery-table-3'),'Remove rightmost timber table');
assert(data.rooms.some(r=>r.id==='immersive'),'Separate immersive room');
const west=data.walls.find(w=>w.id==='immersive-west'),front=data.walls.find(w=>w.id==='immersive-front'),east=data.walls.find(w=>w.id==='immersive-east-return');
assert.equal(JSON.stringify(west.b),JSON.stringify(front.a),'Immersive west/front corner');
assert.equal(JSON.stringify(front.b),JSON.stringify(east.a),'Immersive east/front corner');
assert(west.openings.some(o=>o.kind==='opening'),'Immersive room needs entry');
assert.equal(front.openings[0].kind,'recess');assert(front.openings[0].sill>0,'Recess is not doorway');
assert(model.parts.some(p=>p.id==='immersive-front-recess-back-0'),'Recess must have solid back');
assert(front.a[1]<data.walls.find(w=>w.id==='planned-entry').a[1]-60,'Keep planned-room corridor clear');
assert(!data.displays.some(d=>d.id.startsWith('gallery-divider-')||d.id.startsWith('gallery-north-')),'Remove old glass boxes');
assert(!data.niches.some(n=>n.id==='gallery-inset'),'Remove false wall between two-sided tables');
for(const t of data.galleryTables){
  assert(!model.parts.some(p=>p.id.startsWith(t.id)&&['glass','displayGlass','wall'].includes(p.group)),'Two-sided table is enclosed');
  assert(model.parts.some(p=>p.id===t.id+'-pedestal'),'Missing center support');
  const deck=model.parts.find(p=>p.id===t.id+'-deck');assert(Math.abs(deck.position[1]+deck.size[1]/2-t.height)<1e-8,'Deck height');
  for(const z of [140,210]){const q=ctx.window.MuseumGeometry.point([(t.a[0]+t.b[0])/2,z]);
    for(const p of model.parts.filter(p=>!p.mesh&&['wall','displays'].includes(p.group)&&p.position[1]-p.size[1]/2<.8&&p.position[1]+p.size[1]/2>.8)){
      const dx=q[0]-p.position[0],dz=q[1]-p.position[2],u=Math.cos(p.yaw)*dx-Math.sin(p.yaw)*dz,v=Math.sin(p.yaw)*dx+Math.cos(p.yaw)*dz;
      assert(!(Math.abs(u)<p.size[0]/2&&Math.abs(v)<p.size[2]/2),'Blocked table approach '+t.id+' '+p.id);
    }
  }
}
const portal=data.walls.find(w=>w.id==='gallery-transition');
assert(portal.openings[0].kind==='opening'&&!portal.openings[0].leaves,'Gallery passage must be open');
assert.equal(JSON.stringify(portal.b),JSON.stringify(data.galleryTransitionAlignment.pivot),'Keep right pivot fixed');
assert.equal(portal.a[0],portal.b[0],'Rotated divider must be straight vertical in plan');
assert.equal(Math.hypot(portal.b[0]-portal.a[0],portal.b[1]-portal.a[1]),130,'Keep divider length');
const arch=data.detailArches.find(a=>a.id==='video-route-arch');
assert.equal(JSON.stringify(arch.b),JSON.stringify(portal.a),'Arch post must join lower divider endpoint');
assert.equal((arch.b[0]-arch.a[0])*(portal.b[0]-portal.a[0])+(arch.b[1]-arch.a[1])*(portal.b[1]-portal.a[1]),0,'Perpendicular lower connection');
assert.equal((data.galleryTables[0].b[0]-data.galleryTables[0].a[0])*(portal.b[0]-portal.a[0])+(data.galleryTables[0].b[1]-data.galleryTables[0].a[1])*(portal.b[1]-portal.a[1]),0,'Perpendicular upper table connection');
const turnedCase=data.niches.find(n=>n.id==='gallery-transition-display');
assert.equal(turnedCase.a[0],405);assert.equal(turnedCase.b[0],405);assert.equal(turnedCase.inward[0],1);
assert(data.displays.some(d=>d.id==='horse-platform'&&d.type==='platform'&&d.size[0]>4),'Missing large empty horse plinth');
const horse=data.displays.find(d=>d.id==='horse-platform');
assert(Math.abs((horse.at[0]-270)*data.scale-horse.size[0]/2-data.wallThickness)<1e-8,'Horse platform west wall gap');
assert(Math.abs((horse.at[1]-24)*data.scale-horse.size[2]/2-data.wallThickness)<1e-8,'Horse platform north wall gap');
assert(data.niches.filter(n=>n.id.startsWith('gallery-tall-wall-')).every(n=>n.top-n.sill>2),'Wall displays must be tall');
for(const j of model.parts.filter(p=>p.junction))for(const wall of walls.filter(w=>[w.a,w.b].some(v=>v.every((n,i)=>Math.abs(n-j.junction[i])<1e-5)))){
 assert(model.parts.some(p=>p.group==='wall'&&p.id.startsWith(wall.id+'-')&&overlap(p,j)),'Detached wall joint '+wall.id);
}
for(const c of data.columns){const col=model.parts.find(p=>p.id===c.id);assert(model.parts.some(p=>p.group==='structure'&&p.id!==c.id&&p.id.startsWith('gallery-')&&p.position[1]-p.size[1]/2<col.position[1]+col.size[1]/2&&overlap(p,col)),'Detached column '+c.id);}
console.log(JSON.stringify({ok:true,parts:model.parts.length,shellEdges:data.shell.length,checks:['geometry','door clearance','exterior contour','partition extrusion','east passage','entrance furniture clearance','entrance cross-route','glass endpoints','wall-joint overlaps','column-beam contact']}));


