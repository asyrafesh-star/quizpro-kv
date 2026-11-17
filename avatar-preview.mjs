import * as THREE from './three.module.min.js';
import { createMiniAvatar } from './mini-avatar.mjs?v=mini20261117';
import { HAIR_STYLES, OUTFITS, SHIRT_COLORS, readAvatar, normalizeAvatar, geometryOptions } from './avatar-options.mjs?v=mini20261117';

const host = document.getElementById('avatarPreview');
if (host) {
  try {
    const renderer = new THREE.WebGLRenderer({antialias:true,alpha:false});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    renderer.setClearColor(0x27243c);
    host.append(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36,1,0.1,30);
    camera.position.set(0,1.65,-4.8);camera.lookAt(0,1.25,0);
    scene.add(new THREE.HemisphereLight(0xfff0d7,0x31354b,2.6));
    const key = new THREE.DirectionalLight(0xffe1b3,3.2);key.position.set(-3,5,-4);scene.add(key);
    const rim = new THREE.DirectionalLight(0xffb456,2);rim.position.set(2,4,2);scene.add(rim);
    let choice=readAvatar();
    let avatar = createMiniAvatar(THREE,geometryOptions(choice));scene.add(avatar.group);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7,0.77,0.11,32),new THREE.MeshPhongMaterial({color:0x77717d,shininess:12}));
    base.position.y=-0.06;scene.add(base);
    let yaw=0,targetYaw=0,dragX=null,dirty=true,last=0;
    const hairSelect=document.getElementById('avatarHair'),outfitSelect=document.getElementById('avatarOutfit'),palette=document.getElementById('avatarColors');
    hairSelect.replaceChildren(...HAIR_STYLES.map((label,index)=>new Option(label,index)));
    outfitSelect.replaceChildren(...OUTFITS.map((label,index)=>new Option(label,index)));
    hairSelect.value=choice.hair;outfitSelect.value=choice.outfit;
    function applyChoice() {
      choice=normalizeAvatar(choice);
      scene.remove(avatar.group);avatar.dispose();avatar=createMiniAvatar(THREE,geometryOptions(choice));avatar.group.rotation.y=yaw;scene.add(avatar.group);dirty=true;
      palette.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.color===choice.color)));
      try{localStorage.setItem('quizpro-avatar-v1',JSON.stringify(choice));}catch{}
      document.getElementById('avatarPreviewStatus').textContent=HAIR_STYLES[choice.hair]+' · '+OUTFITS[choice.outfit]+' · '+SHIRT_COLORS.find(color=>color.hex===choice.color).name+' · Disimpan pada peranti ini';
      dispatchEvent(new CustomEvent('quizpro-avatar-change',{detail:choice}));
    }
    palette.replaceChildren(...SHIRT_COLORS.map(color=>{
      const button=document.createElement('button');button.type='button';button.style.backgroundColor=color.hex;button.dataset.color=color.hex;
      button.setAttribute('aria-label','Warna baju '+color.name);button.setAttribute('aria-pressed',String(color.hex===choice.color));button.title=color.name;
      button.onclick=()=>{choice.color=color.hex;applyChoice();};return button;
    }));
    hairSelect.onchange=()=>{choice.hair=Number(hairSelect.value);applyChoice();};
    outfitSelect.onchange=()=>{choice.outfit=Number(outfitSelect.value);applyChoice();};
    document.getElementById('avatarLeft').onclick=()=>{targetYaw+=Math.PI/4;dirty=true;};
    document.getElementById('avatarRight').onclick=()=>{targetYaw-=Math.PI/4;dirty=true;};
    host.addEventListener('pointerdown',event=>{dragX=event.clientX;host.setPointerCapture(event.pointerId);});
    host.addEventListener('pointermove',event=>{if(dragX===null)return;targetYaw+=(event.clientX-dragX)*0.012;dragX=event.clientX;dirty=true;});
    host.addEventListener('pointerup',()=>{dragX=null;});
    host.addEventListener('pointercancel',()=>{dragX=null;});
    const resize=new ResizeObserver(()=>{
      const {width,height}=host.getBoundingClientRect();if(!width||!height)return;
      renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();dirty=true;
    });resize.observe(host);
    renderer.setAnimationLoop(time=>{
      if(time-last<33||document.hidden||host.closest('[hidden]')||document.getElementById('intro')?.hidden)return;
      last=time;
      if(Math.abs(targetYaw-yaw)>0.001){yaw+=(targetYaw-yaw)*0.18;avatar.group.rotation.y=yaw;dirty=true;}
      if(dirty){renderer.render(scene,camera);dirty=false;}
    });
    renderer.domElement.addEventListener('webglcontextlost',event=>{
      event.preventDefault();document.getElementById('avatarPreviewStatus').textContent='Pratonton 3D tidak tersedia pada peranti ini. Anda boleh terus masuk permainan.';
    });
    addEventListener('pagehide',event=>{if(!event.persisted){renderer.setAnimationLoop(null);resize.disconnect();renderer.dispose();}});
  } catch {
    document.getElementById('avatarPreviewStatus').textContent='Pratonton 3D tidak tersedia pada peranti ini. Anda boleh terus masuk permainan.';
  }
}
