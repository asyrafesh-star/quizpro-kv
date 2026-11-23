export const HAIR_STYLES = ['Belah tengah','Belah sisi','Sikat belakang','Buzz pendek','Crop tebal','Panjang','Bob','Panjang ramping','Dua bun','Bun tinggi'];
export const OUTFITS = ['Peasant · Asal','Ranger · Asal','Peasant · Merah','Ranger · Merah','Peasant · Biru','Ranger · Biru','Peasant · Hijau','Ranger · Hijau','Peasant · Ungu','Ranger · Ungu'];
export const SHOES = ['Coklat','Hitam','Kelabu'];
export const SHIRT_COLORS = [
  {name:'Putih',hex:'#f5e7cd'}, {name:'Merah',hex:'#e94656'},
  {name:'Oren',hex:'#ed8c32'}, {name:'Kuning',hex:'#ecc84b'},
  {name:'Hijau',hex:'#3ea96b'}, {name:'Turquoise',hex:'#28a8a4'},
  {name:'Biru',hex:'#4689e6'}, {name:'Ungu',hex:'#9964d8'},
  {name:'Merah jambu',hex:'#eb8fb4'}, {name:'Hitam',hex:'#303747'}
];
export function normalizeAvatar(value) {
  return {
    hair:Number.isInteger(value?.hair)&&value.hair>=0&&value.hair<HAIR_STYLES.length?value.hair:0,
    outfit:Number.isInteger(value?.outfit)&&value.outfit>=0&&value.outfit<OUTFITS.length?value.outfit:0,
    color:SHIRT_COLORS.some(color=>color.hex===value?.color)?value.color:SHIRT_COLORS[0].hex,
    shoes:Number.isInteger(value?.shoes)&&value.shoes>=0&&value.shoes<3?value.shoes:0
  };
}
export function readAvatar() {
  try{return normalizeAvatar(JSON.parse(localStorage.getItem('quizpro-avatar-v1')));}catch{return normalizeAvatar(null);}
}
export function geometryOptions(value) {
  const choice=normalizeAvatar(value);
  const tints=[0xffffff,0xe94656,0x4689e6,0x3ea96b,0x9964d8];
  return {hairStyle:choice.hair,outfit:choice.outfit,shoes:choice.shoes,shirt:choice.outfit<2?parseInt(choice.color.slice(1),16):tints[Math.floor(choice.outfit/2)]};
}
