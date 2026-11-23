# qx-scripts

自用的 Quantumult X 脚本集。

## node-feel-v4.js — 节点体感测试（现行）

依次逐个打开各站：并行打开会互相抢代理链路的带宽与并发，数字比真实体感虚高。v3 起分国外/国内两组对比；v4 起国内组改为手机直连实测，不再经节点。

在 QX 首页长按任意节点/策略组即可运行，面板显示：

- 出口 IP / ISP / ASN / 归属地（数据来源 api.ip.sb）
- 国外三家（Google / YouTube / Netflix）经所选节点打开，国内三家（百度 / 哔哩哔哩 / 腾讯QQ）走手机直连，显示两组各自的平均打开耗时与各站明细

思路：这正是日常使用的真实分工——国外走节点、国内走直连，两组平均一对比，节点体感和直连体感都看得见。

### 添加方法

把下面一行粘进 QX 配置的 `[task_local]` 段：

```
event-interaction https://raw.githubusercontent.com/bzdemo/qx-scripts/main/node-feel-v4.js, tag=节点体感测试, img-url=play.rectangle.system, enabled=true
```

### 能测什么、不能测什么

- 能测：经所选节点打开真实海外站点的**全链路体感耗时**（去程+回程合并），以及出口 IP 信息。
- 不能测：线路判定（CN2 GIA / AS9929 / CMIN2 等）。QX 脚本沙箱只有 HTTP 请求能力，没有 traceroute/ICMP，任何 QX 脚本都做不了路由追踪；线路判定需在服务器侧完成。

## three-net-check.js — 三网全链路测试（已弃用）

早期版本，测经节点打开三家运营商官网的耗时。该方向（美国出口反向打开国内运营商站点）与日常使用无关，已弃用，文件仅作历史保留。

脚本均不含任何凭据与私有信息。
