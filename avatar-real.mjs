import * as THREE from './three.module.min.js';
import {GLTFLoader} from './GLTFLoader.mjs';
import {clone} from './SkeletonUtils.mjs';
import {createMiniAvatar as fallback} from './mini-avatar.mjs?v=mini20261117';
const loader=new GLTFLoader(),cache=new Map();
function asset(name){
 if(!cache.has(name))cache.set(name,loader.loadAsync(new URL('./assets/quaternius/'+name+'/model.gltf',import.meta.url).href).then(result=>result.scene).catch(error=>{cache.delete(name);throw error;}));
 return cache.get(name);
}
const hairs=[['parted',1,1,1],['parted',-1,1,1],['parted',1,0.8,1.15],['buzz',1,1,1],['buzz',1,1.2,1],['long',1,1,1],['long',1,0.75,1],['long',0.7,1,1],['buns',1,1,1],['buns',0.75,1.12,1]];
function retainHead(object,owned){
 object.traverse(mesh=>{
  if(!mesh.isMesh)return;
  mesh.geometry=mesh.geometry.clone();
  owned.add(mesh.geometry);
  const geometry=mesh.geometry,position=geometry.attributes.position;
  const indices=geometry.index?Array.from(geometry.index.array):Array.from({length:position.count},(_,i)=>i);
  const kept=[];
  for(let i=0;i<indices.length;i+=3)if(indices.slice(i,i+3).every(index=>position.getY(index)>1.56))kept.push(...indices.slice(i,i+3));
  geometry.setIndex(kept);mesh.frustumCulled=false;
 });
}
function offsetBone(bone,offset=0){
 if(!bone)return {rotation:{x:0}};
 const rest=bone.rotation.x+offset;
 return {rotation:{get x(){return bone.rotation.x-rest;},set x(value){bone.rotation.x=rest+value;}}};
}
export function createMiniAvatar(unused,options={}){
 const placeholder=fallback(THREE,options),group=placeholder.group,limbs=placeholder.limbs;
 let disposed=false,real;const ownedGeometry=new Set(),ownedMaterials=new Set();
 const style=hairs[options.hairStyle%10]||hairs[0],outfit=options.outfit%2===1?'ranger':'peasant';
 const ready=Promise.all([asset('base'),asset(style[0]),asset(outfit),asset('peasant')]).then(([base,hair,clothes,fixed])=>{
  if(disposed)return;
  real=new THREE.Group();real.rotation.y=Math.PI;real.scale.setScalar(1.15);
  const head=clone(base);retainHead(head,ownedGeometry);real.add(head);
  const hairObject=clone(hair);hairObject.scale.set(...style.slice(1));
  // Shape variants pivot around scalp height rather than moving the roots.
  hairObject.position.y=1.72*(1-style[2]);real.add(hairObject);
  const shirt=clone(clothes),lower=clone(fixed);
  shirt.traverse(mesh=>{if(mesh.isMesh){mesh.visible=!/Legs|Feet|Hood|Pauldron/i.test(mesh.name);mesh.frustumCulled=false;}});
  lower.traverse(mesh=>{if(mesh.isMesh){mesh.visible=/Legs|Feet/i.test(mesh.name);mesh.frustumCulled=false;}});
  // Keep the same trousers; shoe variation is independent of shirt selection.
  lower.traverse(mesh=>{if(mesh.isMesh&&/Feet/i.test(mesh.name)){mesh.material=mesh.material.clone();ownedMaterials.add(mesh.material);mesh.material.color.setHex([0x604431,0x252b3b,0xc5c7d0][options.shoes||0]);}});
  shirt.traverse(mesh=>{if(mesh.isMesh&&/Body/i.test(mesh.name)){mesh.material=mesh.material.clone();ownedMaterials.add(mesh.material);mesh.material.color.setHex(options.shirt??0xffffff);}});
  real.add(shirt,lower);
  const active=[];
  for(const object of [shirt,lower])for(const [suffix,side] of [['l',1],['r',-1]]){
   const upper=object.getObjectByName('upperarm_'+suffix);
   if(upper)upper.rotateZ(-side*1.1);
   active.push({leg:offsetBone(object.getObjectByName('thigh_'+suffix)),arm:offsetBone(upper),knee:offsetBone(object.getObjectByName('calf_'+suffix)),side});
  }
  while(group.children.length)group.remove(group.children[0]);placeholder.dispose();group.add(real);limbs.splice(0,limbs.length,...active);
  dispatchEvent(new CustomEvent('quizpro-real-avatar-ready'));
 }).catch(error=>{console.warn('Imported avatar unavailable; using local character.',error);throw error;});
 // Consumers may use ready for previews; the fallback keeps gameplay available.
 ready.catch(()=>{});
 return {group,limbs,ready,dispose(){disposed=true;ownedGeometry.forEach(value=>value.dispose());ownedMaterials.forEach(value=>value.dispose());placeholder.dispose();}};
}
