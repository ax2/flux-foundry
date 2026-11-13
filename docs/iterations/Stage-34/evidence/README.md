# Stage-34 证据复现

从项目根目录，以 Stage-33 源码运行。先将本目录中的脚本及 stage34-combined-seeds.json 复制至 test-results。运行 stage34-variants.mjs、stage34-small-variants.mjs 生成两组隔离候选。分别运行 stage34-sweep.mjs 和 stage34-small-sweep.mjs 初筛。运行 stage34-combined-setup.mjs 生成分种子的合并对照脚本，再运行 stage34-combined.mjs。单独的 stage34-matrix-second11.ts 可用 node --import tsx 复跑大号钢珠候选全矩阵。

以本阶段正式源码复验时，运行 stage34-production.mjs 自动生成并复跑 19 个种子分片。阶段 35 的黄铜峰值用 stage35-brass-peak.ts 复现。
