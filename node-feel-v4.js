/***
 * 节点体感测试（Quantumult X 交互脚本）v4 · 真实分工版
 *
 * 用法：在 QX 首页长按任意节点/策略组，选择「节点体感测试」。
 * 按日常使用的真实分工测量：
 *   国外三家（Google / YouTube / Netflix）——经所选节点打开
 *   国内三家（百度 / 哔哩哔哩 / 腾讯QQ）——走手机直连（policy=direct）
 * 面板显示节点出口信息、两组各自的平均打开耗时与各站明细。
 *
 * 依次逐个打开而非并行：并行会互相抢带宽与并发，数字比真实体感虚高。
 * 本脚本不含任何凭据与私有信息。
 *
 * [task_local]
 * event-interaction https://raw.githubusercontent.com/bzdemo/qx-scripts/main/node-feel-v4.js, tag=节点体感测试, img-url=play.rectangle.system, enabled=true
 */

var UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

var GROUPS = [
  {
    label: "国外",
    via: "经节点",
    opts: { policy: $environment.params },
    sites: [
      { name: "Google", url: "https://www.google.com/" },
      { name: "YouTube", url: "https://www.youtube.com/" },
      { name: "Netflix", url: "https://www.netflix.com/" }
    ]
  },
  {
    label: "国内",
    via: "手机直连",
    opts: { policy: "direct" },
    sites: [
      { name: "百度", url: "https://www.baidu.com/" },
      { name: "哔哩哔哩", url: "https://www.bilibili.com/" },
      { name: "腾讯QQ", url: "https://www.qq.com/" }
    ]
  }
];

function fetchWithTimeout(req, ms) {
  return Promise.race([
    $task.fetch(req),
    new Promise(function (resolve, reject) {
      setTimeout(function () { reject("Timeout"); }, ms);
    })
  ]);
}

function loadSite(site, opts) {
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
    opts: { policy: $environment.params },
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

function groupAvg(results) {
  var sum = 0;
  var ok = 0;
  for (var i = 0; i < results.length; i++) {
    if (results[i].ms >= 0) {
      sum += results[i].ms;
      ok++;
    }
  }
  return { avg: ok > 0 ? Math.round(sum / ok) : -1, ok: ok, total: results.length };
}

;(async () => {
  var info = await getExitInfo();

  var groupResults = [];
  for (var g = 0; g < GROUPS.length; g++) {
    var rs = [];
    for (var i = 0; i < GROUPS[g].sites.length; i++) {
      rs.push(await loadSite(GROUPS[g].sites[i], GROUPS[g].opts));
    }
    groupResults.push(rs);
  }

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

  for (var a = 0; a < GROUPS.length; a++) {
    var st = groupAvg(groupResults[a]);
    var v = st.avg >= 0 ? ("<b>" + st.avg + " ms</b>（" + st.ok + "/" + st.total + "）") : "全部超时";
    lines.push("<b>" + GROUPS[a].label + "平均</b>（" + GROUPS[a].via + "） : " + v);
  }

  lines.push("------------------------------");

  for (var b = 0; b < GROUPS.length; b++) {
    for (var c = 0; c < groupResults[b].length; c++) {
      var s = groupResults[b][c];
      lines.push("<b>" + s.name + "</b> : " + (s.ms >= 0 ? (s.ms + " ms") : "超时"));
    }
  }

  lines.push("------------------------------");
  lines.push("<font color=#CD5C5C><b>节点</b> ➟ " + $environment.params + "</font>");
  lines.push("<font color=#949EA0>国外经节点 · 国内手机直连，均为实测</font>");

  var content = "<p style=\"text-align: center; font-family: -apple-system; font-size: large; font-weight: thin\">" + lines.join("</br>") + "</p>";

  $done({ "title": "📺 节点体感测试", "htmlMessage": content });
})();
