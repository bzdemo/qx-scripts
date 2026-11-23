/***
 * 节点体感测试（Quantumult X 交互脚本）
 *
 * 用法：在 QX 首页长按任意节点/策略组，选择「节点体感测试」。
 * 脚本会经所选节点（$environment.params）真实打开 5 个海外常用官网
 * （YouTube / GitHub / X / Wikipedia / Apple），面板显示：
 *   - 出口 IP / ISP / ASN / 归属地（数据来源 api.ip.sb）
 *   - 5 站完整打开耗时的平均值（ headline 指标）与各站明细
 *
 * 思路：节点日常就是用来打开这类海外站点的，多站平均比单点数字
 * 更贴近实际使用体感，也不受单个站点当天状态的影响。
 * 本脚本不含任何凭据与私有信息。
 *
 * [task_local]
 * event-interaction https://raw.githubusercontent.com/bzdemo/qx-scripts/main/node-feel.js, tag=节点体感测试, img-url=play.rectangle.system, enabled=true
 */

var opts = {
  policy: $environment.params
};

var UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

var SITES = [
  { name: "YouTube", url: "https://www.youtube.com/" },
  { name: "GitHub", url: "https://github.com/" },
  { name: "X", url: "https://x.com/" },
  { name: "Wikipedia", url: "https://en.wikipedia.org/" },
  { name: "Apple", url: "https://www.apple.com/" }
];

function fetchWithTimeout(req, ms) {
  return Promise.race([
    $task.fetch(req),
    new Promise(function (resolve, reject) {
      setTimeout(function () { reject("Timeout"); }, ms);
    })
  ]);
}

function loadSite(site) {
  var start = Date.now();
  return fetchWithTimeout({
    url: site.url,
    method: "GET",
    opts: opts,
    timeout: 10000,
    headers: { "User-Agent": UA }
  }, 10000).then(function () {
    return { name: site.name, ms: Date.now() - start };
  }, function () {
    return { name: site.name, ms: -1 };
  });
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
  var jobs = [getExitInfo()];
  for (var i = 0; i < SITES.length; i++) jobs.push(loadSite(SITES[i]));
  var results = await Promise.all(jobs);

  var info = results[0];
  var sites = results.slice(1);

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

  var sum = 0;
  var ok = 0;
  for (var j = 0; j < sites.length; j++) {
    if (sites[j].ms >= 0) {
      sum += sites[j].ms;
      ok++;
    }
  }
  if (ok > 0) {
    lines.push("<b>平均打开</b> : <b>" + Math.round(sum / ok) + " ms</b>（" + ok + "/" + sites.length + " 站）");
  } else {
    lines.push("<b>平均打开</b> : 全部超时");
  }

  lines.push("------------------------------");

  for (var k = 0; k < sites.length; k++) {
    var s = sites[k];
    lines.push("<b>" + s.name + "</b> : " + (s.ms >= 0 ? (s.ms + " ms") : "超时"));
  }

  lines.push("------------------------------");
  lines.push("<font color=#CD5C5C><b>节点</b> ➟ " + $environment.params + "</font>");
  lines.push("<font color=#949EA0>经当前节点打开海外常用站点实测</font>");

  var content = "<p style=\"text-align: center; font-family: -apple-system; font-size: large; font-weight: thin\">" + lines.join("</br>") + "</p>";

  $done({ "title": "📺 节点体感测试", "htmlMessage": content });
})();
