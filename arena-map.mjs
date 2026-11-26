export const MAP_SCALE=3, MAP_RADIUS=108, PLAY_RADIUS=99, BASE_DISTANCE=84;
export const toWire=value=>Math.max(-39,Math.min(39,value/MAP_SCALE));
export const fromWire=value=>(Number(value)||0)*MAP_SCALE;
let cached;
function layout(){
 if(cached)return cached;
 let seed=261126;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const trees=[],rocks=[],bushes=[];
 function clear(x,z,margin){
  for(let t=0;t<5;t++){
   const a=-Math.PI/2+t*Math.PI*2/5,along=x*Math.cos(a)+z*Math.sin(a),across=-x*Math.sin(a)+z*Math.cos(a);
   if(along>65&&along<79&&Math.abs(across)<9)return false;
   if(along>0&&along<91&&[-16.2,0,16.2].some(lane=>Math.abs(across-lane)<margin))return false;
   for(const distance of [34.5,57,79.2])for(const lane of [-16.2,0,16.2])if(Math.hypot(along-distance,across-lane)<8.5)return false;
   if(Math.hypot(x-Math.cos(a)*84,z-Math.sin(a)*84)<10)return false;
   if(Math.hypot(x-Math.cos(a+.42)*39,z-Math.sin(a+.42)*39)<4)return false;
  }return true;
 }
  const point=()=>{const a=random()*Math.PI*2,r=30+Math.sqrt(random())*74;return{x:Math.cos(a)*r,z:Math.sin(a)*r};};
  const spaced=(list,x,z,margin)=>list.every(o=>Math.hypot(x-o.x,z-o.z)>margin+(o.radius||0));
  for(let i=0;i<32000&&trees.length<900;i++){const{x,z}=point();if(!clear(x,z,4.6)||!spaced(trees,x,z,2.6))continue;trees.push({x,z,height:3+random()*2.8,rotation:random()*Math.PI*2,pine:random()>.5,radius:.5});}
  for(let i=0;i<60000&&rocks.length<150;i++){const{x,z}=point(),radius=1+random()*1.3;if(!clear(x,z,4.5)||!spaced(trees,x,z,1.1)||!spaced(rocks,x,z,1.8))continue;rocks.push({x,z,radius,height:1.3+random()*1.5,rotation:random()*6.28});}
  for(let i=0;i<42000&&bushes.length<180;i++){const{x,z}=point(),radius=2.6+random()*.8;if(!clear(x,z,6)||!spaced(trees,x,z,2.6)||!spaced(rocks,x,z,2.2)||!spaced(bushes,x,z,3.2))continue;bushes.push({x,z,radius});}
 cached={trees,rocks,bushes};return cached;
}
export const forestLayout=()=>layout().trees;
export const boulderLayout=()=>layout().rocks;
export const bushLayout=()=>layout().bushes;
const CELL=8;let grid;
function obstacleGrid(){
 if(grid)return grid;grid=new Map();
 for(const o of [...forestLayout(),...boulderLayout()]){
  const reach=o.radius+1;
  for(let x=Math.floor((o.x-reach)/CELL);x<=Math.floor((o.x+reach)/CELL);x++)for(let z=Math.floor((o.z-reach)/CELL);z<=Math.floor((o.z+reach)/CELL);z++){
   const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(o);
  }
 }return grid;
}
export function nearbyObstacles(x,z){return obstacleGrid().get(Math.floor(x/CELL)+','+Math.floor(z/CELL))||[];}
export function moveWithCollision(start,dx,dz,radius=.55){
 let x=start.x,z=start.z;const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.4));
 for(let step=0;step<steps;step++){
  x+=dx/steps;z+=dz/steps;
  for(let pass=0;pass<3;pass++)for(const o of nearbyObstacles(x,z)){
   const ox=x-o.x,oz=z-o.z,d=Math.hypot(ox,oz),limit=o.radius+radius;
   if(d<limit){const nx=d>1e-8?ox/d:1,nz=d>1e-8?oz/d:0;x=o.x+nx*(limit+.001);z=o.z+nz*(limit+.001);}
  }
  const distance=Math.hypot(x,z);if(distance>PLAY_RADIUS){x*=PLAY_RADIUS/distance;z*=PLAY_RADIUS/distance;}
 }return {x,z};
}
export function isConcealed(position){return bushLayout().some(b=>Math.hypot(position.x-b.x,position.z-b.z)<b.radius);}
export function canDetect(from,target){
 if(!target?.alive)return false;
 if(from.team===target.team||target.isMinion||!isConcealed(target.group.position))return true;
 return Math.hypot(from.group.position.x-target.group.position.x,from.group.position.z-target.group.position.z)<=5;
}
