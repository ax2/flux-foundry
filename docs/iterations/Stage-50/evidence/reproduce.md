从仓库根目录运行。候选脚本生成实验文件至忽略目录 test-results，不替换生产模块。先以 Stage-49 源码重建基线：

```powershell
git show 49b6cfa:src/game.ts | Set-Content -Encoding utf8 test-results/stage50-baseline-source.txt
$base = (Get-Content -Raw test-results/stage50-baseline-source.txt).Replace("from './", "from '../src/")
$base | Set-Content -Encoding utf8 test-results/stage50-baseline.ts
node docs/iterations/Stage-50/evidence/stage50-dense.mjs
Copy-Item docs/iterations/Stage-50/evidence/stage50-selected-contact.ts test-results/stage50-selected-contact.ts
node_modules/.bin/tsx.cmd test-results/stage50-selected-contact.ts
```

Stage-51 轨迹使用 Stage-50 生产代码；同样先把脚本复制到 test-results 再用 tsx 运行。
