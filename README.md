# KIGTTS 微信小程序（纯字幕版）

基于 [KIGTTS](https://github.com/LHT02/KIGTTS) Android 端重构的纯文本交流版微信小程序。

**不含任何语音合成/识别功能** — 专注于大字幕显示和快捷文本。

## 功能

| 模块 | 说明 |
|------|------|
| **便捷字幕** | 大字幕显示、字体缩放、快捷文本分组、历史记录、输入发送 |
| **快捷名片** | 文字/图片/本地 Canvas 二维码、翻页浏览、编辑管理 |
| **音效板** | 音效分组管理、列表/网格布局、音频播放 |
| **画板** | Canvas 2D 手写涂鸦、画笔/橡皮/撤销/保存 |
| **设置** | 单页字幕样式、主题、预设导入导出 |

## 不含

- ❌ 语音合成 (TTS)
- ❌ 语音识别 (ASR)
- ❌ WechatSI 插件
- ❌ 扫码入口和二维码插件/远程二维码 API
- ❌ 录音权限
- ❌ 任何后端依赖

## 项目结构

```
KIGTTS-miniprogram-silent/
├── app.js / app.json / app.wxss
├── utils/
│   ├── storage.js    # 本地存储
│   ├── audio.js      # 音频播放
│   ├── nav.js        # 字体图标抽屉导航
│   ├── qrcode.js     # 本地二维码 Canvas 渲染
│   └── preset.js     # 预设导入导出
├── templates/
│   └── shell.*       # 安卓端风格侧边抽屉
└── pages/
    ├── subtitle/     # 便捷字幕
    ├── card/         # 快捷名片
    ├── soundboard/   # 音效板
    └── settings/     # 设置 + 画板 + 日志
```
