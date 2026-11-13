# Stage-40 证据复现

从项目根目录运行。以 Stage-39 源码执行 stage40-screen.mjs 和 stage40-refine.mjs 生成候选。依次用 stage40-shape-setup.mjs 和 stage40-narrow-setup.mjs 生成按形状、收窄和保留菱形分支的候选。stage40-matrix.mjs 接受 second279-shape-preserved 或 production。基线是 Stage-39 生产矩阵。TypeScript 回放先复制到 test-results，再用 node --import tsx 执行。

触控使用 Stage-31 脚本，42 brass standard follow 观察 15 发，87 brass standard follow 观察四发，第 19 关用 npm run test:play -- --level=19。
