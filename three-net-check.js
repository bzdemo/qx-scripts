/***
 * 三网全链路测试（Quantumult X 交互脚本）
 *
 * 用法：在 QX 首页长按任意节点/策略组，选择「三网全链路测试」。
 * 脚本会经所选节点（$environment.params）发出请求，面板显示：
 *   - 出口 IP / ISP / ASN / 归属地（数据来源 api.ip.sb）
 *   - 电信 / 联通 / 移动三家官网的全链路延迟（每家 3 次取最优）与连通次数
 *
 * 说明：QX 脚本沙箱只有 HTTP 能力、没有 traceroute/ICMP，
 * 因此这里测的是「经当前节点的全链路 HTTP 延迟」，不是线路（CN2 GIA/9929 等）判定。
 * 本脚本不含任何凭据与私有信息，测速点均为运营商公开官网。
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

function fetchWithTimeout(req, ms) {
  return Promise.race([
    $task.fetch(req),
    new Promise(function (resolve, reject) {
      setTimeout(function () { reject("Timeout"); }, ms);
    })
  ]);
}

function probeOnce(url) {
  var start = Date.now();
  return fetchWithTimeout({
    url: url,
    method: "HEAD",
    opts: opts,
    timeout: 5000,
    headers: { "User-Agent": UA }
  }, 5000).then(function () {
    return Date.now() - start;
  }, function () {
    return -1;
  });
}

async function probeCarrier(carrier) {
  var best = -1;
  var ok = 0;
  for (var i = 0; i < 3; i++) {
    var t = await probeOnce(carrier.url);
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

function flagEmoji(cc) {
  if (!cc || cc.length !== 2) return "";
  var base = 127397;
  var code = cc.toUpperCase();
  return String.fromCodePoint(code.charCodeAt(0) + base, code.charCodeAt(1) + base);
}

;(async () => {
  var results = await Promise.all([
    getExitInfo(),
    probeCarrier(CARRIERS[0]),
    probeCarrier(CARRIERS[1]),
    probeCarrier(CARRIERS[2])
  ]);

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
    var val = r.best >= 0 ? ("<b>" + r.best + " ms</b>（" + r.ok + "/3）") : "超时（0/3）";
    lines.push("<font color=" + r.color + "><b>" + r.name + "</b></font> : " + val);
  }

  lines.push("------------------------------");
  lines.push("<font color=#CD5C5C><b>节点</b> ➟ " + $environment.params + "</font>");
  lines.push("<font color=#949EA0>全链路延迟：经当前节点至运营商官网</font>");

  var content = "<p style=\"text-align: center; font-family: -apple-system; font-size: large; font-weight: thin\">" + lines.join("</br>") + "</p>";

  $done({ "title": "🌐 三网全链路测试", "htmlMessage": content });
})();
