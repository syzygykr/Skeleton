/* VR 순회 및 4방향 사진 대조에 따른 상세. 모든 위치/치수는 상대 비율 근사.
 * 전시대와 건축 장식은 보존하되 전시품·인쇄물·모니터는 생성하지 않는다. */
(()=>{
 const d=MuseumLayout;
 d.detailBoxes=[
  {id:'reception-body',at:[231,413],size:[2.65,.94,.72],color:[.83,.84,.79],room:'bow'},
  {id:'reception-top',at:[231,413],bottom:.94,size:[2.77,.09,.84],color:[.31,.28,.24],room:'bow'},
  {id:'reception-return',at:[195,395],size:[.70,.94,1.45],color:[.83,.84,.79],room:'bow'},
  {id:'maru-worktop',at:[491,404],bottom:.72,size:[.65,.13,2.6],color:[.48,.32,.21],room:'bow'}
 ];
 d.frames.push(
  {id:'entrance-glass-north',a:[205,326],b:[205,370],height:2.5,divisions:2,glazed:true,room:'bow',evidence:'입구 VR 유리 전실. 평면 대응 근사'},
  {id:'entrance-glass-south',a:[205,409],b:[205,455],height:2.5,divisions:2,glazed:true,room:'bow',evidence:'입구 VR 유리 전실. 중앙 출입 폭 확보'}
 );
 d.detailArches=[{id:'video-route-arch',a:[294,308],b:[392,308],spring:2.18,rise:.38,depth:.14,thickness:.14,posts:true,room:'bow',evidence:'VR에서 영상실 동선으로 넘어가는 목재 기둥과 완만한 상부 아치'}];
 d.detailRibbons=[];
 for(const [id,x,side] of [['bow-left',350,-1],['bow-right',490,1]]){
   const path=Array.from({length:33},(_,i)=>{const t=i/32;return [x+side*24*Math.sin(Math.PI*t),320+104*t];});
   d.detailRibbons.push({id,path,bottom:2.38,height:.30,width:5,room:'bow'});
 }
 d.detailRails=[{id:'bow-string-north',a:[350,320],b:[490,320]},{id:'bow-string-south',a:[350,424],b:[490,424]}];
 for(let z=337;z<=407;z+=23)d.detailRails.push({id:'bow-cross-'+z,a:[330,z],b:[510,z]});
 // 체험마루 서측 통로 끝에서 야외 방향으로 이어지는 작은 유리문.
 d.shell.find(w=>w.id==='shell-bow-south').openings=[{from:.022,to:.085,height:2.18,kind:'glazed',divisions:1,note:'VR 통로 끝 유리문. 남측 벽의 위치와 폭은 사진 대응 근사'}];
 d.displays=[
  {id:'bow-central-platform',at:[419,365],size:[3.2,.22,2.6],type:'platform',room:'bow'},
  {id:'bow-south-case',at:[286,465],size:[3.7,.70,.68],type:'low',room:'bow'},
  {id:'bow-north-case',at:[255,337],size:[2.5,.68,.60],type:'low',room:'bow'},
  {id:'bow-east-case',at:[532,328],size:[.65,.72,1.55],type:'low',room:'bow'},
  {id:'donated-workbench',at:[1030,362],size:[1.25,.78,.72],type:'platform',room:'donated'}
 ];
 for(const [i,x] of [438,577,720,858].entries()){
  d.displays.push({id:'gallery-north-'+i,at:[x,48],size:[3.5,.65,.75],type:'low',room:'long'});
  d.displays.push({id:'gallery-divider-'+i,at:[x,162],size:[3.4,.74,.85],type:'case',room:'long'});
 }
 // 벽 매입부: 뒤벽·측벽·상인방과 하부 받침을 갖는 두꺼운 내부 벽 라이닝.
 // 외벽을 투명 상자로 바꾸지 않는다. 전면 유리만 별도 생성한다.
 d.niches=[
  {id:'donated-east-recess',a:[1131,277],b:[1131,378],inward:[-1,0],depth:.52,sill:.55,top:2.45,room:'donated',evidence:'기증전시실 VR 3방향: 측벽·상부 박스와 매입 진열 공간'},
  {id:'donated-west-recess',a:[994,297],b:[994,350],inward:[1,0],depth:.44,sill:.60,top:2.45,room:'donated',evidence:'VR 출입부 반대면의 두꺼운 벽체와 유리 진열 공간'},
  {id:'donated-south-recess',a:[1010,401],b:[1115,401],inward:[0,-1],depth:.43,sill:.58,top:2.40,room:'donated',evidence:'VR 진열부의 연속 뒷벽과 모서리. 평면 폭은 사진 대응 근사'},
  {id:'bow-arrow-wall',a:[239,473],b:[344,473],inward:[0,-1],depth:.48,sill:.55,top:2.35,room:'bow',evidence:'입구 반대편 VR의 벽 매입 화살 진열부'},
  {id:'gallery-inset',a:[418,158],b:[512,158],inward:[0,1],depth:.40,sill:.60,top:2.40,room:'long',evidence:'긴 전시영역의 기둥 사이 매입형 진열 구간'}
 ];
 d.walls.push({id:'donated-inner-return',a:[1068,278],b:[1068,316],thickness:.30,room:'donated',evidence:'기증전시실 VR: 유리 진열부 사이 내부 돌출벽. 평면 위치와 길이는 상대비율 근사'});
 d.walls.push({id:'bow-worktop-backing',a:[478,363],b:[478,443],height:2.55,thickness:.16,room:'bow',evidence:'체험마루 옆 통로 VR: 긴 작업대 뒤 실벽. 체험마루 벽 쪽이 아닌 중앙 구조 쪽에 배치. 좌표는 근사'});
 d.unresolved=d.unresolved.filter(s=>!s.includes('전시품·전시대'));
 d.unresolved.push('전시대·입구 책상·활 모양 천장·동선 아치를 추가. 전시품과 인쇄물은 제외. 위치·곡률·개수는 관찰에 따른 근사이며 실측 복제는 아님');
})();

