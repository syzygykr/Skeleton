/* VR 순회 및 4방향 사진 대조에 따른 상세. 모든 위치/치수는 상대 비율 근사.
 * 전시대와 건축 장식은 보존하되 전시품·인쇄물·모니터는 생성하지 않는다. */
(()=>{
 const d=MuseumLayout;
 d.detailBoxes=[
  {id:'reception-body',at:[255,404],size:[3.15,.94,1.10],color:[.83,.84,.79],room:'bow'},
  {id:'reception-top',at:[255,404],bottom:.94,size:[3.22,.09,1.17],color:[.83,.84,.79],room:'bow'},
  {id:'reception-return',at:[218,414],size:[.60,.94,.80],color:[.83,.84,.79],room:'bow'},
  {id:'maru-worktop',at:[491,404],bottom:.72,size:[.65,.13,2.6],color:[.48,.32,.21],room:'bow'}
 ];
 d.frames.push(
  {id:'entrance-glass-north',a:[205,318],b:[205,350],height:2.5,divisions:1,glazed:true,room:'bow',evidence:'상단·내부 캠 대조: 표찰 벽 쪽 유리 전실. 남쪽 책상과 문 위치를 함께 대응'},
  {id:'entrance-glass-south',a:[205,383],b:[205,496],height:2.5,divisions:3,glazed:true,room:'bow',evidence:'상단·내부 캠 대조: 문 남쪽에 안내 책상. 유리 전실 전체 꺾임은 별도 확인 필요'}
 );
 d.entranceClearance={min:[170,354],max:[242,379],doorA:[205,350],doorB:[205,383]};
 d.walls.push({id:'entrance-transom',a:[205,318],b:[205,496],bottom:2.5,height:2.8,thickness:.14,room:'bow',evidence:'기존 유리 전실의 상부 연결부. 출입구 아래는 개방 유지'});
 d.detailArches=[{id:'video-route-arch',a:[294,308],b:[392,308],spring:2.18,rise:.38,depth:.14,thickness:.14,posts:true,room:'bow',evidence:'VR에서 영상실 동선으로 넘어가는 목재 기둥과 완만한 상부 아치'}];
 d.detailRibbons=[];
 for(const [id,x,side] of [['bow-left',350,-1],['bow-right',488,0]]){
   const path=Array.from({length:33},(_,i)=>{const t=i/32;return [x+side*10*Math.sin(Math.PI*t),310+100*t];});
   d.detailRibbons.push({id,path,bottom:2.38,height:.30,width:5,room:'bow'});
 }
 d.detailRails=[];
 for(let z=310;z<=410;z+=20)d.detailRails.push({id:'bow-cross-'+z,a:[350,z],b:[488,z]});
 for(let x=373;x<488;x+=23)d.detailRails.push({id:'bow-long-'+x,a:[x,310],b:[x,410]});
 // 체험마루 서측 통로 끝에서 야외 방향으로 이어지는 작은 유리문.
 d.shell.find(w=>w.id==='shell-bow-south').openings=[{from:.022,to:.085,height:2.18,kind:'glazed',divisions:1,note:'VR 통로 끝 유리문. 남측 벽의 위치와 폭은 사진 대응 근사'}];
 d.displays=[
  {id:'bow-central-platform',at:[393,369],size:[2.4,.22,1.9],type:'platform',room:'bow'},
  {id:'bow-north-case',at:[172,335],size:[2.0,.68,.60],type:'low',room:'bow'},
  {id:'donated-workbench',at:[1039,403],size:[.97,.78,.67],type:'platform',room:'donated'},
  {id:'donated-small-south',at:[1075,404],size:[.69,.68,.54],type:'low',room:'donated'},
  {id:'donated-north-horizontal',at:[1124,266],size:[1.52,.70,.60],type:'low',room:'donated'},
  {id:'donated-peninsula-side',at:[1062,285],size:[.55,.70,1.52],type:'low',room:'donated'},
  {id:'donated-peninsula-square',at:[1082,335],size:[.98,.70,1.02],type:'low',room:'donated'},
  {id:'donated-south-right',at:[1124,407],size:[1.50,.70,.47],type:'low',room:'donated'}
 ];
 for(const [i,x] of [438,577,720,858].entries()){
  d.displays.push({id:'gallery-north-'+i,at:[x,48],size:[3.5,.65,.75],type:'low',room:'long'});
  d.displays.push({id:'gallery-divider-'+i,at:[x,162],size:[3.4,.74,.85],type:'case',room:'long'});
 }
 // 벽 매입부: 뒤벽·측벽·상인방과 하부 받침을 갖는 두꺼운 내부 벽 라이닝.
 // 외벽을 투명 상자로 바꾸지 않는다. 전면 유리만 별도 생성한다.
 d.niches=[
  {id:'donated-peninsula-recess',a:[1093,256],b:[1093,317],inward:[-1,0],depth:.65,sill:.55,top:2.45,room:'donated',evidence:'사용자 제공 확대 상단도: 중앙 상부 세로 진열부. 하단 정사각 진열대와 분리. 높이는 기존 VR 근사'},
  {id:'donated-west-lower-recess',a:[989,338],b:[989,413],inward:[1,0],depth:.85,sill:.60,top:2.45,room:'donated',evidence:'사용자 제공 확대 상단도: 좌하단 긴 진열부. 상부까지 연장하지 않음'},
  {id:'bow-arrow-wall',a:[213,460],b:[300,460],inward:[0,-1],depth:1.10,sill:.55,top:2.35,room:'bow',evidence:'상단 사진 x=213~300,z=429~460와 내부 캠의 안내대 뒤 화살 진열부를 대응. 독립 남측 진열대와 중복 생성하지 않음'},
  {id:'gallery-inset',a:[418,158],b:[512,158],inward:[0,1],depth:.40,sill:.60,top:2.40,room:'long',evidence:'긴 전시영역의 기둥 사이 매입형 진열 구간'}
 ];
 // 확대 상단도 x=186→153→58의 좌상단 꺾임을 기존 건물 좌표에 대응.
 // 벽선 바깥 좌상단은 인접 서비스/연결 영역이며 전시실을 직사각형으로 채우지 않는다.
 d.walls.push(
  {id:'donated-west-upper',a:[1028,256],b:[1028,326],thickness:.16,room:'donated',evidence:'제공 상단도: 좌상단 수직 벽선'},
  {id:'donated-west-jog-a',a:[1028,326],b:[1017,326],thickness:.16,room:'donated',evidence:'제공 상단도: 좌상단 벽의 첫 꺾임'},
  {id:'donated-west-jog-b',a:[1017,326],b:[1017,337],thickness:.16,room:'donated',evidence:'제공 상단도: 좌하단 진열부 위 되돌림'},
  {id:'donated-west-shoulder',a:[1017,337],b:[980,337],thickness:.16,room:'donated',evidence:'제공 상단도: 좌하단으로 넓어지는 공간 경계'}
 );
 d.walls.find(w=>w.id==='donated-entry').openings=[{from:48/165,to:88/165,height:2.25,kind:'opening',note:'제공 확대 상단도의 상부 진입부에 맞춰 이동. 좌표는 기존 전체 평면과의 대응 근사'}];
 d.shell.find(w=>w.id==='shell-donated-east').openings=[{from:.18,to:.40,height:2.4,kind:'opening',note:'제공 상단도 오른쪽 상부의 열린 연결부. 긴 벽은 그 아래에서 시작. 외측 연결 영역은 화면 밖이라 추가하지 않음'}];
 const donated=d.rooms.find(r=>r.id==='donated');
 donated.polygon=[[1028,256],[1145,256],[1145,414],[980,414],[980,337],[1017,337],[1017,326],[1028,326]];
 donated.note='사용자 제공 확대 평면도에 따라 좌상단 꺾임, 중앙 반도형 진열부, 좌하단 긴 진열부와 하단 책상을 재배치. 치수는 상대 비율 근사';
 // VR 전체 평면과 출입문을 기준으로 첨부 평면을 반시계 90도 정합.
 // 직사각 기존 외곽(165×158)에 맞춰 정규화하고 바닥/인접 전시실은 유지한다.
 const turn=p=>[980+(p[1]-256)*165/158,256+(1145-p[0])*158/165];
 const direction=v=>[v[1],-v[0]];
 for(const display of d.displays.filter(v=>v.room==='donated')){
   display.at=turn(display.at);
   const [w,h,depth]=display.size;display.size=[depth*165/158,h,w*158/165];
 }
 for(const niche of d.niches.filter(v=>v.room==='donated')){
   niche.a=turn(niche.a);niche.b=turn(niche.b);niche.inward=direction(niche.inward);
   niche.evidence+='; VR 문 방향을 기준으로 반시계 90도 정합';
 }
 for(const wall of d.walls.filter(v=>v.id.startsWith('donated-west-'))){wall.a=turn(wall.a);wall.b=turn(wall.b);}
 donated.polygon=donated.polygon.map(turn);
 donated.note='VR 전체 평면에 맞게 첨부 평면을 반시계 90도 정합. 중앙 복도 쪽(전체 평면 위쪽) 출입구와 내부 배치 대응';
 const entry=d.walls.find(w=>w.id==='donated-entry');
 entry.openings=[{from:(turn([1145,274.6])[0]-980)/165,to:(turn([1145,312])[0]-980)/165,height:2.4,kind:'opening',note:'첨부 평면 오른쪽 위 개방부를 반시계 90도 정합한 중앙 복도 방향 출입구. VR 문틀 너머 복도 확인'}];
 delete d.shell.find(w=>w.id==='shell-donated-east').openings;
 d.donatedAlignment={rotationDegrees:-90,entrySide:'north-central-corridor',sourceRightOpening:[274.6,312]};
 d.walls.push({id:'bow-worktop-backing',a:[478,363],b:[478,443],height:2.55,thickness:.16,room:'bow',evidence:'체험마루 옆 통로 VR: 긴 작업대 뒤 실벽. 체험마루 벽 쪽이 아닌 중앙 구조 쪽에 배치. 좌표는 근사'});
 d.unresolved=d.unresolved.filter(s=>!s.includes('전시품·전시대'));
 d.unresolved.push('전시대·입구 책상·활 모양 천장·동선 아치를 추가. 전시품과 인쇄물은 제외. 위치·곡률·개수는 관찰에 따른 근사이며 실측 복제는 아님');
})();

