# 素材来源与生成记录

2026-11-06，使用内置 Image Gen；未使用 API 密钥、付费第三方素材或原作素材提取。

## concept.png
主提示：complete primary playable portrait screen for FLUX FOUNDRY; realistic machined black steel, fine screws, amber launch core, cyan glass capacitors; V-shaped top hopper, numbered square and triangular targets in lower half, top score/wave HUD, bottom MAGNET/RECALL controls; no phone frame, no social overlay, no fruit or character. Code-native scoring and controls.

## public/assets/targets.png
主提示：transparent production sprite atlas, four isolated objects in one horizontal row: square bevelled gunmetal target with screws; upright copper triangle; cyan glass circular capacitor; polished chrome sphere. Orthographic overhead, dark blank centers for code-rendered numbers, no text/digits/logos.

## public/assets/arena.png
主提示：portrait 9:16 realistic dark graphite brushed metal playfield; narrow steel rails and screws; shallow V-shaped hopper of chrome balls only in top 15%, central amber nozzle; below y18% entirely empty plate; no targets, no UI, no text. Code-native collision arena and HUD overlay.

Canvas uses source rectangles to sample the transparent atlas; original PNG retained. No generated screenshot is used as a fake interactive UI.

## 单球背景修订
2026-11-06 使用内置 Image Gen 编辑 arena.png：保持机加工材质、视角、导轨和喷口，仅移除漏斗中全部静态钢珠，留空金属内腔。用户要求单颗活动弹珠，活动球仍由透明图集实时渲染。
