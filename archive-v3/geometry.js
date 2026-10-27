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
    const parts=[],floors=[{...data.floor,mesh:floor(data.floor.polygon,data.floor.height),group:'floor'},
      ...(data.ceilings||[]).map(c=>({...c,mesh:floor(c.polygon,c.height),group:'ceiling'}))];
    const wallColor=[.85,.86,.83],frameColor=[.43,.48,.47];
    function span(id,a,b,low,high,thickness,color,group,room){
      const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
      if(length<=0||high<=low)throw new Error('잘못된 부재 '+id);
      parts.push({id,position:[(a[0]+b[0])/2,(low+high)/2,(a[1]+b[1])/2],size:[length,high-low,thickness],yaw:-Math.atan2(dz,dx),color,group,room});
    }
    function glazing(id,a,b,height,divisions,room){
      const at=t=>a.map((v,i)=>v+(b[i]-v)*t);
      span(id+'-header',a,b,height-.08,height,.10,frameColor,'frame',room);
      for(let i=0;i<=divisions;i++){
        const p=at(i/divisions);
        parts.push({id:id+'-post-'+i,position:[p[0],height/2,p[1]],size:[.08,height,.08],yaw:0,color:frameColor,group:'frame',room});
        if(i<divisions){span(id+'-pane-'+i,p,at((i+1)/divisions),.04,height-.08,.025,[.56,.75,.77],'glass',room);parts[parts.length-1].alpha=.20;}
      }
    }
    for(const w of [...(data.shell||[]),...data.walls]){
      const h=w.height||data.wallHeight,t=w.thickness||data.wallThickness;
      const inset=w.inset||[0,0],a=point(w.a).map((v,i)=>v+inset[i]*t/2),b=point(w.b).map((v,i)=>v+inset[i]*t/2),at=t=>a.map((v,i)=>v+(b[i]-v)*t);
      let cursor=0;
      for(const [i,o] of (w.openings||[]).entries()){
        if(o.from<cursor||o.to<=o.from||o.to>1||o.height<=0||o.height>=h)throw new Error('잘못된 개구부 '+w.id);
        if(o.from>cursor)span(w.id+'-pier-'+i,at(cursor),at(o.from),0,h,t,wallColor,'wall',w.room);
        span(w.id+'-lintel-'+i,at(o.from),at(o.to),o.height,h,t,wallColor,'wall',w.room);
        const length=Math.hypot(b[0]-a[0],b[1]-a[1]),trim=.06/length;
        span(w.id+'-jamb-left-'+i,at(o.from),at(o.from+trim),0,o.height,t+.025,frameColor,'frame',w.room);
        span(w.id+'-jamb-right-'+i,at(o.to-trim),at(o.to),0,o.height,t+.025,frameColor,'frame',w.room);
        span(w.id+'-door-header-'+i,at(o.from),at(o.to),o.height-.06,o.height,t+.025,frameColor,'frame',w.room);
        if(o.kind==='glazed')glazing(w.id+'-glazing-'+i,at(o.from),at(o.to),o.height,o.divisions||3,w.room);
        if(o.leaves){
          const gap=.015/length;
          for(let k=0;k<o.leaves;k++)span(w.id+'-door-leaf-'+i+'-'+k,at(o.from+(o.to-o.from)*k/o.leaves+gap),at(o.from+(o.to-o.from)*(k+1)/o.leaves-gap),.025,o.height-.06,.065,[.62,.65,.63],'frame',w.room);
        }
        cursor=o.to;
      }
      if(cursor<1)span(w.id+'-end',at(cursor),b,0,h,t,wallColor,'wall',w.room);
    }
    for(const f of data.frames){
      const inset=f.inset||[0,0],a=point(f.a).map((v,i)=>v+inset[i]*.07),b=point(f.b).map((v,i)=>v+inset[i]*.07),n=f.divisions||1;
      span(f.id+'-header',a,b,f.height-.14,f.height,.14,frameColor,'frame',f.room);
      for(let i=0;i<=n;i++){
        const p=a.map((v,k)=>v+(b[k]-v)*i/n);
        parts.push({id:f.id+'-post-'+i,position:[p[0],f.height/2,p[1]],size:[.11,f.height,.11],yaw:0,color:frameColor,group:'frame',room:f.room});
        if(f.glazed&&i<n){
          const next=a.map((v,k)=>v+(b[k]-v)*(i+1)/n);
          span(f.id+'-glass-'+i,p,next,.06,f.height-.14,.025,[.56,.75,.77],'glass',f.room);
          parts[parts.length-1].alpha=.20;
        }
      }
    }
    for(const b of data.beams||[])span(b.id,point(b.a),point(b.b),b.bottom,b.bottom+b.height,b.thickness,wallColor,'structure','long');
    for(const c of data.columns||[]){const p=point(c.at);parts.push({id:c.id,position:[p[0],c.height/2,p[1]],size:[c.width,c.height,c.depth],yaw:0,color:wallColor,group:'structure',room:'long'});}
    for(const w of data.solidWalls||[])parts.push({id:w.id,mesh:extrude(w.polygon,w.height),position:[0,0,0],size:[1,1,1],yaw:0,color:wallColor,group:'wall',room:w.room});
    return {floors,parts};
  }
  // 임의 평면 다각형을 위로 돌출한다. 상·하면과 수직면의 법선을 분리한다.
  function extrude(polygon,height){
    const cap=floor(polygon,height),bottom=floor(polygon,0),pos=[...cap.pos,...bottom.pos],nrm=[...cap.nrm,...bottom.nrm].map((v,i)=>i>=cap.nrm.length?-v:v),idx=[...cap.idx];
    const n=polygon.length;
    for(let i=0;i<bottom.idx.length;i+=3)idx.push(n+bottom.idx[i],n+bottom.idx[i+2],n+bottom.idx[i+1]);
    const p=polygon.map(point),area=p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0),sign=area>0?1:-1;
    p.forEach((a,i)=>{const b=p[(i+1)%p.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),base=pos.length/3;
      pos.push(a[0],0,a[1],b[0],0,b[1],b[0],height,b[1],a[0],height,a[1]);
      for(let k=0;k<4;k++)nrm.push(sign*dz/len,0,-sign*dx/len);
      if(sign>0)idx.push(base,base+2,base+1,base,base+3,base+2);else idx.push(base,base+1,base+2,base,base+2,base+3);
    });
    return {pos:new Float32Array(pos),nrm:new Float32Array(nrm),idx:new Uint16Array(idx)};
  }
  return {point,build,floor,extrude};
})();
