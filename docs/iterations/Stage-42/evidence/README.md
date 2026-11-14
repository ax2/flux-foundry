# Stage-42 证据复现

在项目根目录执行。把回放 TypeScript 复制到 `test-results`，用 `node --import tsx` 运行。`stage42-7429-peak.ts` 及角度筛选使用 Stage-41 源码。运行 `node docs/iterations/Stage-42/evidence/stage42-screen.mjs` 后，执行 `node --import tsx test-results/stage42-screen.ts 0 1` 可得到 50 条角度筛选记录。

`node docs/iterations/Stage-42/evidence/stage42-matrix.mjs m1a10` 对比隔离候选，传入 `production` 对比工作树源码。真实接触记录来自候选与 Stage-41 的逐步对比，使用 `stage42-live-contact.ts`。

触控用 Stage-31 脚本运行 `7429 ceramic large follow` 五发、`934 ceramic large follow` 四发，并用 `npm run test:play -- --level=19` 完成挑战。浏览器回放时序与固定步回放分别记录。
