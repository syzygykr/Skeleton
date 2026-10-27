/* 모델 데이터 → GPU와 독립적인 메시/부재. 바닥은 ear clipping으로 삼각분할. */
window.MuseumGeometry = (()=>{
  const data=MuseumLayout;
  const point=p=>[(p[0]-data.origin[0])*data.scale,(p[1]-data.origin[1])*data.scale];
  function floor(polygon,height=0){
    const p=polygon.map(point),pos=[],nrm=[],idx=[];
    p.forEach(v=>{pos.push(v[0],height,v[1]);nrm.push(0,1,0);});
    const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    const area=p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0);
    const order=p.map((_,i)=>i);if(area<0)order.reverse();
    while(order.length>3){let found=false;
      for(let j=0;j<order.length;j++){
        const a=order[(j+order.length-1)%order.length],b=order[j],c=order[(j+1)%order.length];
        if(cross(p[a],p[b],p[c])<=1e-8)continue;
        if(order.some(k=>k!==a&&k!==b&&k!==c&&cross(p[a],p[b],p[k])>=-1e-8&&cross(p[b],p[c],p[k])>=-1e-8&&cross(p[c],p[a],p[k])>=-1e-8))continue;
        idx.push(a,c,b);order.splice(j,1);found=true;break;
      }
      if(!found)throw new Error('바닥 다각형 삼각분할 실패');
    }
    idx.push(order[0],order[2],order[1]);
    return {pos:new Float32Array(pos),nrm:new Float32Array(nrm),idx:new Uint16Array(idx)};
  }
  function build(){
    const parts=[],floors=[{...data.floor,mesh:floor(data.floor.polygon,data.floor.height),group:'floor'}];
    function span(id,a,b,low,high,thickness,color,group,room){
      const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
      if(length<=0||high<=low)throw new Error('잘못된 부재 '+id);
      parts.push({id,position:[(a[0]+b[0])/2,(low+high)/2,(a[1]+b[1])/2],size:[length,high-low,thickness],yaw:-Math.atan2(dz,dx),color,group,room});
    }
    for(const w of data.walls){
      const h=w.height||data.wallHeight,t=w.thickness||data.wallThickness;
      const inset=w.inset||[0,0],a=point(w.a).map((v,i)=>v+inset[i]*t/2),b=point(w.b).map((v,i)=>v+inset[i]*t/2),at=t=>a.map((v,i)=>v+(b[i]-v)*t);
      let cursor=0;
      for(const [i,o] of (w.openings||[]).entries()){
        if(o.from<cursor||o.to<=o.from||o.to>1||o.height>=h)throw new Error('잘못된 개구부 '+w.id);
        if(o.from>cursor)span(w.id+'-pier-'+i,at(cursor),at(o.from),0,h,t,[.85,.84,.79],'wall',w.room);
        span(w.id+'-lintel-'+i,at(o.from),at(o.to),o.height,h,t,[.85,.84,.79],'wall',w.room);cursor=o.to;
      }
      if(cursor<1)span(w.id+'-end',at(cursor),b,0,h,t,[.85,.84,.79],'wall',w.room);
    }
    for(const f of data.frames){
      const inset=f.inset||[0,0],a=point(f.a).map((v,i)=>v+inset[i]*.07),b=point(f.b).map((v,i)=>v+inset[i]*.07),n=f.divisions||1;
      span(f.id+'-header',a,b,f.height-.14,f.height,.14,[.40,.32,.24],'frame',f.room);
      for(let i=0;i<=n;i++){
        const p=a.map((v,k)=>v+(b[k]-v)*i/n);
        parts.push({id:f.id+'-post-'+i,position:[p[0],f.height/2,p[1]],size:[.11,f.height,.11],yaw:0,color:[.40,.32,.24],group:'frame',room:f.room});
      }
    }
    return {floors,parts};
  }
  return {point,build,floor};
})();
