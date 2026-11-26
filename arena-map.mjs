export const MAP_SCALE=2, MAP_RADIUS=72, PLAY_RADIUS=66, BASE_DISTANCE=56;
// Keep the existing Firebase coordinate contract and teacher observer compatible.
export const toWire=value=>Math.max(-39,Math.min(39,value/MAP_SCALE));
export const fromWire=value=>(Number(value)||0)*MAP_SCALE;
export function forestLayout(){
  let seed=261126;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const trees=[];
  for(let i=0;i<2000&&trees.length<420;i++){
    const a=random()*Math.PI*2,r=21+Math.sqrt(random())*49,x=Math.cos(a)*r,z=Math.sin(a)*r;
    let clear=true;
    for(let t=0;t<5;t++){
      const angle=-Math.PI/2+t*Math.PI*2/5,along=x*Math.cos(angle)+z*Math.sin(angle),across=-x*Math.sin(angle)+z*Math.cos(angle);
      if(along>0&&along<61&&[-10.8,0,10.8].some(lane=>Math.abs(across-lane)<9))clear=false;
      if(Math.hypot(x-Math.cos(angle)*56,z-Math.sin(angle)*56)<9)clear=false;
      if(Math.hypot(x-Math.cos(angle+.42)*26,z-Math.sin(angle+.42)*26)<3)clear=false;
    }
    if(clear)trees.push({x,z,height:3+random()*2.8,rotation:random()*Math.PI*2,pine:random()>.5});
  }
  return trees;
}
