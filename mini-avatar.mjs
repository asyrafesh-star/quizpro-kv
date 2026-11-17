// Shared rounded character for the runner, opponents and the character preview.
export function createMiniAvatar(THREE, options = {}) {
  const group = new THREE.Group();
  const colors = { skin:0xffc69f, hair:0xa73c14, shirt:options.shirt??0xf5e7cd, trousers:0x243344, shoes:0x47372d };
  const outfit=options.outfit??0,hairStyle=options.hairStyle??0;
  const materials = new Map();
  const sphere = new THREE.SphereGeometry(1,16,12);
  const capsule = new THREE.CapsuleGeometry(1,1,4,12);
  function material(color) {
    if (!materials.has(color)) materials.set(color,new THREE.MeshPhongMaterial({color,shininess:22}));
    return materials.get(color);
  }
  function oval(parent,color,position,scale) {
    const mesh = new THREE.Mesh(sphere,material(color));mesh.position.set(...position);mesh.scale.set(...scale);parent.add(mesh);return mesh;
  }
  function limb(parent,color,radius,length,position) {
    const mesh = new THREE.Mesh(capsule,material(color));
    mesh.scale.set(radius,length/3,radius);mesh.position.set(...position);parent.add(mesh);return mesh;
  }
  function line(parent,color,points,radius) {
    const curve = new THREE.CatmullRomCurve3(points.map(point=>new THREE.Vector3(...point)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve,12,radius,5,false),material(color));parent.add(mesh);return mesh;
  }
  // A tapered torso, rounded shoulders and soft sleeves replace the cube silhouette.
  const profile = [[0.22,0],[0.28,0.06],[0.29,0.26],[0.33,0.48],[0.31,0.6],[0.22,0.66],[0.15,0.68]].map(([x,y])=>new THREE.Vector2(x,y));
  const torso = new THREE.Mesh(new THREE.LatheGeometry(profile,20),material(colors.shirt));torso.position.y=1.02;torso.scale.z=0.73;group.add(torso);
  oval(group,colors.skin,[0,1.7,0],[0.13,0.15,0.12]);
  const head = new THREE.Group();head.position.y=1.98;group.add(head);
  oval(head,colors.skin,[0,0,0],[0.43,0.43,0.37]);
  oval(head,colors.skin,[0,-0.18,-0.04],[0.34,0.25,0.32]);
  [-1,1].forEach(side=>{
    oval(head,colors.skin,[side*0.42,-0.02,0],[0.115,0.15,0.085]);
    oval(head,0xe89a87,[side*0.445,-0.025,-0.055],[0.057,0.087,0.025]);
    oval(head,0xf1ad91,[side*0.245,-0.14,-0.285],[0.11,0.064,0.028]);
    oval(head,0xfffaf4,[side*0.16,0.045,-0.318],[0.128,0.15,0.07]);
    oval(head,0x965b2d,[side*0.16,0.035,-0.377],[0.073,0.091,0.025]);
    oval(head,0x18202a,[side*0.16,0.035,-0.398],[0.043,0.061,0.014]);
    oval(head,0xffffff,[side*0.16-0.017,0.068,-0.411],[0.018,0.024,0.008]);
    line(head,colors.hair,[[side*0.27,0.215,-0.31],[side*0.18,0.25,-0.347],[side*0.07,0.22,-0.33]],0.023);
  });
  oval(head,colors.skin,[0,-0.075,-0.377],[0.092,0.061,0.091]);
  oval(head,0x7a3330,[0,-0.225,-0.32],[0.155,0.062,0.031]);
  oval(head,0xfffaf1,[0,-0.208,-0.346],[0.12,0.019,0.013]);
  line(head,0xc47864,[[-0.16,-0.21,-0.32],[0,-0.27,-0.336],[0.16,-0.21,-0.32]],0.012);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.435,20,12,0,Math.PI*2,0,1.32),material(colors.hair));cap.position.y=0.055;head.add(cap);
  const hair = new THREE.Group();hair.name='hair-style-'+hairStyle;head.add(hair);
  const locks = {
    0:[[-0.25,0.29,-0.14,0.17,0.25,0.2],[-0.08,0.39,-0.1,0.2,0.25,0.21],[0.13,0.39,0,0.2,0.23,0.23],[0.3,0.22,0.025,0.15,0.24,0.2],[-0.31,0.04,0.13,0.13,0.22,0.2]],
    1:[[-0.22,0.28,-0.08,0.16,0.12,0.22],[0,0.36,0,0.2,0.1,0.25],[0.22,0.28,-0.08,0.16,0.12,0.22]],
    4:[[-0.25,0.25,-0.16,0.2,0.13,0.2],[-0.04,0.36,-0.12,0.26,0.15,0.21],[0.2,0.3,-0.08,0.2,0.13,0.22],[0.31,0.12,0.05,0.13,0.21,0.2]],
    5:[[-0.2,0.3,-0.1,0.21,0.18,0.28],[0.2,0.3,-0.1,0.21,0.18,0.28]],
    6:[[-0.35,-0.03,0.09,0.15,0.34,0.24],[0.35,-0.03,0.09,0.15,0.34,0.24],[0,-0.06,0.29,0.31,0.32,0.12]],
    7:[[0,0.17,0.43,0.2,0.17,0.23],[0,-0.08,0.62,0.15,0.3,0.17]],
    8:[[0,0.28,0.35,0.23,0.22,0.21]]
  };
  (locks[hairStyle]||[]).forEach(([x,y,z,sx,sy,sz],index)=>{const lock=oval(hair,index%2?colors.hair:0xc25320,[x,y,z],[sx,sy,sz]);lock.rotation.z=hairStyle===5?(x<0?0.22:-0.22):hairStyle===0||hairStyle===4?-0.4:0;});
  if(hairStyle===2){
    const spikeGeometry=new THREE.ConeGeometry(0.11,0.3,7);
    for(let index=0;index<7;index++){
      const angle=index/7*Math.PI*2,spike=new THREE.Mesh(spikeGeometry,material(index%2?colors.hair:0xc25320));
      spike.position.set(Math.cos(angle)*0.24,0.39,Math.sin(angle)*0.22);spike.rotation.z=-Math.cos(angle)*0.3;hair.add(spike);
    }
  }
  if(hairStyle===3){
    for(let index=0;index<15;index++){
      const angle=index*2.399,radius=0.32*Math.sqrt(index/15);
      oval(hair,index%2?colors.hair:0xc25320,[Math.cos(angle)*radius,0.24+0.16*(1-radius/0.4),Math.sin(angle)*radius],[0.13,0.14,0.13]);
    }
  }

  if(outfit===0){
    [-1,1].forEach(side=>{
      line(group,0x4d4339,[[side*0.18,1.06,-0.21],[side*0.23,1.4,-0.235],[side*0.19,1.67,-0.11]],0.026);
      line(group,0x4d4339,[[side*0.18,1.06,0.21],[side*0.23,1.4,0.235],[side*0.19,1.67,0.11]],0.026);
      const tie=oval(group,0x343d3c,[side*0.078,1.605,-0.245],[0.085,0.055,0.05]);tie.rotation.z=side*0.18;
    });
    oval(group,0x424746,[0,1.6,-0.27],[0.035,0.04,0.035]);
    [1.18,1.31,1.44].forEach(y=>oval(group,0xbfae90,[0,y,-0.22],[0.015,0.015,0.012]));
  }
  if(outfit===1){
    oval(group,colors.shirt,[0,1.61,0.18],[0.25,0.25,0.19]);
    const collar=new THREE.Mesh(new THREE.TorusGeometry(0.16,0.06,6,18),material(colors.shirt));collar.rotation.x=Math.PI/2;collar.position.y=1.66;group.add(collar);
    [-1,1].forEach(side=>line(group,0xeee5d8,[[side*0.09,1.62,-0.19],[side*0.1,1.42,-0.245]],0.009));
    line(group,0x293447,[[-0.17,1.18,-0.23],[0,1.14,-0.25],[0.17,1.18,-0.23]],0.009);
  }
  if(outfit===2){
    oval(group,0xeee2c8,[0,1.53,-0.175],[0.2,0.17,0.045]);
    [-1,1].forEach(side=>{
      line(group,colors.shirt,[[side*0.16,1.31,-0.25],[side*0.2,1.67,-0.11]],0.04);
      oval(group,0xd4b571,[side*0.16,1.32,-0.285],[0.025,0.025,0.014]);
    });
    line(group,0xeee2c8,[[-0.1,1.26,-0.255],[-0.1,1.15,-0.255],[0.1,1.15,-0.255],[0.1,1.26,-0.255]],0.008);
  }
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.264,0.033,6,20),material(0x45352b));belt.rotation.x=Math.PI/2;belt.position.y=1.05;belt.scale.y=0.76;group.add(belt);
  oval(group,0xb7a572,[0,1.05,-0.23],[0.069,0.055,0.025]);
  const limbs = [];
  [-1,1].forEach(side=>{
    const leg = new THREE.Group();leg.position.set(side*0.15,1.03,0);group.add(leg);
    limb(leg,colors.trousers,0.117,0.42,[0,-0.18,0]);
    const knee = new THREE.Group();knee.position.y=-0.38;leg.add(knee);
    limb(knee,colors.trousers,0.102,0.38,[0,-0.17,0]);
    oval(knee,colors.shoes,[0,-0.37,-0.055],[0.13,0.1,0.24]);
    oval(knee,0xe6d4b7,[0,-0.43,-0.055],[0.132,0.025,0.24]);
    const arm = new THREE.Group();arm.position.set(side*0.34,1.55,0);group.add(arm);
    limb(arm,outfit===2?0xeee2c8:colors.shirt,0.116,0.32,[side*0.025,-0.12,0]);
    const elbow = new THREE.Group();elbow.position.set(side*0.04,-0.27,0);elbow.rotation.x=-0.22;arm.add(elbow);
    limb(elbow,outfit===1?colors.shirt:colors.skin,0.078,0.27,[0,-0.1,0]);
    oval(elbow,colors.skin,[0,-0.24,0],[0.088,0.105,0.085]);
    limbs.push({leg,arm,knee,elbow,side});
  });
  const ownedGeometry=new Set();group.traverse(object=>{if(object.isMesh)ownedGeometry.add(object.geometry);});
  return {group,limbs,head,dispose(){ownedGeometry.forEach(geometry=>geometry.dispose());materials.forEach(value=>value.dispose());}};
}
