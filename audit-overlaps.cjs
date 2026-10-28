// 전체 모델 검사: OBB 체적 교차 + 사용자 정의 메시를 포함한 삼각형 공면 중첩.
const fs=require('fs'),vm=require('vm'),path=require('path');
const ctx={window:{}};vm.createContext(ctx);
for(const name of ['layout.js','details.js','geometry.js']){vm.runInContext(fs.readFileSync(path.join(__dirname,name),'utf8'),ctx);Object.assign(ctx,ctx.window);}
const model=ctx.MuseumGeometry.build(),eps=1e-7;
const cubeFaces=[[[1,0,0],[[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]]],[[-1,0,0],[[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]]],[[0,1,0],[[-.5,.5,-.5],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5]]],[[0,-1,0],[[-.5,-.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5]]],[[0,0,1],[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]],[[0,0,-1],[[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]]];
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),sub=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function world(v,p){const s=p.size||[1,1,1],q=v.map((v,i)=>v*s[i]),c=Math.cos(p.yaw||0),t=Math.sin(p.yaw||0),o=p.position||[0,0,0];return [o[0]+c*q[0]+t*q[2],o[1]+q[1],o[2]-t*q[0]+c*q[2]];}
function triangles(p){
 if(!p.mesh)return cubeFaces.flatMap(([n,v])=>[[v[0],v[1],v[2]],[v[0],v[2],v[3]]].map(t=>t.map(v=>world(v,p))));
 const m=p.mesh,out=[];for(let i=0;i<m.idx.length;i+=3)out.push(Array.from(m.idx.slice(i,i+3),k=>world(Array.from(m.pos.slice(k*3,k*3+3)),p)));return out;
}
const area=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-a[1]*b[0];},0)/2;
const edge=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
function intersect(a,b){
 let out=a;const sign=area(b)>0?1:-1;
 for(let i=0;i<b.length&&out.length;i++){
  const u=b[i],v=b[(i+1)%b.length],input=out;out=[];
  for(let j=0;j<input.length;j++){
   const p=input[j],q=input[(j+1)%input.length],dp=sign*edge(u,v,p),dq=sign*edge(u,v,q),ip=dp>=-1e-10,iq=dq>=-1e-10;
   if(ip)out.push(p);if(ip!==iq){const t=dp/(dp-dq);out.push(p.map((v,k)=>v+(q[k]-v)*t));}
  }
 }return out.length>2?Math.abs(area(out)):0;
}
function boxOverlap(a,b){
 if(Math.min(a.position[1]+a.size[1]/2,b.position[1]+b.size[1]/2)-Math.max(a.position[1]-a.size[1]/2,b.position[1]-b.size[1]/2)<=eps)return false;
 for(const yaw of [a.yaw,b.yaw])for(const axis of [[Math.cos(yaw),-Math.sin(yaw)],[Math.sin(yaw),Math.cos(yaw)]]){
  const extent=p=>Math.abs(axis[0]*Math.cos(p.yaw)-axis[1]*Math.sin(p.yaw))*p.size[0]/2+Math.abs(axis[0]*Math.sin(p.yaw)+axis[1]*Math.cos(p.yaw))*p.size[2]/2;
  if(extent(a)+extent(b)-Math.abs(axis[0]*(a.position[0]-b.position[0])+axis[1]*(a.position[2]-b.position[2]))<=eps)return false;
 }return true;
}
function audit(parts,floors){
 const all=[...floors,...parts],bins=new Map(),pairs=new Map();let count=0;
 for(const p of all)for(const t of triangles(p)){
  const raw=cross(sub(t[1],t[0]),sub(t[2],t[0])),len=Math.hypot(...raw);if(len<eps)continue;
  const normal=raw.map(v=>v/len),n=[...normal];const first=n.find(v=>Math.abs(v)>1e-6);if(first<0)for(let k=0;k<3;k++)n[k]*=-1;
  const d=dot(n,t[0]),drop=n.reduce((best,v,i)=>Math.abs(v)>Math.abs(n[best])?i:best,0),poly=t.map(v=>v.filter((_,i)=>i!==drop));
  const key=[...n,d].map(v=>Math.round(v*1e5)).join(',');if(!bins.has(key))bins.set(key,[]);
  bins.get(key).push({p,t,n:normal,poly,drop});count++;
 }
 for(const faces of bins.values())for(let i=0;i<faces.length;i++)for(let j=i+1;j<faces.length;j++){
  const a=faces[i],b=faces[j];if(a.p.id===b.p.id)continue;
  if(a.t.some(v=>Math.abs(dot(b.n,sub(v,b.t[0])))>2e-6))continue;
  const overlap=intersect(a.poly,b.poly)/Math.abs(a.n[a.drop]);if(overlap<1e-8)continue;
  const order=[a.p,b.p].sort((a,b)=>a.id.localeCompare(b.id)),key=order.map(p=>p.id).join('|');
  if(!pairs.has(key))pairs.set(key,{a:order[0].id,b:order[1].id,groups:order.map(p=>p.group),sameFacingArea:0,oppositeFacingArea:0});
  const pair=pairs.get(key);pair[dot(a.n,b.n)>0?'sameFacingArea':'oppositeFacingArea']+=overlap;
 }
 const boxes=parts.filter(p=>!p.mesh),volumes=[];
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)if(boxOverlap(boxes[i],boxes[j]))volumes.push({a:boxes[i].id,b:boxes[j].id,groups:[boxes[i].group,boxes[j].group]});
 const coplanar=[...pairs.values()].sort((a,b)=>(b.sameFacingArea+b.oppositeFacingArea)-(a.sameFacingArea+a.oppositeFacingArea));
 return {parts:parts.length,customMeshes:parts.filter(p=>p.mesh).length,triangles:count,volumePairs:volumes.length,sameFacingPairs:coplanar.filter(p=>p.sameFacingArea>1e-8).length,oppositeOnlyPairs:coplanar.filter(p=>p.sameFacingArea<=1e-8).length,coplanar,volumes};
}
module.exports={audit,model};
if(require.main===module){
// 기준 도형으로 접촉과 중복을 구분하는 검사 자체를 검증한다.
const assert=require('node:assert/strict'),fixture=(id,x)=>({id,position:[x,0,0],size:[1,1,1],yaw:0,group:'wall'});
const duplicate=audit([fixture('a',0),fixture('b',0)],[]);
assert.equal(duplicate.volumePairs,1);assert(Math.abs(duplicate.coplanar[0].sameFacingArea-6)<eps);
const touching=audit([fixture('a',0),fixture('b',1)],[]);
assert.equal(touching.volumePairs,0);assert.equal(touching.sameFacingPairs,0);assert(Math.abs(touching.coplanar[0].oppositeFacingArea-1)<eps);
const separated=audit([fixture('a',0),fixture('b',2)],[]);assert.equal(separated.coplanar.length,0);assert.equal(separated.volumePairs,0);
const partial=audit([fixture('a',0),fixture('b',.5)],[]);assert(Math.abs(partial.coplanar[0].sameFacingArea-2)<eps);
const full=audit(model.parts,model.floors),low=audit(model.parts.map(p=>p.group==='wall'?{...p,position:p.position.map((v,i)=>i===1?v*.25:v),size:p.size.map((v,i)=>i===1?v*.25:v)}:p),model.floors);
const report={tolerance:eps,note:'면적은 상대 단위 제곱. 공면 중첩은 렌더링 충돌 후보이며 가려진 접촉면도 포함한다. 체적 교차는 박스만 정밀 검사하고 사용자 정의 메시는 공면 삼각형 검사에 포함한다.',full,low};
fs.writeFileSync(path.join(__dirname,'overlap-audit.json'),JSON.stringify(report,null,2));
const summary=r=>`부재 ${r.parts}개, 사용자 정의 메시 ${r.customMeshes}개, 삼각형 ${r.triangles}개. 박스 체적 교차 ${r.volumePairs}쌍, 같은 방향 공면 중첩 ${r.sameFacingPairs}쌍, 반대 방향 접촉만 있는 공면 ${r.oppositeOnlyPairs}쌍.`;
const rows=r=>r.coplanar.map(p=>`| ${p.a} | ${p.b} | ${p.groups.join(' / ')} | ${p.sameFacingArea.toFixed(6)} | ${p.oppositeFacingArea.toFixed(6)} |`).join('\n');
fs.writeFileSync(path.join(__dirname,'OVERLAP-AUDIT.md'),`# 모델 전체 겹침 검사\n\n검사 코드: audit-overlaps.cjs. 현재 모델 데이터로 재생성할 수 있습니다.\n\n${report.note}\n\n## 기본 높이\n\n${summary(full)}\n\n## 벽 낮추기\n\n${summary(low)}\n\n## 해석\n\n- 체적 교차는 기둥·보·모서리·장식 접합에도 발생하므로 모두 오류라는 뜻은 아닙니다.\n- 같은 방향 공면 중첩은 동일 위치의 표면을 중복 렌더링하는 Z-fighting 후보입니다.\n- 반대 방향 면만 맞닿는 경우는 주로 정상 접합이나 바닥 접촉입니다. 양면 렌더링 중에는 별도 확인이 필요합니다.\n- 카메라에서 실제 보이는지는 별도 시점 검토가 필요하며 이 검사는 가시성 판정이나 전체 Boolean 합집합 검사가 아닙니다.\n- 숨긴 그룹 간 조합은 이 보고서에서 모두 열거하지 않습니다.\n\n## 기본 높이의 공면 중첩 전체\n\n| 부재 A | 부재 B | 그룹 | 같은 방향 면적 | 반대 방향 면적 |\n|---|---|---|---:|---:|\n${rows(full)}\n\n## 벽 낮추기의 공면 중첩 전체\n\n| 부재 A | 부재 B | 그룹 | 같은 방향 면적 | 반대 방향 면적 |\n|---|---|---|---:|---:|\n${rows(low)}\n`);
const cleanupFile=path.join(__dirname,'surface-cleanup-results.json');
if(fs.existsSync(cleanupFile)){
 const cleanup=JSON.parse(fs.readFileSync(cleanupFile,'utf8'));
 fs.appendFileSync(path.join(__dirname,'OVERLAP-AUDIT.md'),'\n## 렌더링 면 정리 후 재검사\n\n위 표는 충돌과 배치에 사용하는 원본 부재의 교차 목록입니다. 실제 표시에는 surfaces.js가 공면의 중복 영역을 잘라낸 메시를 사용합니다. 정상 접합의 부피는 유지합니다. 아래 값은 verify-surfaces.cjs로 재생성합니다. 잔여 면적 0.000001 이하의 부동소수점 오차는 유의 중첩에서 제외합니다.\n\n| 상태 | 원본 공면 중첩 쌍 | 정리 후 유의 중첩 쌍 | 잘라낸 원본 삼각형 수 |\n|---|---:|---:|---:|\n'+cleanup.map(r=>`| ${r.name} | ${r.before} | ${r.significant} | ${r.trimmed} |`).join('\n')+'\n');
}
console.log(JSON.stringify({full:summary(full),low:summary(low),largest:full.coplanar.filter(p=>p.sameFacingArea>1e-8).slice(0,12)},null,2));
}
