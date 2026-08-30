// 用高德路径规划API核算每天游览链路的顺序合理性,并生成页面用的段级距离/交通元数据
// 输出: scripts/segmeta.json  ( SEG_META: 段名 → 距酒店/距上站 km + 建议交通 )
// 用法: node scripts/gen_segmeta.mjs   (key 读 .agents/skills/amap-lbs-skill/config.json)
import { readFileSync, writeFileSync } from "node:fs";

const KEY = JSON.parse(readFileSync(new URL("../.agents/skills/amap-lbs-skill/config.json", import.meta.url), "utf8")).webServiceKey;
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const POI = eval("(" + html.match(/const POI=\{[\s\S]*?\n\s*\};/)[0].replace("const POI=", "").replace(/;$/, "") + ")");
if (process.env.DEBUG_POI) console.log("[debug] POI keys:", Object.keys(POI).length, "| 7days:", !!POI["7days-guanghuamen"], "| 龙门:", !!POI["luoyang-longmen"]);

// 每天的游览链:stop=[段名(与DAYS精确一致), POI key];from=上一站,首站默认=当天住宿(anchor)
// fromOverride 用于跨城日(如D4上午白马寺仍在洛阳)
const CHAIN = [
  { day: 1, anchor: "7days-guanghuamen", lbl: "距酒店", stops: [
    ["老门东 → 夫子庙", "laomendong"],
    ["秦淮河画舫 · 赏月", "nanjing-fuzimiao"]] },
  { day: 2, anchor: "bolongwan-luoyang", lbl: "距酒店", stops: [
    ["洛阳老城十字街（可选）", "shizijie"]] },
  { day: 3, anchor: "bolongwan-luoyang", lbl: "距酒店", stops: [
    ["龙门石窟", "luoyang-longmen"],
    ["午餐：洛阳水席园", "f-shuixiyuan"],
    ["洛阳博物馆", "luoyang-museum"],
    ["应天门灯光秀", "luoyang-yingtianmen"]] },
  { day: 4, anchor: "yanyu-xian", lbl: "距酒店", stops: [
    ["白马寺", "luoyang-baimasi", "bolongwan-luoyang"],   // 退房后先游白马寺,再驱车赴西安
    ["大雁塔 · 大慈恩寺", "xian-dayanta"],
    ["大唐不夜城", "xian-datangbuyecheng"]] },
  { day: 5, anchor: "yanyu-xian", lbl: "距酒店", stops: [
    ["陕西历史博物馆", "xian-shanxi-history"],
    ["午餐：德发长饺子宴", "f-defachang"],
    ["西安城墙 · 永宁门", "xian-citywall"],
    ["回民街 · 大皮院", "xian-huiminjie"]] },
  { day: 6, anchor: "7days-sanmenxia", lbl: "距市区参考点", stops: [
    ["秦始皇兵马俑", "xian-bingmayong", "yanyu-xian"],    // 西安出发
    ["华山 · 西峰索道", "sanmenxia-huashan"]] },
  { day: 7, anchor: "7days-sanmenxia", lbl: "距市区参考点", stops: [
    ["函谷关", "sanmenxia-hangu"],
    ["午餐：灵宝羊肉汤", "f-lingbaoyangrou"],
    ["陕州地坑院", "sanmenxia-dikengyuan"]] },
  { day: 8, anchor: "7days-sanmenxia", lbl: "距市区参考点", stops: [
    ["天鹅湖湿地晨走", "sanmenxia-swan"],
    ["虢国博物馆", "sanmenxia-guoguo"],
    ["三门峡大坝 · 中流砥柱", "sanmenxia-daba"]] },
  { day: 9, anchor: "7days-sanmenxia", lbl: "距市区参考点", stops: [
    ["陕州温塘温泉", "wentang"],
    ["甘山国家森林公园（可选）", "ganshan"]] },
  { day: 10, anchor: "kaifeng-qingminghuayuan", lbl: "距清明上河园", stops: [
    ["清明上河园", "kaifeng-qingminghuayuan"],
    ["鼓楼夜市", "gulouyeshi"]] },
  { day: 11, anchor: "kaifeng-qingminghuayuan", lbl: "距清明上河园", stops: [
    ["龙亭晨游（可选）", "longting"]] },
];

// 大城市中距离推荐公交/打车,小城市直接驾车;≤1.2km 步行
const BIG_CITIES = new Set([1, 2, 3, 4, 5, 10, 11]);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function route(type, o, d) {
  const u = `https://restapi.amap.com/v3/direction/${type}?key=${KEY}&origin=${o}&destination=${d}&extensions=base&strategy=0`;
  const r = await fetch(u);
  const j = await r.json();
  if (String(j.status) !== "1" || !j.route?.paths?.length) return null;
  const p = j.route.paths[0];
  return { km: +(p.distance / 1000).toFixed(1), min: Math.max(1, Math.round(p.duration / 60)) };
}

const SEG_META = {};
const report = [];
for (const day of CHAIN) {
  let prevKey = null, prevName = "(当天出发地 " + day.anchor + ")";
  const chain = [];
  for (const [segName, poiKey, fromOverride] of day.stops) {
    const from = fromOverride || prevKey || day.anchor;
    const o = POI[from]?.[1], d = POI[poiKey]?.[1];
    if (!o || !d) { report.push(`✘ D${day.day} ${segName}: 缺坐标(from=${from}) [debug: from类型=${JSON.stringify(from)} POI[from]=${JSON.stringify(POI[from])} POI大小=${Object.keys(POI).length} poiKey=${JSON.stringify(poiKey)}]`); prevKey = poiKey; prevName = segName; continue; }
    const drv = await route("driving", o, d);
    await sleep(320);
    let entry = { lbl: day.lbl };
    if (drv) {
      // 距酒店(锚点)距离:每段都算
      const hv = await route("driving", POI[day.anchor][1], d); await sleep(320);
      entry.h = hv?.km ?? null; entry.hm = hv?.min ?? null;
      // 距上站:跨城(>100km)无参考意义,置空不展示
      entry.p = drv.km > 100 ? null : drv.km; entry.pm = drv.km > 100 ? null : drv.min;
      if (drv.km <= 1.2) {
        const wk = await route("walking", o, d); await sleep(320);
        if (wk) { entry.mode = "walk"; entry.wm = wk.min; entry.p = wk.km; entry.pm = wk.min; }
        else { entry.mode = "car"; }
      } else if (drv.km <= 5 && BIG_CITIES.has(day.day)) {
        entry.mode = "transit";
      } else {
        entry.mode = "car";
      }
      chain.push({ name: segName, key: poiKey, km: drv.km });
      report.push(`D${day.day} ${segName}\n    ← 上站[${prevName}] 驾车${drv.km}km/${drv.min}min · ${day.lbl}${entry.h ?? "?"}km`);
    } else {
      report.push(`✘ D${day.day} ${segName}: 路径规划失败`);
    }
    SEG_META[segName] = entry;
    prevKey = poiKey; prevName = segName;
  }
  // 顺序合理性:≥3站时,固定首末站,枚举中间站排列比较总里程
  if (chain.length >= 3) {
    const first = chain[0], last = chain[chain.length - 1], mid = chain.slice(1, -1);
    const ll = k => POI[k][1];
    const dist = (a, b) => {
      const [x1, y1] = ll(a).split(",").map(Number), [x2, y2] = ll(b).split(",").map(Number);
      const R = 6371, r = Math.PI / 180;
      const q = Math.sin((y2 - y1) * r / 2) ** 2 + Math.cos(y1 * r) * Math.cos(y2 * r) * Math.sin((x2 - x1) * r / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(q));
    };
    const total = arr => { let t = 0; for (let i = 1; i < arr.length; i++) t += dist(arr[i - 1].key, arr[i].key); return t; };
    let best = null;
    const perms = (a, l = 0) => {
      if (l >= a.length) { const t = total([first, ...a, last]); if (!best || t < best.t) best = { order: [...a], t }; return; }
      for (let i = l; i < a.length; i++) { [a[l], a[i]] = [a[i], a[l]]; perms(a, l + 1); [a[l], a[i]] = [a[i], a[l]]; }
    };
    perms([...mid]);
    const planned = total([first, ...mid, last]);
    const tag = planned <= best.t + 0.3 ? "✅ 顺序合理" : `⚠️ 有更优: ${best.order.map(o => o.name).join(" → ")}(省${(planned - best.t).toFixed(1)}km)`;
    report.push(`D${day.day} 顺序核算: 计划${planned.toFixed(1)}km / 最优${best.t.toFixed(1)}km → ${tag}`);
  } else {
    report.push(`D${day.day} 站点≤2,顺序天然最优`);
  }
}

writeFileSync(new URL("./segmeta.json", import.meta.url), JSON.stringify(SEG_META, null, 1) + "\n");
console.log(report.join("\n"));
console.log(`\n完成:${Object.keys(SEG_META).length} 段 → scripts/segmeta.json`);
