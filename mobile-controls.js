/* 모바일 입력 전용. 카메라·충돌은 controls.input 공통 인터페이스를 사용한다. */
window.MuseumMobileControls=function(canvas,controls,options={}){
 const media=matchMedia('(pointer: coarse)'),touches=new Map();
 let pair=null,stick=null,axes=[0,0],revision=controls.state.revision;
 const root=document.createElement('div');root.className='mobile-hud';root.innerHTML=`
  <div class="mobile-stick" role="group" aria-label="이동 조이스틱"><span class="stick-label">이동</span><span class="stick-knob"></span></div>
  <div class="mobile-zoom"><button type="button" data-touch="in" aria-label="확대">＋</button><button type="button" data-touch="out" aria-label="축소">−</button></div>
  `;
 canvas.parentElement.append(root);const joystick=root.querySelector('.mobile-stick'),knob=root.querySelector('.stick-knob');
 const panel=document.querySelector('aside'),panelToggle=document.createElement('button');
 panel.id='options-panel';panelToggle.type='button';panelToggle.className='mobile-panel-toggle';
 panelToggle.setAttribute('aria-controls',panel.id);document.body.append(panelToggle);
 let panelClosed=false;
 function syncPanel(){
  const hidden=media.matches&&panelClosed;
  document.body.classList.toggle('panel-hidden',hidden);
  panel.inert=hidden;panel.setAttribute('aria-hidden',String(hidden));
  panelToggle.setAttribute('aria-expanded',String(!hidden));
  panelToggle.setAttribute('aria-label',hidden?'패널 열기':'패널 숨기기');
  panelToggle.title=hidden?'패널 열기':'패널 숨기기';panelToggle.textContent=hidden?'‹':'›';
 }
 panelToggle.addEventListener('click',()=>{reset();controls.clear();panelClosed=!panelClosed;syncPanel();});
 const release=(target,id)=>{try{if(target.hasPointerCapture(id))target.releasePointerCapture(id);}catch{}};
 function reset(){for(const id of touches.keys())release(canvas,id);touches.clear();pair=null;if(stick!==null)release(joystick,stick);stick=null;axes=[0,0];knob.style.transform='translate(0px,0px)';}
 function sync(){joystick.hidden=controls.state.mode!=='interior';}
 function configure(){reset();document.body.classList.toggle('mobile-input',media.matches);sync();syncPanel();}
 for(const [name,delta] of [['in',-.15],['out',.15]])root.querySelector(`[data-touch="${name}"]`).addEventListener('click',()=>{controls.input.zoom(delta);});
 const snapshot=()=>{const p=[...touches.values()];return p.length===2?{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}:null;};
 canvas.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch'||touches.size>=2)return;
  e.preventDefault();if(revision!==controls.state.revision){reset();revision=controls.state.revision;}
  touches.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);pair=snapshot();
 });
 canvas.addEventListener('pointermove',e=>{
  if(!touches.has(e.pointerId))return;e.preventDefault();
  if(revision!==controls.state.revision){reset();return;}
  const old=touches.get(e.pointerId),dx=e.clientX-old.x,dy=e.clientY-old.y;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  const unit=Math.PI/Math.max(1,canvas.clientHeight);
  if(controls.state.mode==='interior'){if(touches.size===1)controls.input.rotate(-dx*unit*.5,dy*unit*.5);return;}
  if(touches.size===1){controls.input.rotate(-dx*unit,dy*unit);return;}
  const current=snapshot();if(pair){controls.input.pan(current.x-pair.x,current.y-pair.y);if(current.d>8&&pair.d>8)controls.input.zoom(Math.log(pair.d/current.d));}pair=current;
 });
 const end=e=>{if(!touches.has(e.pointerId))return;touches.delete(e.pointerId);release(canvas,e.pointerId);pair=snapshot();};
 canvas.addEventListener('pointerup',end);canvas.addEventListener('lostpointercapture',end);canvas.addEventListener('pointercancel',reset);
 function setStick(e){const r=joystick.getBoundingClientRect(),radius=r.width*.30,dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,n=Math.hypot(dx,dy),scale=n>radius?radius/n:1,x=dx*scale,y=dy*scale,strength=Math.min(1,n/radius),dead=.12;
  axes=strength<=dead?[0,0]:[-y/radius/strength*(strength-dead)/(1-dead),x/radius/strength*(strength-dead)/(1-dead)];knob.style.transform=`translate(${x}px,${y}px)`;
 }
 joystick.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||stick!==null||controls.state.mode!=='interior')return;e.preventDefault();revision=controls.state.revision;stick=e.pointerId;joystick.setPointerCapture(stick);setStick(e);});
 joystick.addEventListener('pointermove',e=>{if(e.pointerId===stick){e.preventDefault();setStick(e);}});
 const endStick=e=>{if(e.pointerId===stick){const id=stick;stick=null;axes=[0,0];knob.style.transform='translate(0px,0px)';release(joystick,id);}};
 for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,endStick);
 window.addEventListener('blur',reset);window.addEventListener('resize',reset);window.addEventListener('orientationchange',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});media.addEventListener('change',configure);configure();
 function update(dt){if(revision!==controls.state.revision){reset();revision=controls.state.revision;sync();}if(!media.matches)return;controls.input.moveAxes(axes[0],axes[1],dt);}
 return {update,reset};
};
