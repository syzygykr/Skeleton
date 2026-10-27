/* VR 순회 및 4방향 사진 대조에 따른 상세. 모든 위치/치수는 상대 비율 근사.
 * 전시대와 건축 장식은 보존하되 전시품·인쇄물·모니터는 생성하지 않는다. */
(()=>{
 const d=MuseumLayout;
 d.detailBoxes=[
  {id:'reception-body',at:[255,404],size:[3.15,.94,1.10],color:[.83,.84,.79],room:'bow'},
  {id:'reception-top',at:[255,404],bottom:.94,size:[3.22,.09,1.17],color:[.83,.84,.79],room:'bow'},
  {id:'reception-return',at:[218,414],size:[.60,.94,.80],color:[.83,.84,.79],room:'bow'}
 ];
 d.frames.push(
  {id:'entrance-glass-north',a:[205,318],b:[205,350],height:2.5,divisions:1,glazed:true,room:'bow',evidence:'상단·내부 캠 대조: 표찰 벽 쪽 유리 전실. 남쪽 책상과 문 위치를 함께 대응'},
  {id:'entrance-glass-south',a:[205,383],b:[205,496],height:2.5,divisions:3,glazed:true,room:'bow',evidence:'상단·내부 캠 대조: 문 남쪽에 안내 책상. 유리 전실 전체 꺾임은 별도 확인 필요'}
 );
 d.entranceClearance={min:[170,354],max:[242,379],doorA:[205,350],doorB:[205,383]};
 d.walls.push({id:'entrance-transom',a:[205,318],b:[205,496],bottom:2.5,height:2.8,thickness:.14,room:'bow',evidence:'기존 유리 전실의 상부 연결부. 출입구 아래는 개방 유지'});
 d.detailArches=[{id:'video-route-arch',a:[294,305],b:[400,305],spring:2.18,rise:.38,depth:.14,thickness:.14,posts:true,room:'bow',evidence:'하향 90도 회전한 구분벽 끝 (400,305)에 아치 기둥을 맞춰 직각 접합'}];
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
 // 첨부 내부 사진의 기둥 사이는 유리 상자가 아니라 양면 접근형 목재 테이블.
 d.galleryTables=[
  {id:'gallery-table-1',a:[407,175],b:[541,175],depth:.90,height:.90,room:'long'},
  {id:'gallery-table-2',a:[555,175],b:[683,175],depth:.90,height:.90,room:'long'}
 ];
 d.displays.push({id:'horse-platform',at:[335,84],size:[4.15,.26,2.65],type:'platform',room:'long'});
 // 벽 매입부: 뒤벽·측벽·상인방과 하부 받침을 갖는 두꺼운 내부 벽 라이닝.
 // 외벽을 투명 상자로 바꾸지 않는다. 전면 유리만 별도 생성한다.
 d.niches=[
  {id:'donated-peninsula-recess',a:[1093,256],b:[1093,317],inward:[-1,0],depth:.65,sill:.55,top:2.45,room:'donated',evidence:'사용자 제공 확대 상단도: 중앙 상부 세로 진열부. 하단 정사각 진열대와 분리. 높이는 기존 VR 근사'},
  {id:'donated-west-lower-recess',a:[989,338],b:[989,413],inward:[1,0],depth:.85,sill:.60,top:2.45,room:'donated',evidence:'사용자 제공 확대 상단도: 좌하단 긴 진열부. 상부까지 연장하지 않음'},
 ];
 for(const [i,ends] of [[407,541],[555,683],[697,811],[827,953]].entries()){
  d.niches.push({id:'gallery-tall-wall-'+i,a:[ends[0],29],b:[ends[1],29],inward:[0,1],depth:.65,sill:.25,top:2.50,room:'long',evidence:'첨부 내부 사진 3: 외벽 쪽 긴 받침과 상하로 긴 진열 공간. 낮은 독립 유리 상자로 표현하지 않음'});
 }
 // 오른쪽 끝 (400,175)을 고정한 하향 90도 회전: (x,z) → (400+z-175,175+400-x).
 d.galleryTransitionAlignment={pivot:[400,175],oldStart:[270,175],newStart:[400,305],degrees:-90};
 d.walls.push({id:'gallery-transition',a:[400,305],b:[400,175],height:2.8,thickness:.18,room:'long',evidence:'사용자 빨간 선 지시: 오른쪽 끝을 고정하고 문·진열부를 아래로 90도 회전. 문짝·족자 없음',openings:[{from:.42,to:.73,height:2.30,kind:'opening',note:'회전 전과 동일한 폭과 상대 위치의 열린 문'}]});
 d.niches.push({id:'gallery-transition-display',a:[405,299],b:[405,257],inward:[1,0],depth:.42,sill:.45,top:2.30,room:'long',evidence:'문과 같은 기준점으로 90도 회전한 빈 세로 전시대. 높이·폭·깊이 유지'});
 d.beams.push({id:'gallery-to-bow-joint',a:[400,305],b:[400,310],bottom:2.42,height:.11,thickness:.14,evidence:'회전한 구분벽·아치 기둥과 기존 하부 격자 북측 보 사이의 짧은 접합부'});
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
 d.walls.push({id:'bow-worktop-backing',a:[442,320],b:[442,410],height:2.55,thickness:.16,room:'bow',evidence:'사용자 1번 빨간 선 지시: 벽과 작업대를 왼쪽으로 이동. 이전 x=478 배치는 폐기'});
 // 근접 사진의 벽 부착형 작업대. 동측 두 앞 모서리만 둥글게 처리.
 function roundedFront(back,front,north,south,r){
  const p=[[back,north],[front-r,north]];
  for(let i=1;i<=8;i++){const t=-Math.PI/2+i*Math.PI/16;p.push([front-r+r*Math.cos(t),north+r+r*Math.sin(t)]);}
  p.push([front,south-r]);
  for(let i=1;i<=8;i++){const t=i*Math.PI/16;p.push([front-r+r*Math.cos(t),south-r+r*Math.sin(t)]);}
  p.push([back,south]);return p;
 }
 d.detailExtrusions=[
  {id:'maru-worktop-plinth',polygon:roundedFront(444,460,332,402,5),bottom:.12,height:.54,color:[.79,.77,.71],room:'bow'},
  {id:'maru-worktop-kick',polygon:roundedFront(445,459,333,401,5),bottom:.045,height:.075,color:[.20,.21,.20],room:'bow'},
  {id:'maru-worktop',polygon:roundedFront(442,464,329,405,6),bottom:.66,height:.20,color:[.44,.27,.15],room:'bow'},
  {id:'maru-worktop-surface',polygon:roundedFront(442,464,329,405,6),bottom:.86,height:.035,color:[.61,.42,.24],room:'bow'}
 ];
 d.reliefDisplays=[{id:'bow-relief-wall',a:[550,315],b:[550,415],inward:[-1,0],depth:.24,bottom:.45,top:2.35,room:'bow',evidence:'사용자 2번 지시: 체험마루 서측 벽에 통합된 부조용 빈 전시부. 부조 자체는 생성하지 않음'}];
 // 기획전시실 앞 흰 구분벽과 오목한 전시부. 체험장 입구는 서측에 확보.
 d.walls.push(
  {id:'immersive-west',a:[818,24],b:[818,175],thickness:.18,room:'immersive',evidence:'첨부 사진과 기존 상단 뷰의 우측 체험 영역 대응. 기존 보·기둥선 X818에 정렬',openings:[{from:.65,to:.95,height:2.30,kind:'opening',note:'상부 전시 영역에서 체험장으로 진입하는 열린 통로. 위치·폭 근사'}]},
  {id:'immersive-front',a:[818,175],b:[1056,175],thickness:.50,room:'immersive',evidence:'첨부 촬영 사진의 기획전시실 앞 흰 분리벽. 오목한 전시부는 작품 없이 비움',openings:[{from:.34,to:.82,sill:.65,height:2.15,kind:'recess',recessDirection:[0,-1],note:'통과하는 문이 아닌 막힌 뒷면을 가진 벽 전시 홈. 모서리는 직각 근사'}]},
  {id:'immersive-east-return',a:[1056,175],b:[1056,118],thickness:.18,room:'immersive',evidence:'기존 외곽의 북동측 꺾임으로 구분벽을 연결. 측면 세부 길이는 근사'}
 );
 d.rooms.find(r=>r.id==='long').name='상부 전시 영역';
 d.rooms.find(r=>r.id==='long').polygon=[[270,24],[818,24],[818,175],[270,175]];
 d.rooms.push({id:'immersive',name:'실감형체험장',color:[.67,.70,.73],polygon:[[818,24],[970,24],[970,118],[1056,118],[1056,175],[818,175]],note:'기획전시실 앞을 흰 벽으로 구분한 별도 공간. 서측 열린 출입구, 전면 벽의 빈 전시 홈. 치수는 사진 대응 근사'});
 d.niches.find(n=>n.id==='gallery-tall-wall-3').room='immersive';
 d.shell.find(w=>w.id==='shell-projection').room='immersive';
 d.immersiveBounds={west:818,north:24,south:175,eastReturn:1056};
 d.unresolved=d.unresolved.filter(s=>!s.includes('전시품·전시대'));
 d.unresolved.push('전시대·입구 책상·활 모양 천장·동선 아치를 추가. 전시품과 인쇄물은 제외. 위치·곡률·개수는 관찰에 따른 근사이며 실측 복제는 아님');
})();


