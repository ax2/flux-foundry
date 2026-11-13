# Stage-35 证据复现

从项目根目录运行。TypeScript 回放先复制到 test-results，再用 node --import tsx 执行。角度扫描和候选筛选以 Stage-34 源码运行。stage35-matrix.mjs production 从正式代码生成 19 个种子分片，输出 456 局矩阵并与 Stage-34 比对。

触控复用 Stage-31 的 Chrome 脚本，黄铜设 PLAY_SHOTS=15，参数 42 brass standard steer。钢珠设 PLAY_SHOTS=4，参数 7429 steel large steer。挑战用 npm run test:play -- --level=19。Windows 验证使用 scripts/desktop-smoke.mjs 和 scripts/upgrade-release-smoke.mjs。
