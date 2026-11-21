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
  {q:'Apakah fungsi bunga pada permukaan tayar?',a:['Mencengkam jalan dan menyalirkan air','Menambah berat rim','Menyejukkan brek','Mengunci nat roda'],c:0},
  {q:'Huruf R pada tanda 205/55 R16 bermaksud?',a:['Tayar jenis racing','Binaan radial','Rim boleh laras','Had kelajuan rendah'],c:1},
  {q:'Nombor 16 pada 205/55 R16 merujuk kepada?',a:['Lebar tayar dalam cm','Diameter rim dalam inci','Umur tayar','Tekanan angin'],c:1},
  {q:'Indeks beban tayar menunjukkan?',a:['Kapasiti beban maksimum mengikut spesifikasi','Kelajuan sebenar kereta','Ketebalan bunga','Suhu operasi'],c:0},
  {q:'Apakah kesan tekanan angin terlalu rendah?',a:['Penggunaan bahan api boleh meningkat','Tayar menjadi lebih ringan','Brek sentiasa sejuk','Stereng terkunci'],c:0},
  {q:'Haus berlebihan di kedua-dua bahu tayar biasanya menandakan?',a:['Tekanan angin rendah','Tekanan angin terlalu tinggi','Rim terlalu besar','Bateri lemah'],c:0},
  {q:'Haus lebih banyak di bahagian tengah bunga boleh menandakan?',a:['Tekanan angin terlalu tinggi','Tayar kurang angin','Penjajaran sempurna','Minyak enjin kurang'],c:0},
  {q:'Apakah tujuan imbangan roda?',a:['Mengurangkan gegaran ketika roda berputar','Menaikkan kuasa enjin','Mengunci stereng','Mengurangkan suhu tayar'],c:0},
  {q:'Apakah tujuan penjajaran roda?',a:['Membantu roda menghala dan haus dengan betul','Mengisi angin tayar','Membaiki bateri','Menambah bunga tayar'],c:0},
  {q:'Apakah yang patut dibuat jika stereng bergetar pada kelajuan tertentu?',a:['Periksa imbangan roda dan tayar','Tambah air radiator sahaja','Tukar hon','Matikan lampu'],c:0},
  {q:'Apakah risiko bunga tayar yang terlalu haus ketika jalan basah?',a:['Cengkaman berkurang dan mudah tergelincir','Kereta lebih senyap sahaja','Jarak membrek sentiasa pendek','Tekanan tayar naik sendiri'],c:0},
  {q:'Mengapa tayar diputar mengikut jadual servis?',a:['Membantu keseragaman kehausan','Menukar arah enjin','Mengecilkan rim','Mengurangkan bilangan nat'],c:0},
  {q:'Kod empat digit pada tayar seperti 2425 lazimnya menunjukkan?',a:['Minggu dan tahun pengeluaran','Saiz rim dan tekanan','Had laju dan beban','Jenis injap'],c:0},
  {q:'Tekanan tayar yang disyorkan biasanya dirujuk pada?',a:['Label kenderaan atau buku panduan','Warna rim','Saiz bateri','Nombor pendaftaran'],c:0},
  {q:'Apakah alat yang sesuai untuk mengukur tekanan tayar?',a:['Tolok tekanan','Playar','Pemutar skru','Kunci penapis'],c:0},
  {q:'Sebelum membuka roda, kenderaan perlu?',a:['Diletakkan di tempat rata dan selamat','Dibiarkan bergerak perlahan','Dihidupkan pada gear tinggi','Dinaikkan dengan tangan'],c:0},
  {q:'Apakah fungsi nat roda?',a:['Memegang roda pada hab','Mengukur tekanan angin','Mengunci pintu','Mengisi minyak brek'],c:0},
  {q:'Mengapa nat roda diketatkan mengikut turutan bersilang?',a:['Membantu tekanan pemasangan sekata','Supaya rim bertukar warna','Untuk menambah tekanan tayar','Supaya brek lebih panas'],c:0},
  {q:'Apakah tindakan selamat jika tayar pancit ketika memandu?',a:['Perlahankan kenderaan dan berhenti di tempat selamat','Brek mengejut di tengah jalan','Pecut ke bengkel','Terus membelok laju'],c:0},
  {q:'Apakah maksud aquaplaning?',a:['Tayar hilang sentuhan mencukupi dengan jalan kerana air','Enjin terlalu panas','Brek tangan terkunci','Rim menjadi longgar'],c:0},
  {q:'Untuk mengurangkan risiko aquaplaning, pemandu patut?',a:['Kurangkan kelajuan ketika hujan lebat','Tambah kelajuan di lopak','Matikan pengelap cermin','Tekan brek tangan'],c:0},
  {q:'Apakah fungsi tayar simpanan?',a:['Kegunaan sementara apabila tayar utama rosak','Menambah kuasa enjin','Menggantikan bateri','Menyejukkan brek'],c:0},
  {q:'Mengapa tayar ganti juga perlu diperiksa?',a:['Tekanan angin dan keadaannya boleh berubah','Supaya nombor pendaftaran jelas','Untuk mengubah nisbah gear','Supaya lampu lebih terang'],c:0},
  {q:'Apakah yang perlu dipadankan apabila mengganti tayar?',a:['Saiz dan spesifikasi yang sesuai dengan kenderaan','Warna tayar dengan badan kereta','Jenama minyak enjin','Jenis mentol lampu'],c:0},
  {q:'Apakah tujuan corak alur tayar?',a:['Membantu saliran air dan cengkaman','Menyimpan minyak','Memegang pad brek','Mengunci nat'],c:0},
  {q:'Jika tekanan kiri dan kanan tidak seimbang, apakah yang mungkin berlaku?',a:['Kendalian kenderaan boleh terjejas','Radio berhenti berfungsi','Bateri bertambah cas','Lampu brek bertukar warna'],c:0}
];
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let selectedTeam=1,selectedHero=0,perTeam=6,scene,camera,renderer,world=[],units=[],bases=[],human=null,raf=0,lastFrame=0,elapsed=0,remaining=180,joy={x:0,y:0},keys=new Set(),paused=false,gameOver=false,questionIndex=-1,activeSkill=0,attackReady=0,skillReady=[0,0,0,0],feedTimer=0;
const teamChoices=$('teamChoices'),heroChoices=$('heroChoices');
const heroLoader=new GLTFLoader(),heroAssetCache=new Map();
teams.forEach((t,i)=>{const b=document.createElement('button');b.className='team-pick'+(i===selectedTeam?' active':'');b.innerHTML=`<span class="team-dot" style="background:${t.css}"></span>${t.name}`;b.onclick=()=>{selectedTeam=i;teamChoices.querySelectorAll('.team-pick').forEach((x,j)=>x.classList.toggle('active',i===j));};teamChoices.append(b);});
function heroPortrait(i){const c=`#${heroes[i].model.includes('bintang')?'69c9ff':heroes[i].model.includes('perisai')?'d1b779':heroes[i].model.includes('bara')?'ff8a50':heroes[i].model.includes('bayang')?'ad8cff':'66dbca'}`;return `<svg viewBox="0 0 120 130" aria-hidden="true"><path fill="#101a2b" d="M0 120h120v10H0z"/><ellipse cx="60" cy="118" rx="38" ry="7" fill="#0008"/><path fill="${c}" d="M34 112l5-37 21-11 21 11 5 37-12 4H46z"/><path fill="#f1c7a3" d="M45 40q1-21 15-21t15 21l-5 22H50z"/><path fill="#eef5ff" d="M40 38l20-24 22 24-7 5-4-9-7 8-5-8-9 9-4-8-5 8z"/><path fill="#d9e7ff" d="M47 52h26v9H47z"/><path fill="#d9e7ff" d="M38 74l-14 25 8 5 18-22zm44 0 14 25-8 5-18-22z"/><path fill="#f2f6ff" d="M50 100h10v20H47zm12 0h10v20H61z"/><path fill="${c}" d="M81 50l23 31-5 4-24-27z"/><path stroke="#fff" stroke-width="3" d="M100 80l8 7"/></svg>`;}
function updateHeroCards(){heroChoices.replaceChildren();heroes.forEach((h,i)=>{const b=document.createElement('button');b.type='button';b.className='hero-pick'+(i===selectedHero?' active':'');b.innerHTML=`<span class="hero-art">${heroPortrait(i)}</span><span class="hero-info"><b>${h.name}</b><small>${h.role} · ${h.skill}</small></span>`;b.onclick=()=>{selectedHero=i;updateHeroCards();};heroChoices.append(b);});}
updateHeroCards();
const nickInput=$('nickName');nickInput.addEventListener('input',()=>{nickInput.value=nickInput.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);});
function setCount(next){perTeam=clamp(next,4,6);$('playerCount').textContent=perTeam;}
$('countMinus').onclick=()=>setCount(perTeam-1);$('countPlus').onclick=()=>setCount(perTeam+1);setCount(6);

function makeNameTag(label,color){const canvas=document.createElement('canvas');canvas.width=384;canvas.height=112;const ctx=canvas.getContext('2d');ctx.fillStyle='#07101ee8';ctx.strokeStyle=color;ctx.lineWidth=8;ctx.beginPath();ctx.roundRect(8,8,368,96,24);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 52px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label.slice(0,6),192,57,330);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.scale.set(3.6,1.05,1);sprite.position.y=5.3;return sprite;}

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
  visual.scale.setScalar(1.45);
  const nick=isHuman?($('nickName').value.trim().slice(0,6)||'PELAJA'):`${team.name[0]}BOT${index}`.slice(0,6);if(isHuman)group.add(makeNameTag(nick,team.css));
  group.traverse(o=>{if(o.isMesh)o.castShadow=false;});
  scene.add(group);
  return{team:teamIndex,hero:heroIndex,group,visual,nick,hp:100,maxHp:100,isHuman,index,alive:true,respawn:0,attackAt:0,botAt:0,angle:Math.random()*Math.PI*2,animationState:'',actionUntil:0};
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
  unit.visual.scale.setScalar(1);const scale=3.6/Math.max(size.y,.01);model.scale.setScalar(scale);const scaledBox=new THREE.Box3().setFromObject(model),center=scaledBox.getCenter(new THREE.Vector3());model.position.set(-center.x,-scaledBox.min.y,-center.z);
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
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(4.6,5.1,.5,5),new THREE.MeshStandardMaterial({color:t.color,roughness:.86}));platform.position.set(x,-.05,z);platform.rotation.y=angle;scene.add(platform);
  const towers=[],specs=[['KECIL',80,.72,2.5],['KECIL',80,.72,2.5],['SEDERHANA',130,.92,3.5],['SEDERHANA',130,.92,3.5],['BESAR',220,1.25,4.8]],radii=[30,25,20,15,10];
  specs.forEach(([kind,hp,radius,height],n)=>{const r=radii[n],tx=Math.cos(angle)*r,tz=Math.sin(angle)*r,g=new THREE.Group();g.position.set(tx,0,tz);const stone=new THREE.MeshStandardMaterial({color:t.color,roughness:.62,metalness:.08}),glow=new THREE.MeshStandardMaterial({color:0xeaf4ff,emissive:t.color,emissiveIntensity:.22,roughness:.3});const base=new THREE.Mesh(new THREE.CylinderGeometry(radius*1.55,radius*1.8,.38,6),stone);base.position.y=.19;g.add(base);const shaft=new THREE.Mesh(new THREE.CylinderGeometry(radius*.78,radius,height,6),stone);shaft.position.y=.38+height/2;g.add(shaft);const cap=new THREE.Mesh(new THREE.OctahedronGeometry(radius*1.08,0),glow);cap.position.y=.38+height+.3;g.add(cap);const ring=new THREE.Mesh(new THREE.TorusGeometry(radius*1.45,.09,5,8),new THREE.MeshStandardMaterial({color:t.color,emissive:t.color,emissiveIntensity:.45}));ring.position.y=.46;ring.rotation.x=Math.PI/2;g.add(ring);scene.add(g);towers.push({team:i,index:n,kind,hp,maxHp:hp,x:tx,z:tz,group:g,alive:true,attackAt:0});});
  bases.push({team:i,x,z,towers,objects:[platform]});
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
  units=[];bases.forEach(b=>b.towers.forEach(t=>{t.hp=t.maxHp;t.alive=true;t.group.visible=true;}));
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
function nearestEnemyTower(from,range=Infinity){let best=null,bestD=range;for(const base of bases){if(base.team===from.team)continue;for(const tower of base.towers){if(!tower.alive)continue;const d=Math.hypot(tower.x-from.group.position.x,tower.z-from.group.position.z);if(d<bestD){best=tower;bestD=d;}}}return best;}
function damageTower(tower,damage,source){if(!tower?.alive)return;tower.hp=Math.max(0,tower.hp-damage);if(tower.hp===0){tower.alive=false;tower.group.visible=false;toast(`${tower.kind} menara ${teams[tower.team].name} runtuh!`);updateTeamBars();}else if(source?.isHuman)updateTeamBars();}
function hit(){if(!human||gameOver||paused)return;const now=elapsed;if(now<attackReady){toast(`Pukul sedia dalam ${Math.ceil(attackReady-now)}s`);return;}const target=nearestEnemyTower(human,6.5);if(!target){toast('Gerak rapat ke menara musuh untuk memukul.');return;}attackReady=now+.65;setHeroAnimation(human,heroes[human.hero].attack||'Unarmed_Melee_Attack_Punch_A',false);human.group.rotation.y=Math.atan2(target.x-human.group.position.x,target.z-human.group.position.z);damageTower(target,16,human);toast(`${human.nick} pukul menara ${teams[target.team].name} · −16 HP`);}
function openSkill(which){if(!human||gameOver||paused)return;if(elapsed<skillReady[which]){toast(`Kuasa sedia dalam ${Math.ceil(skillReady[which]-elapsed)}s`);return;}activeSkill=which;questionIndex=(questionIndex+1)%questions.length;const q=questions[questionIndex];$('questionText').textContent=q.q;$('questionFeedback').textContent='';$('closeQuestion').classList.add('hidden');const area=$('questionOptions');area.replaceChildren();q.a.forEach((text,i)=>{const b=document.createElement('button');b.className='answer-choice';b.innerHTML=`<b>${'ABCD'[i]}.</b> ${text}`;b.onclick=()=>answerSkill(i,q.c,b,area);area.append(b);});$('questionModal').classList.remove('hidden');}
function answerSkill(choice,correct,button,area){const buttons=[...area.querySelectorAll('button')];const q=questions[questionIndex];if(choice===correct){buttons.forEach(b=>b.disabled=true);button.classList.add('good');$('questionFeedback').textContent='Betul! Kuasa dilepaskan.';castSkill(activeSkill);skillReady[activeSkill]=elapsed+[12,20,38][activeSkill-1];updateCooldowns();setTimeout(()=>$('questionModal').classList.add('hidden'),750);}else{button.classList.add('bad');button.disabled=true;$('questionFeedback').textContent='Belum tepat. Jawapan tidak didedahkan; cuba pilihan lain.';}}
function castSkill(which){setHeroAnimation(human,heroes[human.hero].cast||'Spellcast_Shoot',false);const tower=nearestEnemyTower(human,48);if(!tower){toast('Semua menara musuh sudah runtuh!');return;}const damage=[0,52,80,135][which];damageTower(tower,damage,human);const pulse=new THREE.Mesh(new THREE.RingGeometry(1.5,2.1,24),new THREE.MeshBasicMaterial({color:teams[human.team].color,transparent:true,opacity:.9,side:THREE.DoubleSide}));pulse.rotation.x=-Math.PI/2;pulse.position.set(tower.x,.55,tower.z);scene.add(pulse);world.push(pulse);setTimeout(()=>{scene?.remove(pulse);world=world.filter(x=>x!==pulse);pulse.geometry.dispose();pulse.material.dispose();},650);toast(`${heroes[human.hero].skill} kena menara ${teams[tower.team].name} · −${damage} HP`);}
function updateCooldowns(){document.querySelectorAll('.skill-btn').forEach(b=>{const n=Number(b.dataset.skill),left=Math.max(0,Math.ceil(skillReady[n]-elapsed));b.classList.toggle('cooldown',left>0);const small=b.querySelector('small');if(small)small.textContent=left?`${left}s`:'Jawab betul';});}
function toast(message){$('hint').textContent=message;clearTimeout(feedTimer);feedTimer=setTimeout(()=>{if($('hint'))$('hint').textContent='Joystick: gerak 360° · Pukul auto-sasar lawan terdekat';},2100);}
function updateTeamBars(){const box=$('teamBars');box.innerHTML=bases.map(b=>{const t=teams[b.team],hp=b.towers.reduce((n,x)=>n+x.hp,0),max=b.towers.reduce((n,x)=>n+x.maxHp,0),count=b.towers.filter(x=>x.alive).length,pct=Math.round(hp/max*100);return`<div class="team-bar"><div class="team-bar-head"><span style="color:${t.css}">${t.name}</span><span>${count}/5</span></div><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${t.css}"></div></div></div>`;}).join('');}
function botStep(dt){for(const u of units){if(u.isHuman)continue;const target=nearestEnemyTower(u);if(!target){if(elapsed>=u.actionUntil)setHeroAnimation(u,'Idle',true);continue;}const dx=target.x-u.group.position.x,dz=target.z-u.group.position.z,dist=Math.hypot(dx,dz);if(dist>2.5){u.group.position.x+=dx/dist*dt*2.1;u.group.position.z+=dz/dist*dt*2.1;u.group.rotation.y=Math.atan2(dx,dz);if(elapsed>=u.actionUntil)setHeroAnimation(u,'Running_A',true);}else if(elapsed>u.attackAt){u.attackAt=elapsed+2.1;u.group.rotation.y=Math.atan2(dx,dz);setHeroAnimation(u,heroes[u.hero].attack||'Unarmed_Melee_Attack_Punch_A',false);damageTower(target,3,u);}else if(elapsed>=u.actionUntil)setHeroAnimation(u,'Idle',true);}}
function moveHuman(dt){if(!human?.alive)return;let x=joy.x,z=joy.y;if(keys.has('ArrowLeft')||keys.has('a'))x-=1;if(keys.has('ArrowRight')||keys.has('d'))x+=1;if(keys.has('ArrowUp')||keys.has('w'))z-=1;if(keys.has('ArrowDown')||keys.has('s'))z+=1;const len=Math.hypot(x,z),running=len>.72,speed=running?8.4:4.6;if(len>1){x/=len;z/=len;}if(len>.05){human.group.position.x+=x*dt*speed;human.group.position.z+=z*dt*speed;human.group.rotation.y=Math.atan2(x,z);if(elapsed>=human.actionUntil)setHeroAnimation(human,running?'Running_A':'Walking_A',true);}else if(elapsed>=human.actionUntil)setHeroAnimation(human,'Idle',true);const r=Math.hypot(human.group.position.x,human.group.position.z);if(r>30){human.group.position.x*=30/r;human.group.position.z*=30/r;}}
function loop(now){if(gameOver)return;raf=requestAnimationFrame(loop);const dt=Math.min(.05,(now-lastFrame)/1000||0);lastFrame=now;if(!paused){elapsed+=dt;remaining=Math.max(0,180-elapsed);moveHuman(dt);botStep(dt);if(human&&!human.alive){human.respawn-=dt;if(human.respawn<=0){human.alive=true;human.hp=100;human.group.visible=true;human.group.position.set(human.spawnX,.1,human.spawnZ);toast('Hero awak kembali ke markas.');updateTeamBars();}}}
  $('clock').textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(Math.floor(remaining%60)).padStart(2,'0')}`;updateCooldowns();if(Math.floor(elapsed)%3===0&&Math.floor(elapsed)!==Math.floor(elapsed-dt))updateTeamBars();units.forEach(u=>u.mixer?.update(dt));
  if(human){const p=human.group.position,target=new THREE.Vector3(p.x+7,15,p.z+18);camera.position.lerp(target,.09);camera.lookAt(p.x,1.8,p.z);}
  world.forEach(o=>{if(o.geometry?.type==='OctahedronGeometry')o.rotation.y+=dt*.48;});renderer.render(scene,camera);
  const alive=bases.filter(b=>b.towers.some(t=>t.alive));if(alive.length<=1||remaining<=0)finishGame(alive);
}
function towerHp(base){return base.towers.reduce((sum,t)=>sum+t.hp,0);}
function finishGame(alive){gameOver=true;cancelAnimationFrame(raf);const ranked=[...bases].sort((a,b)=>towerHp(b)-towerHp(a));$('winnerTitle').textContent=`🏆 Pasukan ${teams[(alive[0]||ranked[0]).team].name} menang!`;$('finalTeams').innerHTML=ranked.map((b,i)=>`<div class="final-team"><b style="color:${teams[b.team].css}">${i+1}. ${teams[b.team].name}</b><span>${b.towers.filter(t=>t.alive).length}/5 menara · ${Math.round(towerHp(b)/b.towers.reduce((s,t)=>s+t.maxHp,0)*100)}% kekuatan</span></div>`).join('');$('endModal').classList.remove('hidden');}
function resetGame(){for(const u of units)scene?.remove(u.group);units=[];bases.forEach(b=>{b.objects.forEach(o=>scene?.remove(o));b.towers.forEach(t=>scene?.remove(t.group));});bases=[];for(const o of world)scene?.remove(o);world=[];if(renderer){renderer.dispose();renderer=null;scene=null;camera=null;}human=null;skillReady=[0,0,0,0];attackReady=0;questionIndex=-1;$('battle').classList.add('hidden');$('endModal').classList.add('hidden');$('setup').classList.remove('hidden');}
$('startBtn').onclick=startGame;$('attackBtn').onclick=hit;document.querySelectorAll('.skill-btn').forEach(b=>b.onclick=()=>openSkill(Number(b.dataset.skill)));$('againBtn').onclick=resetGame;
const joyPad=$('joystick'),knob=$('knob');let pointer=null;function joyMove(e){if(pointer!==e.pointerId)return;const r=joyPad.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,max=r.width*.34,len=Math.hypot(dx,dy),s=len>max?max/len:1;joy.x=clamp(dx*s/max,-1,1);joy.y=clamp(dy*s/max,-1,1);knob.style.transform=`translate(${joy.x*max}px,${joy.y*max}px)`;}joyPad.addEventListener('pointerdown',e=>{pointer=e.pointerId;joyPad.setPointerCapture(pointer);joyMove(e);});joyPad.addEventListener('pointermove',joyMove);function joyEnd(){pointer=null;joy={x:0,y:0};knob.style.transform='translate(0,0)';}joyPad.addEventListener('pointerup',joyEnd);joyPad.addEventListener('pointercancel',joyEnd);
window.addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(k))e.preventDefault();keys.add(k);if(k===' '&&!e.repeat)hit();});window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));$('pauseBtn').onclick=()=>{paused=!paused;$('pauseBtn').textContent=paused?'Sambung':'Jeda';toast(paused?'Permainan dijeda':'Permainan disambung');};
