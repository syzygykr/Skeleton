/* baseline의 D.M4, D.upload, D.program, D.loop 재사용. PC 카메라는 MuseumControls.
 * 모델 생성·근거 기록은 layout.js/geometry.js에만 둔다. */
(()=>{
  'use strict';
  const canvas=document.querySelector('#cv'),error=document.querySelector('#error');
  try {
    const gl=canvas.getContext('webgl2',{antialias:true});
    if(!gl)throw new Error('WebGL2를 사용할 수 없습니다. WebGL2 지원 브라우저에서 열어 주세요.');
    const M=D.M4,model=MuseumGeometry.build(),collision=MuseumCollision(model,MuseumLayout);
    const initialEntry=MuseumGeometry.point([125,430]); // 사용자 체크 위치: 서측 입구 대기 공간
    const controls=MuseumControls(canvas,{onHome:()=>home(),onInput:()=>{selected='free';sync();},onModeChange:()=>{selected='free';sync();},initialInterior:{eye:[initialEntry[0],1.575,initialEntry[1]],yaw:Math.atan2(125-205,430-366.5)},move:collision.move,spawn:collision.spawn});
    const program=D.program(gl,`#version 300 es
      layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNormal;
      uniform mat4 uModel,uVP;uniform mat3 uNormal;out vec3 vN;
      void main(){vN=uNormal*aNormal;gl_Position=uVP*uModel*vec4(aPos,1.);}
    `,`#version 300 es
      precision highp float;in vec3 vN;uniform vec3 uColor;uniform float uAlpha;out vec4 outColor;
      void main(){float l=.62+.38*max(dot(normalize(vN),normalize(vec3(-.3,1.,.5))),0.);outColor=vec4(uColor*l,uAlpha);}
    `);
    const U=D.uniforms(gl,program,['uModel','uVP','uNormal','uColor','uAlpha']);
    const view=M.create(),projection=M.create(),vp=M.create(),identity=M.create();
    const points=MuseumLayout.floor.polygon.map(MuseumGeometry.point);
    const lo=[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1]))],hi=[Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
    const center=[(lo[0]+hi[0])/2,.5,(lo[1]+hi[1])/2],radius=Math.hypot(hi[0]-lo[0],hi[1]-lo[1])/2;
    let selected='orbit',lastCamera=null;
    const fields=Object.fromEntries(['walls','frames','names','low','structure','glass','ceiling','details','displays'].map(id=>[id,document.getElementById(id)]));
    const mobileControls=MuseumMobileControls(canvas,controls,{onHome:()=>home()});
    function sync(){document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===controls.state.mode));document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===selected));}
    function home(){lastCamera=null;const aspect=canvas.clientWidth/Math.max(1,canvas.clientHeight),fit=matchMedia('(pointer: coarse)').matches?Math.max(1,1.2/aspect):1;controls.setView({target:center,distance:radius*1.8*fit});selected='orbit';sync();}
    window.addEventListener('resize',()=>{if(matchMedia('(pointer: coarse)').matches&&selected==='orbit')home();});
    function preset(name){
      lastCamera=null;
      if(name==='orbit'){home();return;}
      const poses={top:[0,1,0],front:[0,.65,-1],left:[-.85,.75,.55],right:[.85,.75,.55],partition:[.12,.72,-.30],gallery:[0,6,9],immersive:[.22,.40,.55]};
      const v=poses[name];if(!v)return;
      let target=[...center],distance=radius*1.8;
      if(name==='partition'){target=[(164-MuseumLayout.origin[0])*MuseumLayout.scale,.8,(300-MuseumLayout.origin[1])*MuseumLayout.scale];distance=14;}
      if(name==='gallery'){target=[(620-MuseumLayout.origin[0])*MuseumLayout.scale,.9,(100-MuseumLayout.origin[1])*MuseumLayout.scale];distance=1;}
      if(name==='immersive'){target=[(935-MuseumLayout.origin[0])*MuseumLayout.scale,1,(120-MuseumLayout.origin[1])*MuseumLayout.scale];distance=18;}
      const aspect=Math.max(.1,canvas.clientWidth/Math.max(1,canvas.clientHeight));
      controls.setView({target,distance:distance*Math.hypot(...v),yaw:name==='top'?0:Math.atan2(v[0],v[2]),pitch:Math.atan2(v[1],Math.hypot(v[0],v[2])),orthographic:name==='top'||name==='gallery',halfHeight:name==='gallery'?14/aspect:Math.max(radius*.65,radius*1.08/aspect)});
      selected=name;sync();
    }
    document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>preset(b.dataset.view)));
    document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{
      controls.setMode(b.dataset.mode);
      canvas.focus({preventScroll:true});
    }));
    const labels=MuseumLayout.rooms.map(room=>{
      const el=document.createElement('span');el.className='room-label';el.textContent=room.name;document.querySelector('#labels').append(el);
      const pts=room.polygon.map(MuseumGeometry.point),p=[pts.reduce((s,v)=>s+v[0],0)/pts.length,.12,pts.reduce((s,v)=>s+v[1],0)/pts.length];
      const button=document.createElement('button'),dot=document.createElement('span');dot.className='swatch';dot.style.background=`rgb(${room.color.map(v=>Math.round(v*255)).join(',')})`;button.append(dot,document.createTextNode(room.name));button.title=room.note;
      button.addEventListener('click',()=>{lastCamera=null;if(controls.state.mode==='interior')controls.setMode('interior',[p[0],1.575,p[2]]);else controls.setView({target:[p[0],.5,p[2]],distance:room.id==='long'?27:15,yaw:controls.state.yaw,pitch:controls.state.pitch});selected='free';sync();});document.querySelector('#rooms').append(button);
      return {el,p,room:room.id};
    });
    MuseumLayout.unresolved.forEach(t=>{const li=document.createElement('li');li.textContent=t;document.querySelector('#notes').append(li);});
    gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);home();
    function matrix(p){const m=M.create(),short=fields.low.checked&&p.group==='wall';M.translate(m,m,[p.position[0],short?p.position[1]*.25:p.position[1],p.position[2]]);M.rotateY(m,m,p.yaw||0);M.scale(m,m,[p.size[0],short?p.size[1]*.25:p.size[1],p.size[2]]);return m;}
    function draw(mesh,m,color,alpha=1){gl.uniformMatrix4fv(U.uModel,false,m);gl.uniformMatrix3fv(U.uNormal,false,M.normalFrom(m));gl.uniform3fv(U.uColor,color);gl.uniform1f(U.uAlpha,alpha);gl.bindVertexArray(mesh.vao);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);}
    function visible(p){if(selected==='gallery'&&!['long','immersive'].includes(p.room))return false;return (p.group!=='wall'||fields.walls.checked)&&(p.group!=='frame'||fields.frames.checked)&&(p.group!=='structure'||fields.structure.checked)&&(p.group!=='glass'||fields.glass.checked)&&(p.group!=='details'||fields.details.checked)&&(!['displays','displayGlass'].includes(p.group)||fields.displays.checked)&&(p.group!=='displayGlass'||fields.glass.checked);}
    let surfaceKey='',surfaceStats=null;
    function prepareSurfaces(){
      const key=[selected==='gallery',...['walls','frames','structure','glass','details','displays','ceiling','low'].map(k=>fields[k].checked)].join('/');
      if(key===surfaceKey)return;
      const floors=model.floors.filter(p=>p.group!=='ceiling'||fields.ceiling.checked);
      const parts=model.parts.filter(visible).map(p=>fields.low.checked&&p.group==='wall'?{...p,position:p.position.map((v,i)=>i===1?v*.25:v),size:p.size.map((v,i)=>i===1?v*.25:v)}:p);
      const result=MuseumSurfaces.resolve([...floors,...parts]);
      for(const p of [...model.floors,...model.parts]){
        p.renderGpu?.dispose();p.renderGpu=null;
        const mesh=result.meshes.get(p.id);if(mesh)p.renderGpu=D.upload(gl,mesh);
      }
      surfaceStats={trimmed:result.trimmed,removedArea:result.removedArea};surfaceKey=key;
    }
    D.loop((now,dt)=>{
      controls.update(dt);
      mobileControls.update(dt);
      prepareSurfaces();
      const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      gl.viewport(0,0,w,h);gl.clearColor(.91,.925,.90,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      const camera=controls.camera();
      lastCamera=camera;M.lookAt(view,camera.eye,camera.target,camera.up);
      if(controls.state.orthographic){const half=controls.state.halfHeight;M.ortho(projection,-half*w/h,half*w/h,-half,half,.02,250);}
      else M.perspective(projection,controls.state.fov*Math.PI/180,w/h,.02,250);
      M.multiply(vp,projection,view);gl.useProgram(program);gl.uniformMatrix4fv(U.uVP,false,vp);
      for(const f of model.floors){if(!f.renderGpu)continue;draw(f.renderGpu,identity,f.color);}
      for(const p of model.parts){if(['glass','displayGlass'].includes(p.group)||!visible(p))continue;draw(p.renderGpu,matrix(p),p.color);}
      // 얇은 유리판은 불투명 부재 뒤에, 카메라에서 먼 순서로 그린다.
      const distance=p=>p.position.reduce((s,v,i)=>s+(v-camera.eye[i])**2,0);
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
      for(const p of model.parts.filter(p=>['glass','displayGlass'].includes(p.group)&&visible(p)).sort((a,b)=>distance(b)-distance(a)))draw(p.renderGpu,matrix(p),p.color,p.alpha);
      gl.depthMask(true);gl.disable(gl.BLEND);
      for(const {el,p,room} of labels){const clip=[0,1,2,3].map(i=>vp[i]*p[0]+vp[4+i]*p[1]+vp[8+i]*p[2]+vp[12+i]),x=clip[0]/clip[3],y=clip[1]/clip[3];el.hidden=(selected==='gallery'&&!['long','immersive'].includes(room))||!fields.names.checked||clip[3]<=0||Math.abs(x)>1||Math.abs(y)>1;el.style.left=(x*.5+.5)*r.width+'px';el.style.top=(-y*.5+.5)*r.height+'px';}
      document.querySelector('#readings').textContent=`${controls.state.mode==='interior'?'내부 1인칭 · 충돌 ON':'외부 관찰 · 충돌 OFF'} · ${controls.state.orthographic?'직교':'원근'}`;
    });
    window.MuseumViewer={gl,model,controls,home,partMatrix:matrix,get camera(){return lastCamera;},get surfaceStats(){return surfaceStats;}};
  } catch(e){error.hidden=false;error.textContent=e.message;console.error(e);}
})();






