/***
 * 节点体感测试（Quantumult X 交互脚本）
 *
 * 用法：在 QX 首页长按任意节点/策略组，选择「节点体感测试」。
 * 脚本会经所选节点（$environment.params）发出真实请求，面板显示：
 *   - 出口 IP / ISP / ASN / 归属地（数据来源 api.ip.sb）
 *   - 经当前节点打开 YouTube 官网的完整耗时（真实 GET，含握手、
 *     服务器响应与页面传输；测 2 次取最优）
 *
 * 思路：节点日常就是用来打开 YouTube 这类海外站点的，测它才贴近
 * 实际使用体感。本脚本不含任何凭据与私有信息。
 *
 * [task_local]
 * event-interaction https://raw.githubusercontent.com/bzdemo/qx-scripts/main/node-feel.js, tag=节点体感测试, img-url=play.rectangle.system, enabled=true
 */

var opts = {
  policy: $environment.params
};

var UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

var TARGET = { name: "YouTube", url: "https://www.youtube.com/" };

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
    timeout: 10000,
    headers: { "User-Agent": UA }
  }, 10000).then(function () {
    return Date.now() - start;
  }, function () {
    return -1;
  });
}

async function loadTarget() {
  var best = -1;
  var ok = 0;
  for (var i = 0; i < 2; i++) {
    var t = await loadOnce(TARGET.url);
    if (t >= 0) {
      ok++;
      if (best < 0 || t < best) best = t;
    }
  }
  return { best: best, ok: ok };
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
  var results = await Promise.all([getExitInfo(), loadTarget()]);
  var info = results[0];
  var yt = results[1];
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

  var val = yt.best >= 0 ? ("<b>" + yt.best + " ms</b>（" + yt.ok + "/2）") : "超时（0/2）";
  lines.push("<b>YouTube 打开</b> : " + val);

  lines.push("------------------------------");
  lines.push("<font color=#CD5C5C><b>节点</b> ➟ " + $environment.params + "</font>");
  lines.push("<font color=#949EA0>经当前节点打开 YouTube 官网实测</font>");

  var content = "<p style=\"text-align: center; font-family: -apple-system; font-size: large; font-weight: thin\">" + lines.join("</br>") + "</p>";

  $done({ "title": "📺 节点体感测试", "htmlMessage": content });
})();
