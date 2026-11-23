# qx-scripts

自用的 Quantumult X 脚本集。

## three-net-check.js — 三网全链路测试

在 QX 首页长按任意节点/策略组即可运行，面板显示：

- 出口 IP / ISP / ASN / 归属地（数据来源 api.ip.sb）
- 电信 / 联通 / 移动三家官网的全链路延迟（每家测 3 次取最优）与连通次数

### 添加方法

把下面一行粘进 QX 配置的 `[task_local]` 段：

```
event-interaction https://raw.githubusercontent.com/bzdemo/qx-scripts/main/three-net-check.js, tag=三网全链路测试, img-url=antenna.radiowaves.left.and.right.system, enabled=true
```

### 能测什么、不能测什么

- 能测：经所选节点出去的**全链路 HTTP 延迟**（去程+回程合并），以及出口 IP 信息。
- 不能测：线路判定（CN2 GIA / AS9929 / CMIN2 等）。QX 脚本沙箱只有 HTTP 请求能力，没有 traceroute/ICMP，任何 QX 脚本都做不了路由追踪；线路判定需在服务器侧完成。

脚本不含任何凭据与私有信息，测速点为三家运营商公开官网（189.cn / 10010.com / 10086.cn）。
