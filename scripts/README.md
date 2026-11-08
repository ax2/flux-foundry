# 当前验证入口

- npm test：单元物理与52套自然回放；tests/collect.ts只用于单元布置，不能进入正式关卡路线。
- npm run build、npm run test:browser：生产构建与三视口界面回归。
- npm run test:endurance：936组首球长程，不移动挡板强制漏球；结果在test-results/endurance.json。
- npm run test:play：自启动4187预览，五关真实触控事件+算法挡板，记录完整输赢；--level=14可单独诊断。每次输出独立test-results/paddle-play/时间戳目录，含进度轨迹及观察超限现场。观察上限不是游戏寿命，算法胜率不是玩家胜率。
- npx tsx scripts/solve-levels.ts [--mirror]：自然回收搜索，生成正式fixtures；未结束候选直接丢弃。
- npx tsx scripts/balance-levels.ts：当前布局前20秒对照，未结束样本保持未结束；仅输出test-results/，不覆盖历史Stage-03证据。
- node scripts/desktop-smoke.mjs [--portable]：Windows完整目录或便携EXE，独立测试资料目录。
- node scripts/public-smoke.mjs：公开站点版本与基本操作检查。

upgrade-proof.ts、sustain-balance.ts、rescue-play.mjs、play-sessions.mjs、mobile-sessions.mjs、expedition-sessions.ts、endurance.ts为历史阶段研究脚本，使用旧技能/增强API或旧界面。它们不属于当前回归入口；复现历史应从对应Stage文档记录的版本检出运行，不能拿旧数据认证当前玩法，也不要直接运行覆盖历史文档。

Stage-10新增：
- npm run test:loading：自动4189服务，图片延迟/失败/重试与1Mbps真实流式进度；可用BASELINE_URL指定独立旧版预览作加载对照。
- npm run test:active：1872组主动跟球/定向挡板首球，任何连续60模拟秒无命中都会失败并保存参数。
- npm run test:full：120个完整引擎对局，含多发与稀疏末块；不把单球结果当整局。
- npm run test:play -- --stress：第4/5/22关难例的触控UI；每约1秒记录墙钟、模拟、无命中、后台/暂停/帧信息，超限保留分类现场。
- Stage-11已按用户要求撤销压缩：当前使用原始PNG及原始分辨率，压缩脚本已移除。Stage-10的压缩记录仅为历史，不是当前规则。

- npm run test:expedition：72局完整远征，保留300秒检查点后继续至900模拟秒观察；有效长回合与60秒无命中分开统计，不强制结束任何球。

- `npm run test:varied`：Stage-12新种子、镜像、150/300ms输入与斜向首发2496例，保存连续无命中峰值和首次60秒状态，只能自然落底；算法结果不代替真人试玩。

- 触控观察每300秒保存状态；只有持续推进、可见且仿真时钟正常的长回合才继续观察，最多900秒。暂停/掉帧/无进展分别报告，任何观察上限都不会触发游戏收球。

- `test:sparse`：5个完整官方关卡×12材质尺寸×镜像×100/133/200ms操控，360局自然打到剩1–2块并逐步记录，不注入残局；连续稀疏无命中达到20秒即失败。`test:play -- --sparse`复玩7/13/22关，保留真实输入记录和完整残局位置。
