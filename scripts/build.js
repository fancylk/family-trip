// 将讲解词与景点数据注入 index.html
import { narrations } from "/Users/taoge/family-trip-web/scripts/narrations.js";
import { readFileSync, writeFileSync } from "node:fs";

const intro = {
"nanjing-fuzimiao": "六朝金粉之地：夫子庙拜孔子、江南贡院两万间号舍、秦淮河画舫赏中秋月。",
"nanjing-zhonghuamen": "天下第一瓮城：三道瓮城、27个藏兵洞、聚宝盆传说，明朝「责任制」城砖。",
"luoyang-longmen": "世界文化遗产：2345窟龛、10万余尊造像，17.14米卢舍那大佛「东方蒙娜丽莎」。",
"luoyang-museum": "十三朝家底：华夏第一爵、曹魏白玉杯、唐三彩、东汉石辟邪（寻宝任务）。",
"luoyang-baimasi": "中国第一古刹（公元68年）：白马驮经的故事 + 泰缅印国际佛殿区。",
"luoyang-luoyi": "文峰塔下的非遗市集：吹糖人、剪纸、皮影，全家汉服合影。",
"luoyang-yingtianmen": "隋唐洛阳城宫门（605年），武则天登基之地，夜晚3D灯光秀。",
"xian-bingmayong": "世界第八大奇迹：1974年农民打井发现，8000尊千人千面的地下军团。",
"xian-dayanta": "玄奘亲自主持修建（652年），64米七层砖塔，「雁塔题名」典故与音乐喷泉。",
"xian-datangbuyecheng": "2100米盛唐灯火长街：不倒翁小姐姐、盛唐密盒、李白对诗。",
"xian-shanxi-history": "「给我一天还你万年」：兽首玛瑙杯、舞马衔杯银壶、皇后之玺、独孤信26面印。",
"xian-citywall": "中国现存最完整古城垣：13.74公里、糯米城墙、98座敌楼，永宁门看日落。",
"xian-huiminjie": "千年回坊：大皮院泡馍自己掰、洒金桥深夜食堂，中式汉堡肉夹馍。",
"sanmenxia-hangu": "一夫当关万夫莫开：紫气东来、老子著《道德经》五千言之地。",
"sanmenxia-dikengyuan": "「见树不见村」的地下四合院：4000年居住活化石，冬暖夏凉。",
"sanmenxia-swan": "黄河湿地栈道：天鹅之城的故事，白鹭水鸟芦苇荡（天鹅10月下旬抵达）。",
"sanmenxia-guoguo": "假道伐虢·唇亡齿寒发生地：原址车马坑比兵马俑早500年，中华第一剑。",
"sanmenxia-daba": "万里黄河第一坝：人门神门鬼门、大禹斧劈三门、中流砥柱石。",
"hefei-xiaoyaojin": "张辽威震逍遥津：三国古战场遗址，回程晨走收官。",
};

const spots = [
  { id:"nanjing-fuzimiao", name:"夫子庙·秦淮河", city:"南京", emoji:"🏮", rating:4.5, dur:"2-3小时", price:"街区免费（贡院/游船另购）" },
  { id:"nanjing-zhonghuamen", name:"中华门瓮城", city:"南京", emoji:"🏯", rating:4.4, dur:"1小时", price:"50元（60+免票）" },
  { id:"luoyang-longmen", name:"龙门石窟", city:"洛阳", emoji:"🛕", rating:5.0, dur:"3-4小时", price:"90元（60+/12-免票）" },
  { id:"luoyang-museum", name:"洛阳博物馆", city:"洛阳", emoji:"🏺", rating:4.6, dur:"2小时", price:"免费（预约）" },
  { id:"luoyang-baimasi", name:"白马寺", city:"洛阳", emoji:"⛩️", rating:4.5, dur:"2-3小时", price:"35元（60+免票）" },
  { id:"luoyang-luoyi", name:"洛邑古城", city:"洛阳", emoji:"🎡", rating:4.2, dur:"2小时", price:"免费" },
  { id:"luoyang-yingtianmen", name:"应天门·灯光秀", city:"洛阳", emoji:"✨", rating:4.4, dur:"1-2小时", price:"外观免费（登城30元）" },
  { id:"xian-bingmayong", name:"秦始皇兵马俑", city:"西安", emoji:"🧱", rating:5.0, dur:"3-4小时", price:"120元（65+/儿童免票）" },
  { id:"xian-dayanta", name:"大雁塔·大慈恩寺", city:"西安", emoji:"🗼", rating:4.6, dur:"2小时", price:"40元（登塔25元）" },
  { id:"xian-datangbuyecheng", name:"大唐不夜城", city:"西安", emoji:"🌙", rating:4.7, dur:"2-3小时", price:"免费" },
  { id:"xian-shanxi-history", name:"陕西历史博物馆", city:"西安", emoji:"👑", rating:4.8, dur:"2-3小时", price:"免费（提前7天预约！）" },
  { id:"xian-citywall", name:"西安城墙", city:"西安", emoji:"🧱", rating:4.6, dur:"2小时", price:"54元（65+免票）" },
  { id:"xian-huiminjie", name:"回民街·大皮院", city:"西安", emoji:"🥙", rating:4.3, dur:"2小时", price:"免费" },
  { id:"sanmenxia-hangu", name:"函谷关", city:"三门峡", emoji:"⛰️", rating:4.3, dur:"2-2.5小时", price:"75元（60+半价/免票）" },
  { id:"sanmenxia-dikengyuan", name:"陕州地坑院", city:"三门峡", emoji:"🕳️", rating:4.4, dur:"2-2.5小时", price:"70元（60+免票）" },
  { id:"sanmenxia-swan", name:"天鹅湖湿地公园", city:"三门峡", emoji:"🦢", rating:4.5, dur:"2小时", price:"免费" },
  { id:"sanmenxia-guoguo", name:"虢国博物馆", city:"三门峡", emoji:"⚔️", rating:4.5, dur:"1.5小时", price:"40元（60+免票）" },
  { id:"sanmenxia-daba", name:"三门峡大坝·中流砥柱", city:"三门峡", emoji:"🌊", rating:4.2, dur:"2小时", price:"现场公示" },
  { id:"hefei-xiaoyaojin", name:"逍遥津公园", city:"合肥", emoji:"🌳", rating:4.2, dur:"1小时", price:"免费" },
].map(s => ({ ...s, intro: intro[s.id] }));

let html = readFileSync("/Users/taoge/family-trip-web/index.html", "utf8");
html = html.replace("${SPOT_DATA_PLACEHOLDER}", JSON.stringify(spots));
html = html.replace("${NAR_PLACEHOLDER}", JSON.stringify(narrations));
writeFileSync("/Users/taoge/family-trip-web/index.html", html);
console.log("injected:", spots.length, "spots,", Object.keys(narrations).length, "narrations, size:", html.length);