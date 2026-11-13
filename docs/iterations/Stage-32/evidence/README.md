# Stage-32 证据复现

从项目根目录运行。回放脚本先复制到 test-results，再用 node --import tsx 执行。基线轨迹、接球预报和密集角度扫使用 411f06a 的生产代码。最终轨迹及 360 局使用本阶段生产代码。比较脚本读取相同的 360 局 Stage-31 基线。

触控复用 Stage-31 的实际 Chrome 触控脚本。设 PLAY_SHOTS=15 运行中号黄铜的完整远征，参数为 7429 brass standard steer。短轮设 PLAY_SHOTS=4，使用 7429 steel standard steer 和 42 ceramic large steer。三轮均在原始 PNG 解码后开始。第 19 关用 npm run test:play -- --level=19。
