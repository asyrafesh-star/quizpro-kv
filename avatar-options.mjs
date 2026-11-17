export const HAIR_STYLES = ['Quiff','Pendek kemas','Spiky','Kerinting','Berombak','Belah tengah','Bob pendek','Ponytail','Bun','Potongan rapat'];
export const OUTFITS = ['Kemeja','Hoodie','Overall mekanik'];
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
    color:SHIRT_COLORS.some(color=>color.hex===value?.color)?value.color:SHIRT_COLORS[0].hex
  };
}
export function readAvatar() {
  try{return normalizeAvatar(JSON.parse(localStorage.getItem('quizpro-avatar-v1')));}catch{return normalizeAvatar(null);}
}
export function geometryOptions(value) {
  const choice=normalizeAvatar(value);
  return {hairStyle:choice.hair,outfit:choice.outfit,shirt:parseInt(choice.color.slice(1),16)};
}
