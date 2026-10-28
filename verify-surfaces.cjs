const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const {audit,model}=require('./audit-overlaps.cjs'),ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'surfaces.js'),'utf8'),ctx);
const resolve=ctx.window.MuseumSurfaces.resolve;
const box=(id,x)=>({id,position:[x,0,0],size:[1,1,1],yaw:0,group:'wall'});
const meshArea=m=>{let sum=0;for(let i=0;i<m.idx.length;i+=3){const p=Array.from(m.idx.slice(i,i+3),k=>Array.from(m.pos.slice(k*3,k*3+3)));const a=p[1].map((v,i)=>v-p[0][i]),b=p[2].map((v,i)=>v-p[0][i]);sum+=Math.hypot(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])/2;}return sum;};
for(const [x,expected] of [[0,6],[1,11],[.5,10],[2,12]]){
 const result=resolve([box('a',0),box('b',x)]);assert(Math.abs([...result.meshes.values()].reduce((s,m)=>s+meshArea(m),0)-expected)<1e-6,'Fixture clipped surface area '+x);
}
function check(name,parts,floors){
 const original=audit(parts,floors),result=resolve([...floors,...parts]);
 const cleanedParts=parts.map(p=>({...p,mesh:result.meshes.get(p.id)})),cleanedFloors=floors.map(p=>({...p,mesh:result.meshes.get(p.id)}));
 const after=audit(cleanedParts,cleanedFloors);
 const leftovers=after.coplanar.filter(p=>p.sameFacingArea+p.oppositeFacingArea>1e-6);
 console.log(JSON.stringify({name,before:original.coplanar.length,after:after.coplanar.length,significant:leftovers.length,trimmed:result.trimmed,removedArea:result.removedArea,largest:leftovers.slice(0,3)}));
 assert.equal(leftovers.length,0,'Coplanar overlap remains '+name);
 for(const mesh of result.meshes.values()){assert([...mesh.pos,...mesh.nrm].every(Number.isFinite));assert([...mesh.idx].every(k=>k<mesh.pos.length/3));}
 return {name,before:original.coplanar.length,after:after.coplanar.length,significant:leftovers.length,trimmed:result.trimmed,removedArea:result.removedArea};
}
const results=[];
results.push(check('full',model.parts,model.floors.filter(p=>p.group!=='ceiling')));
results.push(check('ceilings',model.parts,model.floors));
results.push(check('low',model.parts.map(p=>p.group==='wall'?{...p,position:p.position.map((v,i)=>i===1?v*.25:v),size:p.size.map((v,i)=>i===1?v*.25:v)}:p),model.floors));
results.push(check('walls-hidden',model.parts.filter(p=>p.group!=='wall'),model.floors));
results.push(check('structure-hidden',model.parts.filter(p=>p.group!=='structure'),model.floors));
results.push(check('gallery',model.parts.filter(p=>['long','immersive'].includes(p.room)),model.floors));
fs.writeFileSync(path.join(__dirname,'surface-cleanup-results.json'),JSON.stringify(results,null,2));
