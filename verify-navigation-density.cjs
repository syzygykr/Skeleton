const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),ctx={window:{}};
vm.createContext(ctx);
for(const f of ['layout.js','details.js','geometry.js','collision.js','navigation-points.js','pathfinding.js']){
 vm.runInContext(fs.readFileSync(__dirname+'/'+f,'utf8'),ctx);Object.assign(ctx,ctx.window);
}
const collision=ctx.MuseumCollision(ctx.MuseumGeometry.build(),ctx.MuseumLayout);
const points=ctx.MuseumNavigationPoints.map(n=>{const q=ctx.MuseumGeometry.point(n.at);return {...n,p:[q[0],1.575,q[1]]};});
assert.equal(new Set(points.map(n=>n.id)).size,points.length);
assert.equal(new Set(points.map(n=>n.reviewNumber)).size,points.length);
for(const n of points){
 assert(!collision.blocked(n.p),n.id);
 assert(collision.spawn(n.p).every((v,i)=>Math.abs(v-n.p[i])<1e-8),n.id+' outside floor');
}
const edges=points.map(()=>[]);
for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
 const a=points[i].p,b=points[j].p;
 if(collision.move(a,b).every((v,k)=>Math.abs(v-b[k])<.005)&&collision.move(b,a).every((v,k)=>Math.abs(v-a[k])<.005)){edges[i].push(j);edges[j].push(i);}
}
const seen=new Set([0]),queue=[0];
for(let cursor=0;cursor<queue.length;cursor++)for(const next of edges[queue[cursor]])if(!seen.has(next)){seen.add(next);queue.push(next);}
assert.equal(seen.size,points.length,'Disconnected points: '+points.filter((_,i)=>!seen.has(i)).map(n=>n.id));
console.log('PASS '+points.length+' safe unique points, bidirectional collision-free connections from entrance');
