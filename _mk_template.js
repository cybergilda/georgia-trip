const fs = require('fs');
const SRC = '/Users/yangmengying/WorkBuddy/2026-09-07-13-14-20/georgia-trip/public/index.html';
const OUT = '/Users/yangmengying/.workbuddy/skills/travel-handbook/assets/template.html';

const src = fs.readFileSync(SRC, 'utf8');
const style = src.match(/<style>([\s\S]*?)<\/style>/)[1];
let script = src.match(/<script>([\s\S]*?)<\/script>/)[1];

/* ---------- 替换示例数据 ---------- */

const P = `var P = {
  apt:   {n:"示例国际机场",   lat:35.7720, lon:140.3929, q:"International Airport"},
  hotel: {n:"示例酒店",       lat:34.9858, lon:135.7588, q:"Hotel"},
  spot1: {n:"示例景点 A",     lat:34.9949, lon:135.7850, q:"Spot A"},
  spot2: {n:"示例景点 B",     lat:35.0050, lon:135.7649, q:"Spot B"}
};`;

const SN = `var SN = {
  apt:"机场", hotel:"酒店", spot1:"景点A", spot2:"景点B"
};`;

const DAYS = `var DAYS = [
{
 n:1, date:"D1", wd:"示例", color:"#B5762E",
 title:"抵达 + 市区", sub:"落地 · 入住",
 stay:"示例酒店",
 route:["apt","hotel","spot1"],
 nav:["apt","hotel","spot1"],
 warn:"把这一天的风险点写在这里，页面会用醒目底色渲染。",
 items:[
  {t:"15:35", tz:"当地", c:"落地", s:"取行李、换汇、买电话卡", p:"apt"},
  {t:"17:00", tz:"当地", c:"入住酒店", s:"地址与房东名写这里", p:"hotel"},
  {t:"19:00", tz:"当地", c:"晚餐", s:"", p:"spot1"}
 ]
},
{
 n:2, date:"D2", wd:"示例", color:"#5D8A3A",
 title:"市区一日", sub:"步行 + 公共交通",
 stay:"示例酒店",
 route:["hotel","spot1","spot2","hotel"],
 nav:["hotel","spot1","spot2"],
 warn:"",
 items:[
  {t:"09:00", tz:"当地", c:"出门", s:"", p:"hotel"},
  {t:"09:30", tz:"当地", c:"示例景点 A", s:"需要提前订票就加 b 字段", p:"spot1", b:"需预约"},
  {t:"13:00", tz:"当地", c:"午餐", s:"", p:"spot2"},
  {t:"15:00", tz:"当地", c:"示例景点 B", s:"", p:"spot2"}
 ]
}
];`;

// 注意：源码里 MS 以 ].map(...) 结尾，替换时保留 .map( 前缀
const MS = `var MS = [
 {t:"2027-01-01T15:35:00+09:00", off:540, l:"落地", s:"示例城市", u:"当地"},
 {t:"2027-01-05T16:35:00+09:00", off:540, l:"返程起飞", s:"→ 回家", u:"当地"}
]`;

const reps = [
  [/var P = \{[\s\S]*?\n\};/, P],
  [/var SN = \{[\s\S]*?\n\};/, SN],
  [/var DAYS = \[[\s\S]*?\n\];/, DAYS],
  [/var MS = \[[\s\S]*?\n\]\.map\(/, MS + '\n].map(']
];
reps.forEach(([re, val]) => {
  if (!re.test(script)) { console.log('!! 未匹配: ' + re); process.exit(1); }
  script = script.replace(re, val);
});

/* ---------- 组装 body ---------- */

const body = [
'<!doctype html>',
'<html lang="zh-CN">',
'<head>',
'<meta charset="utf-8">',
'<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
'<meta name="theme-color" content="#f6f1e6" media="(prefers-color-scheme: light)">',
'<meta name="theme-color" content="#151513" media="(prefers-color-scheme: dark)">',
'<title>旅行手册 · 模板</title>',
'<style>',
style,
'/* 出行前准备清单 */',
'.pack{list-style:none;margin:7px 0 0;padding:0;font-size:13.5px;line-height:1.72}',
'.pack li{padding-left:15px;position:relative;margin-bottom:4px}',
'.pack li:before{content:"";position:absolute;left:2px;top:8px;width:5px;height:5px;border-radius:50%;background:var(--muted);opacity:.45}',
'.pack li b{color:var(--ink)}',
'.pack li.key:before{background:var(--warn);opacity:1}',
'</style>',
'</head>',
'<body>',
'<button id="themeBtn" aria-label="切换配色">◐</button>',
'<div class="wrap">',
'',
'<!-- ===== 1. 顶部：改标题、日期、人数、时区栏 ===== -->',
'<header>',
'  <div class="k">DESTINATION · YEAR</div>',
'  <h1>目的地 N 天</h1>',
'  <div class="sub">起 — 止 · <b>N 人</b> · 一句话行程亮点</div>',
'  <div class="tzbar">',
'    <span>当地 <b>TZ</b> · UTC±N</span>',
'    <span>北京 <b>CST</b> · UTC+8</span>',
'    <span>北京 ± Nh = 当地时间</span>',
'  </div>',
'</header>',
'',
'<!-- ===== 2. 此刻关注：JS 自动扫 MS 找下一个事件，只需维护 MS 数组 ===== -->',
'<section id="now">',
'  <div class="lab">此 刻 关 注</div>',
'  <div class="what" id="nWhat">—</div>',
'  <div class="sub2" id="nSub">—</div>',
'  <div class="cd" id="nCd"></div>',
'  <div class="at" id="nAt"></div>',
'  <div class="clocks" id="nClock"></div>',
'</section>',
'',
'<!-- ===== 3. 总览地图：svg#bigmap 由 JS 按 DAYS 渲染；地图轮廓在脚本 NORTH 里 ===== -->',
'<section class="sec">',
'  <div class="sec-h"><span class="n">MAP</span><h2>行程总览</h2><span class="hint">点地名直接导航</span></div>',
'  <div class="mapcard">',
'    <svg id="bigmap" viewBox="0 0 800 470" role="img" aria-label="行程总览地图"></svg>',
'    <div class="legend" id="legend"></div>',
'  </div>',
'</section>',
'',
'<!-- ===== 4. 出行前准备：按类别分组，<li class="key"> 会显示橙色圆点 ===== -->',
'<section class="sec">',
'  <div class="sec-h"><span class="n">PACKING</span><h2>出行前准备</h2><span class="hint">按类别清点</span></div>',
'  <div class="note">最容易漏掉的三样：<b>AAA</b>、<b>BBB</b>、<b>CCC</b>。其余到了当地都能补。</div>',
'  <div class="tips">',
'    <div class="tip"><h4>证件与票据</h4><ul class="pack">',
'      <li class="key"><b>护照</b>，有效期需覆盖到行程结束后 6 个月</li>',
'      <li>机票行程单：纸质一份 + 手机离线存一份</li>',
'    </ul></div>',
'    <div class="tip"><h4>装备</h4><ul class="pack">',
'      <li class="key">按行程最硬的那一段准备</li>',
'      <li>其余条目…</li>',
'    </ul></div>',
'  </div>',
'</section>',
'',
'<!-- ===== 5. 已确认：机票 / 租车 / 住宿。确认号、证件号、房间号一律不写 ===== -->',
'<section class="sec">',
'  <div class="sec-h"><span class="n">BOOKED</span><h2>已确认</h2><span class="hint">时间 · 地址 · 电话</span></div>',
'',
'  <div class="card">',
'    <h3>机票 <span class="tag">航司 · N 人</span></h3>',
'    <div class="tline"><span class="tt">D1</span><span class="tzx">北京</span><span class="tx">00:00 XXXX 起飞 · <b>航班号</b><small>→ HH:MM 落地</small></span></div>',
'    <div class="note">提醒：国际航班提前 3 小时到机场。</div>',
'  </div>',
'',
'  <div class="grid2">',
'    <div class="card">',
'      <h3>租车 <span class="tag">车行</span></h3>',
'      <dl class="kv">',
'        <dt>车型</dt><dd>车型 · 自动</dd>',
'        <dt>取车</dt><dd><b>日期 时间</b><br>地点</dd>',
'        <dt>还车</dt><dd><b>日期 时间</b><br>地点</dd>',
'        <dt>电话</dt><dd><a href="tel:+000000000" style="color:var(--accent)">+00 000 000 000</a></dd>',
'      </dl>',
'    </div>',
'    <div class="card">',
'      <h3>住宿 <span class="tag">N 段已订</span></h3>',
'      <div class="hotel">',
'        <div class="hn">① 酒店名</div>',
'        <div class="hd"><span class="plink" data-p="hotel">地址</span> · 房东</div>',
'        <div class="hm">入住 <b>HH:MM</b> → 退房 <b>HH:MM</b></div>',
'      </div>',
'    </div>',
'  </div>',
'</section>',
'',
'<!-- ===== 6. 逐日行程：容器保持为空，由 JS 读 DAYS 渲染 ===== -->',
'<section class="sec">',
'  <div class="sec-h"><span class="n">DAYS</span><h2>逐日行程</h2><span class="hint">点标题展开当日路线</span></div>',
'  <div id="days"></div>',
'</section>',
'',
'<!-- ===== 7. 待办：纯列表，绝不做 checkbox（勾选不同步）。urgent 类标红 ===== -->',
'<section class="sec">',
'  <div class="sec-h"><span class="n">TODO</span><h2>待办清单</h2><span class="hint">办完一项说一声，我改页面</span></div>',
'  <ol class="todo">',
'    <li class="urgent">最紧急的事<small>补充说明</small></li>',
'    <li>次紧急的事</li>',
'  </ol>',
'</section>',
'',
'<!-- ===== 8. 实用贴士 ===== -->',
'<section class="sec">',
'  <div class="sec-h"><span class="n">TIPS</span><h2>实用贴士</h2></div>',
'  <div class="tips">',
'    <div class="tip"><h4>时区</h4><p>当地 <b>UTC±N</b>。与北京差 N 小时。</p></div>',
'    <div class="tip"><h4>安全</h4><p>紧急电话 <b>112</b>；中国外交部全球领保热线 <b>+86-10-12308</b>。</p></div>',
'  </div>',
'</section>',
'',
'<footer>',
'  页面时间一律标注时区 · 公开页面，未收录任何确认号、证件号、房间号',
'</footer>',
'</div>',
'',
'<script>',
script,
'</script>',
'</body>',
'</html>',
''
].join('\n');

fs.mkdirSync(require('path').dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, body);
console.log('✓ 模板已生成: ' + OUT);
console.log('  大小: ' + (body.length / 1024).toFixed(1) + ' KB');

try { new Function(script); console.log('  ✓ 模板 JS 语法 OK'); }
catch (e) { console.log('  ✗ JS 错误: ' + e.message); process.exit(1); }
console.log('  外部请求: ' + (body.match(/https?:\/\/(?!www\.google\.com)/g) || []).length);
console.log('  区块: ' + [...body.matchAll(/<span class="n">([A-Z]+)<\/span><h2>([^<]+)</g)].map(m => m[1]).join(' → '));
