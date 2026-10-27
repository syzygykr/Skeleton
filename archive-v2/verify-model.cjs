const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'layout.js'),'utf8'),ctx);ctx.MuseumLayout=ctx.window.MuseumLayout;
vm.runInContext(fs.readFileSync(path.join(__dirname,'geometry.js'),'utf8'),ctx);
const data=ctx.MuseumLayout,model=ctx.window.MuseumGeometry.build(),ids=new Set();
for(const p of model.parts){assert(!ids.has(p.id),'Duplicate '+p.id);ids.add(p.id);assert([...p.position,...p.size,p.yaw].every(Number.isFinite),p.id);assert(p.size.every(v=>v>0),p.id);}
for(const f of model.floors){
  assert.equal(f.mesh.idx.length/3,f.polygon.length-2,f.id);
  let triangleArea=0;
  for(let i=0;i<f.mesh.idx.length;i+=3){const [a,b,c]=Array.from(f.mesh.idx.slice(i,i+3),n=>[f.mesh.pos[n*3],f.mesh.pos[n*3+2]]);const signed=((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;assert(signed<0,'Upward winding '+f.id);triangleArea-=signed;}
  const polygonArea=Math.abs(f.polygon.reduce((s,a,i)=>{const b=f.polygon[(i+1)%f.polygon.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2)*data.scale**2;
  assert(Math.abs(polygonArea-triangleArea)<1e-4,'Area mismatch '+f.id);
}
for(const w of data.walls)for(const [i,o] of (w.openings||[]).entries()){
  const start=ctx.window.MuseumGeometry.point(w.a),end=ctx.window.MuseumGeometry.point(w.b),length=Math.hypot(end[0]-start[0],end[1]-start[1]);
  assert((o.to-o.from)*length>.8,'Narrow opening '+w.id);
  // The center below the lintel must remain clear of every wall piece of this wall.
  const middle=(o.from+o.to)/2,p=[start[0]+(end[0]-start[0])*middle,start[1]+(end[1]-start[1])*middle];
  for(const part of model.parts.filter(p=>p.group==='wall'&&p.id.startsWith(w.id+'-'))){const dx=p[0]-part.position[0],dz=p[1]-part.position[2],x=Math.cos(part.yaw)*dx-Math.sin(part.yaw)*dz,z=Math.sin(part.yaw)*dx+Math.cos(part.yaw)*dz;
    assert(!(Math.abs(x)<part.size[0]/2&&Math.abs(z)<part.size[2]/2&&1<part.position[1]+part.size[1]/2&&1>part.position[1]-part.size[1]/2),'Blocked opening '+w.id+' '+i);
  }
}
console.log(JSON.stringify({ok:true,parts:model.parts.length,checks:['unique ids','finite dimensions','floor/ceiling area and winding','door clearance']}));
