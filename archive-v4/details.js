/* VR 순회 및 4방향 사진 대조에 따른 상세. 모든 위치/치수는 상대 비율 근사.
 * 전시대와 건축 장식은 보존하되 전시품·인쇄물·모니터는 생성하지 않는다. */
(()=>{
 const d=MuseumLayout;
 d.detailBoxes=[
  {id:'reception-body',at:[183,371],size:[1.0,.94,2.8],color:[.83,.84,.79],room:'bow'},
  {id:'reception-top',at:[183,371],bottom:.94,size:[1.12,.09,2.95],color:[.31,.28,.24],room:'bow'},
  {id:'reception-return',at:[160,338],size:[1.8,.94,.7],color:[.83,.84,.79],room:'bow'},
  {id:'maru-worktop',at:[535,377],bottom:.72,size:[.65,.13,3.0],color:[.48,.32,.21],room:'bow'}
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
  {id:'donated-central',at:[1055,332],size:[1.65,.76,1.0],type:'low',room:'donated'},
  {id:'donated-east',at:[1128,329],size:[.70,.75,3.2],type:'low',room:'donated'},
  {id:'donated-south',at:[1060,393],size:[2.8,.72,.62],type:'low',room:'donated'},
  {id:'planned-south',at:[910,380],size:[3.6,.72,.55],type:'low',room:'planned'}
 ];
 for(const [i,x] of [438,577,720,858].entries()){
  d.displays.push({id:'gallery-north-'+i,at:[x,48],size:[3.5,.65,.75],type:'low',room:'long'});
  d.displays.push({id:'gallery-divider-'+i,at:[x,162],size:[3.4,.74,.85],type:'case',room:'long'});
 }
 d.unresolved=d.unresolved.filter(s=>!s.includes('전시품·전시대'));
 d.unresolved.push('전시대·입구 책상·활 모양 천장·동선 아치를 추가. 전시품과 인쇄물은 제외. 위치·곡률·개수는 관찰에 따른 근사이며 실측 복제는 아님');
})();

