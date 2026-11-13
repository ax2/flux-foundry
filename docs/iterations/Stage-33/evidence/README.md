# Stage-33 证据复现

从项目根目录运行。TypeScript 脚本复制到 test-results 后，使用 node --import tsx 执行。隔离候选用 v0.25.0 的 src/game.ts 生成，生产复跑用本阶段正式代码。独立种子基线脚本需要把 v0.25.0 的 src/game.ts 写入 test-results/stage33-baseline-game.ts，并将 import 中的 ./ 改为 ../src/。

触控使用 Stage-31 的 Chrome 事件脚本。钢珠设 PLAY_SHOTS=15，参数 7429 steel standard steer。黄铜和橡胶设 PLAY_SHOTS=4，分别使用 7429 brass standard steer 和 9011 rubber large steer。第 19 关用 npm run test:play -- --level=19。
