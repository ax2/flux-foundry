# Stage-36 复现

在项目根目录运行。以 v0.26.0 代码执行 stage36-screen.mjs 生成隔离候选，再运行 stage36-gap-setup.mjs。TypeScript 脚本先复制到 test-results，用 node --import tsx 运行。stage36-first-divergence.ts 使用初版隔离候选。stage36-matrix.mjs production 使用当前阶段正式代码复跑 456 局。

触控复用 Stage-31 的脚本，参数为 9011 brass standard follow、815 brass standard steer、815 steel large steer，观察发数分别为 15、5、5。桌面截图脚本是 stage36-desktop-picture.mjs。
