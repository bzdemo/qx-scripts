# qx-scripts

自用的 Quantumult X 脚本集。

## node-feel.js — 节点体感测试（现行）

在 QX 首页长按任意节点/策略组即可运行，面板显示：

- 出口 IP / ISP / ASN / 归属地（数据来源 api.ip.sb）
- 经当前节点打开 YouTube 官网的完整耗时（测 2 次取最优）与连通次数

思路：节点日常就是用来打开 YouTube 这类海外站点的，测它才贴近实际使用体感。

### 添加方法

把下面一行粘进 QX 配置的 `[task_local]` 段：

```
event-interaction https://raw.githubusercontent.com/bzdemo/qx-scripts/main/node-feel.js, tag=节点体感测试, img-url=play.rectangle.system, enabled=true
```

### 能测什么、不能测什么

- 能测：经所选节点打开真实海外站点的**全链路体感耗时**（去程+回程合并），以及出口 IP 信息。
- 不能测：线路判定（CN2 GIA / AS9929 / CMIN2 等）。QX 脚本沙箱只有 HTTP 请求能力，没有 traceroute/ICMP，任何 QX 脚本都做不了路由追踪；线路判定需在服务器侧完成。

## three-net-check.js — 三网全链路测试（已弃用）

早期版本，测经节点打开三家运营商官网的耗时。该方向（美国出口反向打开国内运营商站点）与日常使用无关，已弃用，文件仅作历史保留。

脚本均不含任何凭据与私有信息。
