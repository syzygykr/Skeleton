/* baseline의 D.M4, D.upload, D.program, D.loop와 InspectionControls 재사용.
 * 모델 생성·근거 기록은 layout.js/geometry.js에만 둔다. */
(()=>{
  'use strict';
  const canvas=document.querySelector('#cv'),error=document.querySelector('#error');
  try {
    const gl=canvas.getContext('webgl2',{antialias:true});
    if(!gl)throw new Error('WebGL2를 사용할 수 없습니다. WebGL2 지원 브라우저에서 열어 주세요.');
    const M=D.M4,controls=InspectionControls(canvas),model=MuseumGeometry.build();
    const program=D.program(gl,`#version 300 es
      layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNormal;
      uniform mat4 uModel,uVP;uniform mat3 uNormal;out vec3 vN;
      void main(){vN=uNormal*aNormal;gl_Position=uVP*uModel*vec4(aPos,1.);}
    `,`#version 300 es
      precision highp float;in vec3 vN;uniform vec3 uColor;uniform float uAlpha;out vec4 outColor;
      void main(){float l=.62+.38*max(dot(normalize(vN),normalize(vec3(-.3,1.,.5))),0.);outColor=vec4(uColor*l,uAlpha);}
    `);
    const U=D.uniforms(gl,program,['uModel','uVP','uNormal','uColor','uAlpha']),cube=D.upload(gl,D.cube(1));
    model.floors.forEach(f=>f.gpu=D.upload(gl,f.mesh));
    model.parts.filter(p=>p.mesh).forEach(p=>p.gpu=D.upload(gl,p.mesh));
    const view=M.create(),projection=M.create(),vp=M.create(),identity=M.create();
    const points=MuseumLayout.floor.polygon.map(MuseumGeometry.point);
    const lo=[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1]))],hi=[Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
    const center=[(lo[0]+hi[0])/2,.7,(lo[1]+hi[1])/2],radius=Math.hypot(hi[0]-lo[0],hi[1]-lo[1])/2;
    let selected='orbit',lastCamera=null;
    const fields=Object.fromEntries(['walls','frames','names','low','structure','glass','ceiling','details','displays'].map(id=>[id,document.getElementById(id)]));
    function home(){controls.home();controls.state.target=[...center];controls.state.distance=radius*2.5;selected='orbit';sync();}
    function sync(){document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===selected));}
    document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.view==='orbit')home();else{selected=b.dataset.view;controls.state.target=selected==='partition'?[(164-MuseumLayout.origin[0])*MuseumLayout.scale,.8,(300-MuseumLayout.origin[1])*MuseumLayout.scale]:[...center];controls.state.distance=selected==='partition'?14:radius*2.5;sync();}}));
    // 고정 시점에서 조작하면 eye/up을 쿼터니언으로 변환해 같은 방향에서 이어간다.
    function adoptCamera(){if(selected==='orbit'||!lastCamera)return;
      const c=lastCamera,z=c.eye.map((v,i)=>v-c.target[i]),len=Math.hypot(...z);for(let i=0;i<3;i++)z[i]/=len;
      const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
      const x=cross(c.up,z),xn=Math.hypot(...x);for(let i=0;i<3;i++)x[i]/=xn;const y=cross(z,x);
      const a=x[0],b=y[0],d=z[0],e=x[1],f=y[1],g=z[1],h=x[2],i=y[2],j=z[2],trace=a+f+j;let q,s;
      if(trace>0){s=Math.sqrt(trace+1)*2;q=[(i-g)/s,(d-h)/s,(e-b)/s,s/4];}
      else if(a>f&&a>j){s=Math.sqrt(1+a-f-j)*2;q=[s/4,(b+e)/s,(d+h)/s,(i-g)/s];}
      else if(f>j){s=Math.sqrt(1+f-a-j)*2;q=[(b+e)/s,s/4,(g+i)/s,(d-h)/s];}
      else{s=Math.sqrt(1+j-a-f)*2;q=[(d+h)/s,(g+i)/s,s/4,(e-b)/s];}
      controls.state.rotation=q;controls.state.target=[...c.target];controls.state.distance=len;selected='orbit';sync();
    }
    canvas.addEventListener('pointerdown',adoptCamera,true);canvas.addEventListener('wheel',adoptCamera,{capture:true,passive:true});
    canvas.addEventListener('keydown',e=>{if(e.key==='Home'){e.preventDefault();e.stopImmediatePropagation();home();}else adoptCamera();},true);
    const labels=MuseumLayout.rooms.map(room=>{
      const el=document.createElement('span');el.className='room-label';el.textContent=room.name;document.querySelector('#labels').append(el);
      const pts=room.polygon.map(MuseumGeometry.point),p=[pts.reduce((s,v)=>s+v[0],0)/pts.length,.12,pts.reduce((s,v)=>s+v[1],0)/pts.length];
      const button=document.createElement('button'),dot=document.createElement('span');dot.className='swatch';dot.style.background=`rgb(${room.color.map(v=>Math.round(v*255)).join(',')})`;button.append(dot,document.createTextNode(room.name));button.title=room.note;
      button.addEventListener('click',()=>{adoptCamera();controls.state.target=[p[0],.5,p[2]];controls.state.distance=room.id==='long'?27:15;selected='orbit';sync();});document.querySelector('#rooms').append(button);
      return {el,p};
    });
    MuseumLayout.unresolved.forEach(t=>{const li=document.createElement('li');li.textContent=t;document.querySelector('#notes').append(li);});
    gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);home();
    function matrix(p){const m=M.create(),short=fields.low.checked;M.translate(m,m,[p.position[0],short?p.position[1]*.25:p.position[1],p.position[2]]);M.rotateY(m,m,p.yaw||0);M.scale(m,m,[p.size[0],short?p.size[1]*.25:p.size[1],p.size[2]]);return m;}
    function draw(mesh,m,color,alpha=1){gl.uniformMatrix4fv(U.uModel,false,m);gl.uniformMatrix3fv(U.uNormal,false,M.normalFrom(m));gl.uniform3fv(U.uColor,color);gl.uniform1f(U.uAlpha,alpha);gl.bindVertexArray(mesh.vao);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);}
    function visible(p){return (p.group!=='wall'||fields.walls.checked)&&(p.group!=='frame'||fields.frames.checked)&&(p.group!=='structure'||fields.structure.checked)&&(p.group!=='glass'||fields.glass.checked)&&(p.group!=='details'||fields.details.checked)&&(!['displays','displayGlass'].includes(p.group)||fields.displays.checked)&&(p.group!=='displayGlass'||fields.glass.checked);}
    D.loop(()=>{
      const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      gl.viewport(0,0,w,h);gl.clearColor(.91,.925,.90,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      let camera=controls.camera();const t=controls.state.target,dist=controls.state.distance;
      if(selected==='top')camera={eye:[t[0],t[1]+dist,t[2]],target:t,up:[0,0,-1]};
      if(selected==='front')camera={eye:[t[0],t[1]+dist*.65,t[2]-dist],target:t,up:[0,1,0]};
      if(selected==='left')camera={eye:[t[0]-dist*.85,t[1]+dist*.75,t[2]+dist*.55],target:t,up:[0,1,0]};
      if(selected==='right')camera={eye:[t[0]+dist*.85,t[1]+dist*.75,t[2]+dist*.55],target:t,up:[0,1,0]};
      if(selected==='partition')camera={eye:[t[0]+dist*.12,t[1]+dist*.72,t[2]-dist*.30],target:t,up:[0,1,0]};
      lastCamera=camera;M.lookAt(view,camera.eye,camera.target,camera.up);
      if(selected==='top'){const half=radius*.65;M.ortho(projection,-Math.max(half*w/h,radius*1.08),Math.max(half*w/h,radius*1.08),-Math.max(half,radius*1.08*h/w),Math.max(half,radius*1.08*h/w),.02,250);}
      else M.perspective(projection,controls.state.fov*Math.PI/180,w/h,.02,250);
      M.multiply(vp,projection,view);gl.useProgram(program);gl.uniformMatrix4fv(U.uVP,false,vp);
      for(const f of model.floors){if(f.group==='ceiling'&&(!fields.ceiling.checked||fields.low.checked))continue;draw(f.gpu,identity,f.color);}
      for(const p of model.parts){if(['glass','displayGlass'].includes(p.group)||!visible(p))continue;draw(p.gpu||cube,matrix(p),p.color);}
      // 얇은 유리판은 불투명 부재 뒤에, 카메라에서 먼 순서로 그린다.
      const distance=p=>p.position.reduce((s,v,i)=>s+(v-camera.eye[i])**2,0);
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
      for(const p of model.parts.filter(p=>['glass','displayGlass'].includes(p.group)&&visible(p)).sort((a,b)=>distance(b)-distance(a)))draw(cube,matrix(p),p.color,p.alpha);
      gl.depthMask(true);gl.disable(gl.BLEND);
      for(const {el,p} of labels){const clip=[0,1,2,3].map(i=>vp[i]*p[0]+vp[4+i]*p[1]+vp[8+i]*p[2]+vp[12+i]),x=clip[0]/clip[3],y=clip[1]/clip[3];el.hidden=!fields.names.checked||clip[3]<=0||Math.abs(x)>1||Math.abs(y)>1;el.style.left=(x*.5+.5)*r.width+'px';el.style.top=(-y*.5+.5)*r.height+'px';}
      document.querySelector('#readings').textContent=`${selected==='top'?'직교':'원근'} · 구조 검토 · 상대 치수`;
    });
    window.MuseumViewer={gl,model,controls,home,get camera(){return lastCamera;}};
  } catch(e){error.hidden=false;error.textContent=e.message;console.error(e);}
})();


