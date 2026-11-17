# 复验入口

在仓库根目录运行。`stage51-contact.ts` 和各阶段球路脚本先复制到 `test-results/`，让相对导入指向仓库源码。接触对照将旧版类放到同目录：

```powershell
$base = (git show 03b863f:src/game.ts) -join "`n"
$base.Replace("from './","from '../src/") | Set-Content -Encoding utf8 test-results/stage51-base.ts
Copy-Item docs/iterations/Stage-51/evidence/stage51-contact.ts test-results/stage51-contact.ts
node --import tsx test-results/stage51-contact.ts
node docs/iterations/Stage-51/evidence/stage51-matrix.mjs production
```

粗筛和细筛脚本读取当前 `src/game.ts`，重做筛选时在 Stage-50 基线提交的独立目录运行，生成结果只进入 `test-results/`。移动端触控沿用 Stage-49 的 `stage49-pointer-tape.mjs`，输入和回合峰值保存在 `../touch/`。
