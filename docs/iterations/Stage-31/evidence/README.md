# Stage-31 证据复现

从项目根目录运行。TypeScript 回放脚本先复制到 test-results，保留文件名，再使用 node --import tsx 执行。stage31-first-divergence.ts 需要同时将提交 7f02944 的 src/game.ts 写入 test-results/stage31-old-game.ts，将相对 import 路径从 ./ 改为 ../src/。stage31-compare-outward.mjs 在根目录读取最终 360 局输出和 Stage-30 既有基线。stage31-screen.mjs 在根目录执行会生成独立候选的回放脚本。
