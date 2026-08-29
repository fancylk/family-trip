// 批量查询行程全部 POI 的高德 GCJ-02 坐标，生成 scripts/pois.json
// 用法：AMAP_KEY=xxx node scripts/gen_pois.js  （或读取 .agents/skills/amap-lbs-skill/config.json）
// 输出：scripts/pois.json —— 供手工 review 后内联进 index.html 的 SPOT_LL / POI_LL
import { readFileSync, writeFileSync } from "node:fs";

const KEY = process.env.AMAP_KEY || (() => {
  try { return JSON.parse(readFileSync(new URL("../.agents/skills/amap-lbs-skill/config.json", import.meta.url), "utf8")).webServiceKey; }
  catch { return ""; }
})();
if (!KEY || KEY.includes("your_")) { console.error("❌ 未找到高德 key（AMAP_KEY 或 skill config.json）"); process.exit(1); }

// key: 页面内引用 id；q: 搜索词；city: 城市限定；match: 在候选里优选包含该子串的 POI（缺省取第一条）
// strict: 候选中没有 match 时宁可不带坐标（运行时退化为关键词搜索），也不选错点
const QUERIES = [
  /* ---- 景点（SPOTS 19） ---- */
  { key: "nanjing-fuzimiao",     q: "夫子庙",               city: "南京",   match: "夫子庙" },
  { key: "nanjing-zhonghuamen",  q: "中华门瓮城",           city: "南京",   match: "中华门" },
  { key: "luoyang-longmen",      q: "龙门石窟",             city: "洛阳",   match: "龙门石窟" },
  { key: "luoyang-museum",       q: "洛阳博物馆",           city: "洛阳",   match: "洛阳博物馆" },
  { key: "luoyang-baimasi",      q: "白马寺",               city: "洛阳",   match: "白马寺" },
  { key: "luoyang-luoyi",        q: "洛邑古城",             city: "洛阳",   match: "洛邑古城" },
  { key: "luoyang-yingtianmen",  q: "应天门",               city: "洛阳",   match: "应天门" },
  { key: "xian-bingmayong",      q: "秦始皇兵马俑博物馆",   city: "西安",   match: "兵马俑" },
  { key: "xian-dayanta",         q: "大雁塔",               city: "西安",   match: "大雁塔" },
  { key: "xian-datangbuyecheng", q: "大唐不夜城",           city: "西安",   match: "大唐不夜城" },
  { key: "xian-shanxi-history",  q: "陕西历史博物馆",       city: "西安",   match: "陕西历史博物馆" },
  { key: "xian-citywall",        q: "永宁门",               city: "西安",   match: "城楼" },
  { key: "xian-huiminjie",       q: "西安鼓楼",             city: "西安",   match: "鼓楼" },
  { key: "sanmenxia-huashan",    q: "华山游客中心",         city: "渭南",   match: "游客" },
  { key: "sanmenxia-hangu",      q: "函谷关",               city: "三门峡", match: "函谷关" },
  { key: "sanmenxia-dikengyuan", q: "陕州地坑院",           city: "三门峡", match: "地坑院" },
  { key: "sanmenxia-swan",       q: "天鹅湖国家城市湿地公园", city: "三门峡", match: "天鹅湖" },
  { key: "sanmenxia-guoguo",     q: "虢国博物馆",           city: "三门峡", match: "虢国" },
  { key: "sanmenxia-daba",       q: "三门峡大坝",           city: "三门峡", match: "大坝" },
  { key: "kaifeng-qingminghuayuan", q: "清明上河园",        city: "开封",   match: "清明上河园" },
  /* ---- 行程途经点 ---- */
  { key: "laomendong",           q: "老门东",               city: "南京",   match: "老门东" },
  { key: "shizijie",             q: "洛阳老城十字街",       city: "洛阳",   match: "十字街" },
  { key: "wentang",              q: "高阳山温泉",           city: "三门峡", match: "高阳山温泉" },
  { key: "ganshan",              q: "甘山国家森林公园",     city: "三门峡", match: "甘山" },
  { key: "longting",             q: "龙亭公园",             city: "开封",   match: "龙亭" },
  { key: "gulouyeshi",           q: "开封鼓楼广场",         city: "开封",   match: "鼓楼" },
  { key: "xiyuemiao",            q: "西岳庙",               city: "渭南",   match: "西岳庙" },
  /* ---- 住宿（行程入住 + 页面方案） ---- */
  { key: "zhuanyuanlou",         q: "南京状元楼大酒店",     city: "南京",   match: "状元楼" },
  { key: "huayang",              q: "洛阳华阳广场国际大饭店", city: "洛阳", match: "华阳" },
  { key: "hampton-xian",         q: "欢朋希尔顿酒店",       city: "西安",   match: "雁塔", strict: true, offset: 20 },
  { key: "tianehu-hotel",        q: "三门峡天鹅湖国际酒店", city: "三门峡", match: "天鹅湖" },
  { key: "hanting-kaifeng",      q: "汉庭酒店",             city: "开封",   match: "清明上河园" },
  { key: "hanting-nanjing",      q: "汉庭酒店",             city: "南京",   match: "夫子庙", strict: true, offset: 20 },
  { key: "hanting-luoyang",      q: "汉庭酒店",             city: "洛阳",   match: "龙门站" },
  { key: "hanting-xian",         q: "汉庭酒店",             city: "西安",   match: "大雁塔", strict: true, offset: 20 },
  { key: "7days-sanmenxia",      q: "万达广场",             city: "三门峡", match: "万达广场" },
  /* ---- 美食（FOODS 12） ---- */
  { key: "f-nanjindapaidang",    q: "南京大牌档",           city: "南京",   match: "夫子庙" },
  { key: "f-yadepu",             q: "鸭得堡老鸭汤鸭血粉丝", city: "南京",   match: "夫子庙", strict: true, offset: 20 },
  { key: "f-shuixiyuan",         q: "洛阳水席园",           city: "洛阳",   match: "水席园" },
  { key: "f-laoluoyang",         q: "老雒阳面馆",           city: "洛阳",   match: "老城店" },
  { key: "f-zhenbutong",         q: "真不同饭店",           city: "洛阳",   match: "中州东路" },
  { key: "f-lingbaoyangrou",     q: "灵宝金城羊肉馆",       city: "三门峡", match: "金城" },
  { key: "f-shidawan",           q: "地坑院民俗",           city: "三门峡", match: "民俗文化园" },
  { key: "f-laomijia",           q: "老米家大雨泡馍",       city: "西安",   match: "老米家" },
  { key: "f-changandapaidang",   q: "长安大排档",           city: "西安",   match: "陕历博" },
  { key: "f-zhangji",            q: "子午路张记肉夹馍",     city: "西安",   match: "翠华路", strict: true, offset: 20 },
  { key: "f-defachang",          q: "德发长饺子馆",         city: "西安",   match: "钟楼" },
  { key: "f-diyilou",            q: "第一楼灌汤包",         city: "开封",   match: "寺后街", strict: true, offset: 20 },
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function search({ q, city, match, strict, offset = 6 }) {
  const u = new URL("https://restapi.amap.com/v3/place/text");
  u.search = new URLSearchParams({ key: KEY, keywords: q, city, citylimit: "true", offset: String(offset), page: "1", extensions: "base" });
  const r = await fetch(u);
  const j = await r.json();
  if (String(j.status) !== "1") throw new Error(j.info || "unknown");
  const pois = j.pois || [];
  const hit = match ? pois.find(p => p.name.includes(match)) : pois[0];
  const pick = hit || (strict ? null : pois[0]) || null;
  return { pick, cands: pois.map(p => `${p.name} @${p.address} [${p.location}]`) };
}

const out = {}, review = [];
for (const it of QUERIES) {
  try {
    const { pick, cands } = await search(it);
    if (pick && pick.location && pick.location.includes(",")) {
      out[it.key] = { name: pick.name, ll: pick.location, address: pick.address };
      review.push(`✔ ${it.key.padEnd(22)} ${pick.name}  ${pick.location}`);
    } else {
      review.push(`✘ ${it.key.padEnd(22)} 未命中（${it.q} @${it.city}）`);
    }
    if (cands.length > 1) review.push(`     候选: ${cands.slice(0, 4).join(" | ")}`);
  } catch (e) {
    review.push(`✘ ${it.key.padEnd(22)} 查询失败: ${e.message}`);
  }
  await sleep(180); // 个人开发者 QPS 限制保护
}

writeFileSync(new URL("./pois.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(review.join("\n"));
console.log(`\n完成：${Object.keys(out).length}/${QUERIES.length} → scripts/pois.json`);
