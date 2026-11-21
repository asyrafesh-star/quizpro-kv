import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinnedModel } from 'three/addons/utils/SkeletonUtils.js';

const teams=[
  {name:'MERAH',color:0xf34d63,css:'#f34d63'},
  {name:'BIRU',color:0x42a5ff,css:'#42a5ff'},
  {name:'HIJAU',color:0x46d69b,css:'#46d69b'},
  {name:'KUNING',color:0xffc857,css:'#ffc857'},
  {name:'UNGU',color:0xb28aff,css:'#b28aff'}
];
const heroes=[
  {name:'Bintang',role:'Fighter',skill:'Hentakan bara',model:'assets/arena-heroes/bintang.glb',attack:'Unarmed_Melee_Attack_Punch_A',cast:'2H_Melee_Attack_Spin'},
  {name:'Perisai',role:'Tank',skill:'Benteng waja',model:'assets/arena-heroes/perisai.glb',attack:'Unarmed_Melee_Attack_Punch_A',cast:'Block_Attack'},
  {name:'Bara',role:'Mage',skill:'Bola bara',model:'assets/arena-heroes/bara.glb',attack:'1H_Melee_Attack_Stab',cast:'Spellcast_Shoot'},
  {name:'Bayang',role:'Assassin',skill:'Tebasan bayang',model:'assets/arena-heroes/bayang.glb',attack:'Dualwield_Melee_Attack_Slice',cast:'Dualwield_Melee_Attack_Chop'},
  {name:'Taufan',role:'Scout',skill:'Langkah kilat',model:'assets/arena-heroes/taufan.glb',attack:'1H_Melee_Attack_Stab',cast:'Dodge_Forward'},
  {name:'Seroja',role:'Support',skill:'Cahaya pemulih',model:'assets/arena-heroes/bara.glb',skin:0xd5a9ff,attack:'Unarmed_Melee_Attack_Punch_A',cast:'Spellcast_Long'}
];
const questions=[
  {q:'Apakah maksud nombor 205 pada saiz tayar 205/55 R16?',a:['Diameter rim 205 inci','Lebar tayar 205 mm','Nisbah profil 205%','Tahun tayar dibuat'],c:1},
  {q:'Apakah fungsi injap tayar (valve)?',a:['Mengunci nat roda','Membenarkan udara masuk dan mengekalkan tekanan','Mengukur suhu enjin','Memegang pad brek'],c:1},
  {q:'Jika dinding sisi tayar mempunyai benjol, apakah tindakan yang betul?',a:['Teruskan memandu laju','Tampal bahagian luar sahaja','Ganti tayar dan periksa puncanya','Tambah minyak enjin'],c:2},
  {q:'Bilakah tekanan tayar paling sesuai diperiksa?',a:['Selepas perjalanan jauh','Semasa tayar masih sejuk','Selepas tayar dipam panas','Ketika hujan sahaja'],c:1},
  {q:'Apakah fungsi bunga pada permukaan tayar?',a:['Mencengkam jalan dan menyalirkan air','Menambah berat rim','Menyejukkan brek','Mengunci nat roda'],c:0}
];
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let selectedTeam=1,selectedHero=0,perTeam=5,scene,camera,renderer,world=[],units=[],bases=[],human=null,raf=0,lastFrame=0,elapsed=0,remaining=180,joy={x:0,y:0},keys=new Set(),paused=false,gameOver=false,questionIndex=0,activeSkill=0,attackReady=0,skillReady=[0,0,0,0],feedTimer=0;
const teamChoices=$('teamChoices'),heroChoices=$('heroChoices');
const heroLoader=new GLTFLoader(),heroAssetCache=new Map();
teams.forEach((t,i)=>{const b=document.createElement('button');b.className='team-pick'+(i===selectedTeam?' active':'');b.innerHTML=`<span class="team-dot" style="background:${t.css}"></span>${t.name}`;b.onclick=()=>{selectedTeam=i;teamChoices.querySelectorAll('.team-pick').forEach((x,j)=>x.classList.toggle('active',i===j));};teamChoices.append(b);});
heroes.forEach((h,i)=>{const b=document.createElement('button');b.className='hero-pick'+(i===selectedHero?' active':'');b.innerHTML=`<b>${h.name}</b><small>${h.role} · ${h.skill}</small>`;b.onclick=()=>{selectedHero=i;heroChoices.querySelectorAll('.hero-pick').forEach((x,j)=>x.classList.toggle('active',i===j));};heroChoices.append(b);});
function setCount(next){perTeam=clamp(next,4,6);$('playerCount').textContent=perTeam;}
$('countMinus').onclick=()=>setCount(perTeam-1);$('countPlus').onclick=()=>setCount(perTeam+1);

function makeHero(teamIndex,heroIndex,isHuman,index){
  const team=teams[teamIndex],h=heroes[heroIndex],group=new THREE.Group();
  const visual=new THREE.Group();group.add(visual);
  const mat=new THREE.MeshStandardMaterial({color:team.color,roughness:.72,metalness:.05});
  const trim=new THREE.MeshStandardMaterial({color:new THREE.Color(team.color).multiplyScalar(.62),roughness:.78});
  const face=new THREE.MeshStandardMaterial({color:0xf5c9a8,roughness:.85});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.48,.72,3,6),mat);body.position.y=1.12;visual.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.34,7,6),face);head.position.y=1.94;visual.add(head);
  const helm=new THREE.Mesh(new THREE.ConeGeometry(.38,.38,5),trim);helm.position.y=2.25;visual.add(helm);
  const blade=new THREE.Mesh(new THREE.BoxGeometry(.13,.78,.18),new THREE.MeshStandardMaterial({color:0xe7f2ff,metalness:.6,roughness:.25}));blade.position.set(.63,1.12,0);blade.rotation.z=-.3;visual.add(blade);
  const mark=new THREE.Mesh(new THREE.CylinderGeometry(.62,.78,.12,8),new THREE.MeshStandardMaterial({color:team.color,transparent:true,opacity:.6}));mark.position.y=.1;group.add(mark);
  group.traverse(o=>{if(o.isMesh)o.castShadow=false;});
  scene.add(group);
  return{team:teamIndex,hero:heroIndex,group,visual,hp:100,maxHp:100,isHuman,index,alive:true,respawn:0,attackAt:0,botAt:0,angle:Math.random()*Math.PI*2,animationState:'',actionUntil:0};
}
function getHeroAsset(heroIndex){
  const path=heroes[heroIndex].model;
  if(!heroAssetCache.has(path)){const request=new Promise((resolve,reject)=>heroLoader.load(path,resolve,undefined,reject));heroAssetCache.set(path,request);request.catch(()=>heroAssetCache.delete(path));}
  return heroAssetCache.get(path);
}
function setHeroAnimation(unit,name,loop=true){
  if(!unit?.mixer||!unit.clips)return;
  const clip=unit.clips.find(c=>c.name===name)||unit.clips.find(c=>c.name==='Idle');
  if(!clip||unit.animationState===clip.name)return;
  const next=unit.mixer.clipAction(clip);next.reset();next.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);next.clampWhenFinished=!loop;next.fadeIn(.14).play();
  if(unit.activeAction)unit.activeAction.crossFadeTo(next,.14,false);
  unit.activeAction=next;unit.animationState=clip.name;
  unit.actionUntil=loop?0:elapsed+clip.duration;
}
function attachHeroAsset(unit,gltf){
  unit.visual.traverse(o=>{if(o.isMesh){o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();}});unit.visual.clear();const model=cloneSkinnedModel(gltf.scene);const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
  const scale=2.7/Math.max(size.y,.01);model.scale.setScalar(scale);const scaledBox=new THREE.Box3().setFromObject(model),center=scaledBox.getCenter(new THREE.Vector3());model.position.set(-center.x-scaledBox.min.x*0,-scaledBox.min.y,-center.z);
  const teamTint=new THREE.Color(teams[unit.team].color),skinTint=heroes[unit.hero].skin?new THREE.Color(heroes[unit.hero].skin):null;
  model.traverse(o=>{if(!o.isMesh)return;o.castShadow=false;o.receiveShadow=false;o.frustumCulled=true;if(Array.isArray(o.material))o.material=o.material.map(m=>tintHeroMaterial(m,teamTint,skinTint));else o.material=tintHeroMaterial(o.material,teamTint,skinTint);});
  unit.visual.add(model);unit.model=model;unit.clips=gltf.animations;unit.mixer=new THREE.AnimationMixer(model);unit.animationState='';setHeroAnimation(unit,'Idle',true);
}
function tintHeroMaterial(source,teamTint,skinTint){const material=source.clone();if(material.color){material.color.lerp(teamTint,.18);if(skinTint)material.color.lerp(skinTint,.28);}material.roughness=Math.max(material.roughness||0,.68);return material;}
function loadArenaLeaders(){
  const leaders=units.filter(u=>u.index===0),modelHero=selectedHero;
  getHeroAsset(modelHero).then(gltf=>{for(const unit of leaders)if(units.includes(unit)&&unit.alive)attachHeroAsset(unit,gltf);toast(`${heroes[modelHero].name} dimuat · animasi berjalan, pukul dan skill sedia`);}).catch(error=>{console.warn('Hero GLB gagal dimuat',error);toast('Model 3D gagal dimuat. Periksa sambungan internet dan cuba lagi.');});
}
function addBase(i){
  const angle=-Math.PI/2+i*Math.PI*2/5,x=Math.cos(angle)*24,z=Math.sin(angle)*24,t=teams[i];
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(4.6,5.1,1,5),new THREE.MeshStandardMaterial({color:t.color,roughness:.86}));platform.position.set(x,.1,z);platform.rotation.y=angle;scene.add(platform);
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(1.45,2,5.5,6),new THREE.MeshStandardMaterial({color:t.color,roughness:.5,metalness:.12}));tower.position.set(x,3,z);scene.add(tower);
  const cap=new THREE.Mesh(new THREE.ConeGeometry(1.85,1.45,6),new THREE.MeshStandardMaterial({color:0xe9f4ff,roughness:.35,metalness:.15}));cap.position.set(x,6.35,z);scene.add(cap);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.25,.12,5,8),new THREE.MeshStandardMaterial({color:t.color,emissive:t.color,emissiveIntensity:.35}));ring.position.set(x,1,z);ring.rotation.x=Math.PI/2;scene.add(ring);
  bases.push({team:i,hp:100,maxHp:100,x,z,objects:[platform,tower,cap,ring]});
  const midX=x*.5,midZ=z*.5,road=new THREE.Mesh(new THREE.BoxGeometry(3,.12,Math.hypot(x,z)),new THREE.MeshStandardMaterial({color:0x273954,roughness:1}));road.position.set(midX,.12,midZ);road.rotation.y=-angle;scene.add(road);
}
function initScene(){
  const canvas=$('world');renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x0a1220);
  scene=new THREE.Scene();scene.background=new THREE.Color(0x0a1220);scene.fog=new THREE.Fog(0x0a1220,42,90);
  camera=new THREE.PerspectiveCamera(48,canvas.clientWidth/canvas.clientHeight,.1,130);camera.position.set(0,34,40);
  scene.add(new THREE.HemisphereLight(0xbfdcff,0x263246,2.1));const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(-18,35,22);scene.add(sun);
  const floor=new THREE.Mesh(new THREE.CylinderGeometry(33,36,.5,5),new THREE.MeshStandardMaterial({color:0x14243a,roughness:1}));floor.position.y=-.35;floor.rotation.y=Math.PI/5;scene.add(floor);
  const inner=new THREE.Mesh(new THREE.CylinderGeometry(10,11,.08,10),new THREE.MeshStandardMaterial({color:0x203757,roughness:1}));inner.position.y=-.03;scene.add(inner);
  const core=new THREE.Mesh(new THREE.OctahedronGeometry(2,0),new THREE.MeshStandardMaterial({color:0x9bcaff,emissive:0x3577ca,emissiveIntensity:.55,roughness:.3}));core.position.y=2;scene.add(core);world.push(core);
  for(let i=0;i<5;i++)addBase(i);
  // Low-cost lane markers: one shared geometry and material, no textures or model downloads.
  const markerGeo=new THREE.BoxGeometry(.18,.08,1),markerMat=new THREE.MeshStandardMaterial({color:0x8da6c8,roughness:1});
  for(let i=0;i<5;i++){const a=-Math.PI/2+i*Math.PI*2/5;for(let d=7;d<22;d+=3){const m=new THREE.Mesh(markerGeo,markerMat);m.position.set(Math.cos(a)*d,.04,Math.sin(a)*d);m.rotation.y=-a;scene.add(m);world.push(m);}}
  const onResize=()=>{if(!renderer)return;const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};window.addEventListener('resize',onResize);
}
function placeUnits(){
  units=[];bases.forEach(b=>b.hp=100);
  const positions=[];
  for(let ti=0;ti<5;ti++){
    const angle=-Math.PI/2+ti*Math.PI*2/5,base=bases[ti];
    for(let n=0;n<perTeam;n++){
      const humanHere=ti===selectedTeam&&n===0;
      const heroIndex=humanHere?selectedHero:(n+ti*3)%heroes.length;
      const u=makeHero(ti,heroIndex,humanHere,n);
      const spread=(n-(perTeam-1)/2)*1.35;u.group.position.set(base.x-Math.cos(angle)*(5+n*.75)+Math.cos(angle+Math.PI/2)*spread,.1,base.z-Math.sin(angle)*(5+n*.75)+Math.sin(angle+Math.PI/2)*spread);
      u.spawnX=u.group.position.x;u.spawnZ=u.group.position.z;units.push(u);if(humanHere)human=u;
    }
  }
}
function startGame(){
  if(raf)cancelAnimationFrame(raf);$('setup').classList.add('hidden');$('battle').classList.remove('hidden');$('endModal').classList.add('hidden');$('questionModal').classList.add('hidden');
  if(!renderer)initScene();else{for(const u of units)scene.remove(u.group);}
  placeUnits();elapsed=0;remaining=180;paused=false;gameOver=false;lastFrame=performance.now();updateTeamBars();toast(`Awak bermain sebagai ${heroes[selectedHero].name} · Pasukan ${teams[selectedTeam].name}`);raf=requestAnimationFrame(loop);
  loadArenaLeaders();
}
function nearestEnemy(from,range=Infinity){let best=null,bestD=range;for(const u of units){if(!u.alive||u.team===from.team)continue;const d=u.group.position.distanceTo(from.group.position);if(d<bestD){best=u;bestD=d;}}return best;}
function hurtUnit(u,damage,by){if(!u?.alive)return;u.hp=Math.max(0,u.hp-damage);if(u.hp===0){u.alive=false;u.group.visible=false;u.respawn=5;bases[u.team].hp=Math.max(0,bases[u.team].hp-8);toast(`${heroes[u.hero].name} Pasukan ${teams[u.team].name} ditewaskan`);updateTeamBars();}}
function hit(){if(!human||gameOver||paused)return;const now=elapsed;if(now<attackReady){toast(`Pukul sedia dalam ${Math.ceil(attackReady-now)}s`);return;}attackReady=now+.65;setHeroAnimation(human,heroes[human.hero].attack||'Unarmed_Melee_Attack_Punch_A',false);const target=nearestEnemy(human,6.2);if(!target){toast('Tiada lawan berdekatan. Gerak rapat untuk memukul.');return;}target.group.rotation.y=Math.atan2(human.group.position.x-target.group.position.x,human.group.position.z-target.group.position.z);hurtUnit(target,15,human);toast(`${heroes[human.hero].name} memukul ${heroes[target.hero].name} · −15 HP`);}
function openSkill(which){if(!human||gameOver||paused)return;if(elapsed<skillReady[which]){toast(`Kuasa sedia dalam ${Math.ceil(skillReady[which]-elapsed)}s`);return;}activeSkill=which;questionIndex=(questionIndex+1)%questions.length;const q=questions[questionIndex];$('questionText').textContent=q.q;$('questionFeedback').textContent='';$('closeQuestion').classList.add('hidden');const area=$('questionOptions');area.replaceChildren();q.a.forEach((text,i)=>{const b=document.createElement('button');b.className='answer-choice';b.innerHTML=`<b>${'ABCD'[i]}.</b> ${text}`;b.onclick=()=>answerSkill(i,q.c,b,area);area.append(b);});$('questionModal').classList.remove('hidden');}
function answerSkill(choice,correct,button,area){const buttons=[...area.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);const q=questions[questionIndex];if(choice===correct){button.classList.add('good');$('questionFeedback').textContent='Betul! Kuasa dilepaskan.';castSkill(activeSkill);skillReady[activeSkill]=elapsed+[12,20,38][activeSkill-1];updateCooldowns();setTimeout(()=>$('questionModal').classList.add('hidden'),750);}else{button.classList.add('bad');buttons[correct].classList.add('good');$('questionFeedback').textContent='Belum tepat. Kuasa tidak aktif; cuba lagi selepas cooldown tiada.';skillReady[activeSkill]=elapsed+4;updateCooldowns();$('closeQuestion').classList.remove('hidden');$('closeQuestion').onclick=()=>$('questionModal').classList.add('hidden');}}
function castSkill(which){setHeroAnimation(human,heroes[human.hero].cast||'Spellcast_Shoot',false);const radius=[0,8,10,13][which],damage=[0,32,24,48][which];let hits=0;for(const u of units){if(!u.alive||u.team===human.team)continue;if(u.group.position.distanceTo(human.group.position)<=radius){hurtUnit(u,damage,human);hits++;}}const pulse=new THREE.Mesh(new THREE.RingGeometry(radius-.25,radius+.25,32),new THREE.MeshBasicMaterial({color:teams[human.team].color,transparent:true,opacity:.85,side:THREE.DoubleSide}));pulse.rotation.x=-Math.PI/2;pulse.position.set(human.group.position.x,.45,human.group.position.z);scene.add(pulse);world.push(pulse);setTimeout(()=>{scene?.remove(pulse);world=world.filter(x=>x!==pulse);pulse.geometry.dispose();pulse.material.dispose();},650);toast(`${heroes[human.hero].skill} kena pada ${hits} lawan`);updateTeamBars();}
function updateCooldowns(){document.querySelectorAll('.skill-btn').forEach(b=>{const n=Number(b.dataset.skill),left=Math.max(0,Math.ceil(skillReady[n]-elapsed));b.classList.toggle('cooldown',left>0);const small=b.querySelector('small');if(small)small.textContent=left?`${left}s`:'Jawab betul';});}
function toast(message){$('hint').textContent=message;clearTimeout(feedTimer);feedTimer=setTimeout(()=>{if($('hint'))$('hint').textContent='Joystick: gerak 360° · Pukul auto-sasar lawan terdekat';},2100);}
function updateTeamBars(){const box=$('teamBars');box.innerHTML=bases.map(b=>{const t=teams[b.team];return`<div class="team-bar"><div class="team-bar-head"><span style="color:${t.css}">${t.name}</span><span>${Math.round(b.hp)}%</span></div><div class="bar-track"><div class="bar-fill" style="width:${b.hp}%;background:${t.css}"></div></div></div>`;}).join('');}
function botStep(dt){for(const u of units){if(u.isHuman||!u.alive)continue;if(u.respawn>0){u.respawn-=dt;if(u.respawn<=0){u.alive=true;u.hp=100;u.group.visible=true;u.group.position.set(u.spawnX,.1,u.spawnZ);}continue;}const target=nearestEnemy(u,18);if(target){const v=new THREE.Vector3().subVectors(target.group.position,u.group.position);const dist=v.length();if(dist>2.2){v.normalize();u.group.position.addScaledVector(v,dt*2.1);u.group.rotation.y=Math.atan2(v.x,v.z);if(elapsed>=u.actionUntil)setHeroAnimation(u,'Running_A',true);}else if(elapsed>u.attackAt){u.attackAt=elapsed+1.7;setHeroAnimation(u,heroes[u.hero].attack||'Unarmed_Melee_Attack_Punch_A',false);hurtUnit(target,5,u);}else if(elapsed>=u.actionUntil)setHeroAnimation(u,'Idle',true);}else{u.angle+=dt*.3;u.group.position.x+=Math.sin(u.angle)*dt*.45;u.group.position.z+=Math.cos(u.angle)*dt*.45;if(elapsed>=u.actionUntil)setHeroAnimation(u,'Walking_A',true);}}}
function moveHuman(dt){if(!human?.alive)return;let x=joy.x,z=joy.y;if(keys.has('ArrowLeft')||keys.has('a'))x-=1;if(keys.has('ArrowRight')||keys.has('d'))x+=1;if(keys.has('ArrowUp')||keys.has('w'))z-=1;if(keys.has('ArrowDown')||keys.has('s'))z+=1;const len=Math.hypot(x,z),running=len>.72,speed=running?8.4:4.6;if(len>1){x/=len;z/=len;}if(len>.05){human.group.position.x+=x*dt*speed;human.group.position.z+=z*dt*speed;human.group.rotation.y=Math.atan2(x,z);if(elapsed>=human.actionUntil)setHeroAnimation(human,running?'Running_A':'Walking_A',true);}else if(elapsed>=human.actionUntil)setHeroAnimation(human,'Idle',true);const r=Math.hypot(human.group.position.x,human.group.position.z);if(r>30){human.group.position.x*=30/r;human.group.position.z*=30/r;}}
function loop(now){if(gameOver)return;raf=requestAnimationFrame(loop);const dt=Math.min(.05,(now-lastFrame)/1000||0);lastFrame=now;if(!paused){elapsed+=dt;remaining=Math.max(0,180-elapsed);moveHuman(dt);botStep(dt);if(human&&!human.alive){human.respawn-=dt;if(human.respawn<=0){human.alive=true;human.hp=100;human.group.visible=true;human.group.position.set(human.spawnX,.1,human.spawnZ);toast('Hero awak kembali ke markas.');updateTeamBars();}}}
  $('clock').textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(Math.floor(remaining%60)).padStart(2,'0')}`;updateCooldowns();if(Math.floor(elapsed)%3===0&&Math.floor(elapsed)!==Math.floor(elapsed-dt))updateTeamBars();units.forEach(u=>u.mixer?.update(dt));
  if(human){const p=human.group.position,target=new THREE.Vector3(p.x+10,26,p.z+30);camera.position.lerp(target,.075);camera.lookAt(p.x,0,p.z);}
  world.forEach(o=>{if(o.geometry?.type==='OctahedronGeometry')o.rotation.y+=dt*.48;});renderer.render(scene,camera);
  const alive=bases.filter(b=>b.hp>0);if(alive.length<=1||remaining<=0)finishGame(alive);
}
function finishGame(alive){gameOver=true;cancelAnimationFrame(raf);const ranked=[...bases].sort((a,b)=>b.hp-a.hp);$('winnerTitle').textContent=`🏆 Pasukan ${teams[(alive[0]||ranked[0]).team].name} menang!`;$('finalTeams').innerHTML=ranked.map((b,i)=>`<div class="final-team"><b style="color:${teams[b.team].css}">${i+1}. ${teams[b.team].name}</b><span>Markas ${Math.round(b.hp)}% · ${units.filter(u=>u.team===b.team&&u.alive).length} hero</span></div>`).join('');$('endModal').classList.remove('hidden');}
function resetGame(){for(const u of units)scene?.remove(u.group);units=[];bases.forEach(b=>b.objects.forEach(o=>scene?.remove(o)));bases=[];for(const o of world)scene?.remove(o);world=[];if(renderer){renderer.dispose();renderer=null;scene=null;camera=null;}human=null;skillReady=[0,0,0,0];attackReady=0;$('battle').classList.add('hidden');$('endModal').classList.add('hidden');$('setup').classList.remove('hidden');}
$('startBtn').onclick=startGame;$('attackBtn').onclick=hit;document.querySelectorAll('.skill-btn').forEach(b=>b.onclick=()=>openSkill(Number(b.dataset.skill)));$('againBtn').onclick=resetGame;
const joyPad=$('joystick'),knob=$('knob');let pointer=null;function joyMove(e){if(pointer!==e.pointerId)return;const r=joyPad.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,max=r.width*.34,len=Math.hypot(dx,dy),s=len>max?max/len:1;joy.x=clamp(dx*s/max,-1,1);joy.y=clamp(dy*s/max,-1,1);knob.style.transform=`translate(${joy.x*max}px,${joy.y*max}px)`;}joyPad.addEventListener('pointerdown',e=>{pointer=e.pointerId;joyPad.setPointerCapture(pointer);joyMove(e);});joyPad.addEventListener('pointermove',joyMove);function joyEnd(){pointer=null;joy={x:0,y:0};knob.style.transform='translate(0,0)';}joyPad.addEventListener('pointerup',joyEnd);joyPad.addEventListener('pointercancel',joyEnd);
window.addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(k))e.preventDefault();keys.add(k);if(k===' '&&!e.repeat)hit();});window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));$('pauseBtn').onclick=()=>{paused=!paused;$('pauseBtn').textContent=paused?'Sambung':'Jeda';toast(paused?'Permainan dijeda':'Permainan disambung');};
