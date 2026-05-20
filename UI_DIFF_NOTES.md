# KIGTTS 小程序 vs Android 端 UI 差异笔记

> 对照文件: `d:\Downloads\demo\KIGTTS\android-app\...\MainActivity.kt`
> 日期: 2026-01-27

---

## 一、全局导航/框架

| 功能 | Android 端 | 小程序现状 | 差距 |
|---|---|---|---|
| 导航方式 | NavigationRail 侧边栏（expanded/compact 自适应） | Bottom TabBar（4 tab +1 画板） | **巨大** — 侧边栏 icon+文字 vs 底栏仅文字 |
| 横屏/竖屏适配 | 完整横竖屏双布局 | 仅竖屏 | 缺乏横屏布局 |
| TopBar 标题 | Crossfade 动画切换，每个子页面不同标题 | 固定 `navigationBarTitleText`，无动画 | 中等 — 子页面标题不同 |
| TopBar Actions | 每个页面独立 icon 按钮组，alpha 动画切换 | 无 TopBar 右侧按钮 | **大** — 缺编辑/导入/导出/新建等快捷入口 |
| 侧边抽屉 | NavigationDrawer + 汉堡菜单 | 无 | 不需要（小程序无此需求） |
| Edge-to-Edge | 完整 Edge-to-Edge 适配 | statusbar 由微信管理 | 可接受 |
| 动画 | AnimatedContent, Crossfade, tween 到处使用 | 无过渡动画 | 中等 — 页面切换生硬 |

---

## 二、便捷字幕 (QuickSubtitle)

| 功能 | Android 端 | 小程序现状 | 差距 |
|---|---|---|---|
| 标题栏 Actions | `edit` 编辑入口、`fullscreen` 全屏 | 无 | **大** — 缺顶栏入口 |
| 编辑入口 | 独立 `QuickSubtitleEditorScreen`（批量/非批量模式） | 独立 editor 子页面 | 可接受 |
| 导入/导出 | TopBar `folder_open`/`share` 按钮 | 在设置页里 | 中等 — 不方便 |
| 全屏模式 | `fullscreen`/`fullscreen_exit` 切换，隐藏状态栏 | `showPreview` 弹窗 | 可接受 |
| 按住说话 (PTT) | 大圆形 FAB，支持拖拽到上屏/取消/输入框 | **无** | **巨大** |
| 麦克风开关 | FAB 切换，active 有动画反馈 | **无** | **大** |
| 运行状态条 | 底部展开/收起的 Running Status Strip (播放进度 + `graphic_eq` 图标) | **无** | 中等 |
| 快捷文本弹窗 | `QuickSubtitleListDialog` — 网格/列表双模式切换 | 内联横向滚动 chip | 小差异 — 弹窗体验不同 |
| 紧凑控件模式 | 可切换 compact controls（更紧凑的快捷文本展示） | 无此开关 | 小 |
| 字幕旋转 180° | `swap_vert` 按钮 + `rotationZ=180` | `transform:rotate(180deg)` | 已实现 |
| 横屏右侧面板 | 220dp 弹出面板 + 垂直分组标签栏 | 无横屏布局 | **大** |
| 操作栏 Crossfade | `Crossfade(tween 180)` 切换按钮/滑块 | `wx:if` 直接切换 | 小 — 无动画 |
| 字体范围 | 28-96sp | 24-200rpx | rpx 更大是合理的 |
| 清屏 | `cleaning_services` 图标 | 同上 | ✅ |
| 状态条 | 可折叠/展开的状态信息条 | **无** | 不需要（小程序无语音） |

---

## 三、快捷名片 (QuickCard)

| 功能 | Android 端 | 小程序现状 | 差距 |
|---|---|---|---|
| 名片统一类型 | `QuickCardUnifiedContent` — 所有卡片统一布局 | 已统一 | ✅ |
| 卡片编辑字段 | 名称/姓名/职位/公司/电话/邮箱/类型/背景图/QR大小 | 主题色/标题/备注/链接/背景图 | **中等** — 字段少很多 |
| 主题色选择 | HSL 三滑条 + hex 输入 + 8 预设 | 仅 8 预设圆点 | **中等** — 缺自定义色 |
| QR 码大小 | 可调节的 QR Size Slider | 无 | 小 |
| 二维码显示 | 居中白色卡片 + 真 QR | Canvas 生成（刚修好） | 刚修复 |
| 新建入口 | TopBar `add` 按钮 | 底部按钮 | 可接受 |
| 扫描二维码 | TopBar `qr_code_scanner` | **无** | **大** |
| 名片排序 | 独立 Sort 模式 + 拖拽排序 | **无** | 中等 |
| 名片复制 | TopBar `content_copy` | 长按菜单里的复制 | 可接受 |
| 名片 Web 预览 | 内置 WebView + more_vert 菜单 | **无** | 不需要 |
| 背景图片预览 | `zoom_in` 图标预览 | 无预览 | 小 |
| 横屏布局 | landscape/portrait 双布局 | 仅竖屏 | **大** |

---

## 四、音效板 (Soundboard)

| 功能 | Android 端 | 小程序现状 | 差距 |
|---|---|---|---|
| 分组标签 | Icon + 名称 + 数量 + `RoundedCornerShape(16.dp)` + `primaryContainer` | Icon + 名称 + `border-radius:28rpx` | 小 — 圆角不同 |
| 分组排序/删除 | 标签行内 `arrow_upward`/`arrow_downward`/`close` 按钮 | 无 | 中等 |
| 分组图标可自定义 | 30 个预设图标可选 | 无图标自定义 | 小 |
| 布局切换 | 列表/网格双模式 + 切换按钮 | 有 list/grid | ✅ |
| 关键词唤醒开关 | `KeywordWakeToggle` 显式控件 | `btn-text-sm` 文字按钮 | 小 — 样式不同 |
| 编辑器 | `SoundboardEditorScreen` — 分组管理 + 音效添加/编辑 | 主界面内嵌 Sheet | **中等** — 缺少独立编辑器 + 批量管理 |
| 导入/导出 | TopBar `folder_open`/`share` | 设置页里 | 同字幕 |
| 文件选择 | `AudioPickerDialog` + `BuiltinAudioPicker` | `wx.chooseMessageFile` | 可接受 |
| 播放进度 | 进度指示器 | 无 | 小 |
| 播放状态 | audio focus 管理 + 播放动画 | 基本播放 | 可接受 |

---

## 五、画板 (Drawing)

| 功能 | Android 端 | 小程序现状 | 差距 |
|---|---|---|---|
| 工具栏 | `DrawingToolbar` + `DrawingToolbarMini` 双工具栏 | 底部单工具栏 | **中等** |
| 画笔 | Pen(`edit`) + Eraser(`ink_eraser`) | ✅ | ✅ |
| 撤销/重做 | Undo(`undo`) + Redo(`redo`) | 只有撤销 | **中等** — 缺重做 |
| 旋转画布 | TopBar `rotate_left`/`rotate_right`（90° 旋转） | 无 | **中等** |
| 颜色 | 调色板 + 可扩展的色板 | ActionSheet 9 色 | 小 |
| 笔触粗细 | Slider 滑动条 | ActionSheet 5 档 | 小 |
| 不透明度 | Opacity Slider | 无 | 小 |
| 平滑度 | Smoothness Slider | 无 | 小 |
| 缩放/平移 | 双指缩放 + 画布平移（`touch_app` 手形工具） | **无** | 不需要 |
| 保存 | TopBar `save` | 底部按钮 | 可接受 |
| TopBar Actions | `rotate_left`/`rotate_right`/`save` | 无 | **中等** |
| 画布背景色 | 可配置 | 固定 `#0a0a0f` | 小 |
| 空状态 | 无笔画时保存按钮禁用 | 未处理 | 小 |

---

## 六、设置页 (Settings)

| 功能 | Android 端 | 小程序现状 | 差距 |
|---|---|---|---|
| 分类标签 | 4 tab: 识别/音频/系统/关于 | 无分类 | **大** |
| 识别设置 | 引擎/语言/模型/VAD 等 | **无** | 不需要（无语音功能） |
| 音频设置 | TTS 引擎/声音/语速/音调/音量 | **无** | 不需要（无语音功能） |
| 系统设置 | 主题/语言/悬浮窗/热键/更新 | 仅数据导入导出 | **巨大** — 缺主题切换等 |
| 关于 | 版本/开源许可证/隐私政策/感谢 | **无** | 中等 |
| 控件类型 | DropdownMenu + SeekBar | 列表项 + switch | 小 — 对照组件不同 |
| 字幕设置 | 无独立字幕设置页 | 之前有，已移除 | ✅ |
| 日志入口 | TopBar `article` 按钮 | 列表项入口 | ✅ |

---

## 七、日志页面

| 功能 | Android 端 | 小程序现状 | 差距 |
|---|---|---|---|
| 文件选择 | DropdownMenu 切换日志文件 | 无 | 不需要（小程序无多文件日志） |
| 日志项显示 | 时间戳 + 级别(V/D/I/W/E) + 标签 + 内容 | 时间 + 类型 + 文本 | 可接受 |
| 日志级别颜色 | 不同颜色区分 | 2 种颜色 | 可接受 |
| 展开/折叠 | 点击展开全文 | 无 | 小 |
| TopBar Actions | `refresh`/`content_copy`/`share` | 底部按钮 | 可接受 |

---

## 八、设计令牌 (Design Tokens)

| 令牌 | Android 端 | 小程序现状 | 差距 |
|---|---|---|---|
| 主色 | `#038387` | `#038387` | ✅ |
| 圆角 | `UiTokens.Radius = 12.dp` → 24rpx | `var(--md1-radius)` = 2px → 4rpx | **大** — Android 用 12dp ≈ 24rpx |
| 卡片阴影 | `UiTokens.CardElevation = 2.dp` | `box-shadow: 0 1px 3px...` | 可接受 |
| TopBar 阴影 | `UiTokens.TopBarElevation = 2.dp` | 微信默认 | 可接受 |
| 页面底部留白 | `PageBottomBlank = 96.dp` | 无专门处理 | 小 |
| 字体令牌 | Material3 Typography 体系 | `var(--md1-*)` 自定义 | 可接受 |
| 分组 Chip 圆角 | `RoundedCornerShape(16.dp)` | `border-radius:28rpx` | 小差异 |
| Card 容器 | `Md2SettingsCard` 统一风格 | `var(--md1-surface)` + `border-radius:2px` | **大** — Android 有统一卡片组件 |

---

## 九、优先级排序（按用户感知强弱）

### 🔴 P0 — 严重影响体验
1. **横竖屏适配缺失** — 名片/字幕均无横屏
2. **PTT 语音输入缺失** — 字幕页无麦克风按钮
3. **设置页功能缺失** — 缺主题切换、多语言等
4. **圆角差异** — Android 12dp vs 小程序 2px（看起来完全不同）

### 🟠 P1 — 明显差距
5. **TopBar Actions 缺失** — 编辑/导入/导出/新建等快捷按钮
6. **名片编辑字段少** — 缺姓名/职位/电话/邮箱等
7. **名片扫描二维码缺失**
8. **画板缺少重做 Redo**
9. **分组排序/删除功能缺失**

### 🟡 P2 — 细节差异
10. **动画缺失** — Crossfade/tween 切换
11. **音效板编辑器不足** — 缺批量管理
12. **卡片自定义色缺失** — 只有 8 预设
13. **分组 Chip 样式细微差异**
14. **日志无展开/折叠**

### 🟢 P3 — 不影响功能
15. **画板旋转**
16. **QR 大小调节**
17. **卡片 Web 预览**
18. **运行状态条**
