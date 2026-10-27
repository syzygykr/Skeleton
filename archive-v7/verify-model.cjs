const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'layout.js'),'utf8'),ctx);ctx.MuseumLayout=ctx.window.MuseumLayout;
vm.runInContext(fs.readFileSync(path.join(__dirname,'details.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'geometry.js'),'utf8'),ctx);
const data=ctx.MuseumLayout,model=ctx.window.MuseumGeometry.build(),ids=new Set();
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
console.log(JSON.stringify({ok:true,parts:model.parts.length,shellEdges:data.shell.length,checks:['unique ids','finite dimensions','floor/ceiling area and winding','door clearance','closed exterior contour','closed partition extrusion','open east passage']}));


