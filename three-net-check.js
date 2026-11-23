/***
 * 三网全链路测试（Quantumult X 交互脚本）v2 · 体感版
 *
 * 用法：在 QX 首页长按任意节点/策略组，选择「三网全链路测试」。
 * 脚本会经所选节点（$environment.params）发出真实请求，面板显示：
 *   - 出口 IP / ISP / ASN / 归属地（数据来源 api.ip.sb）
 *   - 电信 / 联通 / 移动三家官网的完整打开耗时（真实 GET，跟随跳转，
 *     含握手、服务器响应与页面传输；每家测 2 次取最优）
 *   - 经当前节点的真实下载速度（下载 2 MB 测速文件实测，Cloudflare 测速源）
 *
 * 说明：测的是贴近日常使用的全链路体感，不是 ping 值，也不是线路
 * （CN2 GIA/9929 等）判定——QX 脚本沙箱只有 HTTP 能力，没有 traceroute/ICMP。
 * 本脚本不含任何凭据与私有信息，测速点均为公开服务。
 *
 * [task_local]
 * event-interaction https://raw.githubusercontent.com/bzdemo/qx-scripts/main/three-net-check.js, tag=三网全链路测试, img-url=antenna.radiowaves.left.and.right.system, enabled=true
 */

var opts = {
  policy: $environment.params
};

var UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

var CARRIERS = [
  { name: "电信", color: "#8CA894", url: "https://www.189.cn/" },
  { name: "联通", color: "#BAA66E", url: "https://www.10010.com/" },
  { name: "移动", color: "#9A8AA6", url: "https://www.10086.cn/" }
];

var DL_BYTES = 2000000;
var DL_URL = "https://speed.cloudflare.com/__down?bytes=" + DL_BYTES;

function fetchWithTimeout(req, ms) {
  return Promise.race([
    $task.fetch(req),
    new Promise(function (resolve, reject) {
      setTimeout(function () { reject("Timeout"); }, ms);
    })
  ]);
}

function loadOnce(url) {
  var start = Date.now();
  return fetchWithTimeout({
    url: url,
    method: "GET",
    opts: opts,
    timeout: 8000,
    headers: { "User-Agent": UA }
  }, 8000).then(function () {
    return Date.now() - start;
  }, function () {
    return -1;
  });
}

async function loadCarrier(carrier) {
  var best = -1;
  var ok = 0;
  for (var i = 0; i < 2; i++) {
    var t = await loadOnce(carrier.url);
    if (t >= 0) {
      ok++;
      if (best < 0 || t < best) best = t;
    }
  }
  return { name: carrier.name, color: carrier.color, best: best, ok: ok };
}

function getExitInfo() {
  return fetchWithTimeout({
    url: "https://api.ip.sb/geoip",
    opts: opts,
    timeout: 5000,
    headers: { "User-Agent": UA }
  }, 5000).then(function (response) {
    try {
      return JSON.parse(response.body);
    } catch (e) {
      return null;
    }
  }, function () {
    return null;
  });
}

function downloadTest() {
  var start = Date.now();
  return fetchWithTimeout({
    url: DL_URL,
    opts: opts,
    timeout: 20000,
    headers: { "User-Agent": UA }
  }, 20000).then(function () {
    var secs = (Date.now() - start) / 1000;
    if (secs <= 0) return -1;
    return (DL_BYTES * 8) / secs / 1000000;
  }, function () {
    return -1;
  });
}

function flagEmoji(cc) {
  if (!cc || cc.length !== 2) return "";
  var base = 127397;
  var code = cc.toUpperCase();
  return String.fromCodePoint(code.charCodeAt(0) + base, code.charCodeAt(1) + base);
}

;(async () => {
  var results = await Promise.all([
    getExitInfo(),
    loadCarrier(CARRIERS[0]),
    loadCarrier(CARRIERS[1]),
    loadCarrier(CARRIERS[2])
  ]);
  var mbps = await downloadTest();

  var info = results[0];
  var lines = [];

  lines.push("------------------------------");

  if (info && info.ip) {
    var loc = "";
    if (info.country_code) loc += flagEmoji(info.country_code) + " " + info.country_code;
    if (info.city) loc += " · " + info.city;
    lines.push("<b>出口 IP</b> : " + info.ip);
    if (info.isp) lines.push("<b>ISP</b> : " + info.isp + (info.asn ? "（AS" + info.asn + "）" : ""));
    if (loc) lines.push("<b>归属</b> : " + loc);
  } else {
    lines.push("🛑 出口信息查询失败");
  }

  lines.push("------------------------------");

  for (var i = 1; i < results.length; i++) {
    var r = results[i];
    var val = r.best >= 0 ? ("<b>" + r.best + " ms</b>（" + r.ok + "/2）") : "超时（0/2）";
    lines.push("<font color=" + r.color + "><b>" + r.name + "</b></font> : " + val);
  }

  var dl = mbps >= 0 ? ("<b>" + mbps.toFixed(1) + " Mbps</b>") : "失败";
  lines.push("<b>下载</b> : " + dl + "（2MB 实测）");

  lines.push("------------------------------");
  lines.push("<font color=#CD5C5C><b>节点</b> ➟ " + $environment.params + "</font>");
  lines.push("<font color=#949EA0>体感实测：三网为官网完整打开耗时</font>");

  var content = "<p style=\"text-align: center; font-family: -apple-system; font-size: large; font-weight: thin\">" + lines.join("</br>") + "</p>";

  $done({ "title": "🌐 三网全链路测试", "htmlMessage": content });
})();
