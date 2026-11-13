# Stage-38 证据复现

从项目根目录运行。TypeScript 回放先复制到 test-results，再用 node --import tsx 执行。以 Stage-37 源码执行 stage38-screen.mjs 生成隔离候选。stage38-matrix.mjs second32 或 production 分别复跑隔离或正式的 456 局，基线是 Stage-37 的生产矩阵。

触控复用 Stage-31 的 Chrome 脚本，参数 2217 brass standard follow、2217 steel large follow，观察 15 发和 4 发。挑战使用 npm run test:play -- --level=19。
