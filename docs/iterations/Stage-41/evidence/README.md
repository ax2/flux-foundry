# Stage-41 复现方法

固定步回放只选珠、瞄准和移动挡板。从项目根目录将回放 TypeScript 复制到 `test-results`，使用 `node --import tsx` 执行。`peak` 对应 Stage-40 基线，`after` 对应本阶段源码。差异对照脚本的基线来自 `git show 41938e5:src/game.ts`，复制到 `test-results/stage41-game-baseline.ts` 时把 `from './` 替换为 `from '../src/`。

角度粗筛和细筛应在 Stage-40 源码上执行。生产矩阵在本阶段源码上执行 `node docs/iterations/Stage-41/evidence/stage41-matrix.mjs production`。`stage41-production-comparison.json` 列出逐行变化。触控使用 Stage-31 脚本以及 `npm run test:play -- --level=19`，输入与固定步回放分别记录。
