# OBS-DeveloperUtil README

[![.github/workflows/main.yml](https://github.com/GoooIce/obs-developer-util/actions/workflows/main.yml/badge.svg)](https://github.com/GoooIce/obs-developer-util/actions/workflows/main.yml)

使用 VSCode 连接并控制 OBS 录像。

OBS 插件依赖：
[obs-websocket](https://github.com/obsproject/obs-websocket) 5.0+

VSC 插件依赖：
[johnpapa.vscode-peacock](https://marketplace.visualstudio.com/items?itemName=johnpapa.vscode-peacock)
[codetour](https://aka.ms/codetour)

插件安装：
插件市场搜索[OBS-DeveloperUtil](https://marketplace.visualstudio.com/items?itemName=GoooIce.obs-developer-util)

## Features

[B 站视频演示](https://www.bilibili.com/video/bv1eB4y167Uq)

## Extension Settings

This extension contributes the following settings:

- `OBS-DeveloperUtil.autoConnect`: enable/disable this extension auto connect OBS
- `OBS-DeveloperUtil.address`: set OBS Websocket address
- `OBS-DeveloperUtil.visualCues`: set OBS Record starter animal
- `OBS-DeveloperUtil.timeSpeed`: time lapse range
- `OBS-DeveloperUtil.stopRecordWithTour`: record feat with [codetour](https://aka.ms/codetour)

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

### 1.1.0

1. 增加 codetour 互动录制，录制完成后会在根目录下生成`tourVideoObject.json`文件
2. 增加配置项`stopRecordWithTour`完成教程后自动停止录制

```json
{
  "@context": "https://schema.org/",
  "@type": "VideoObject",
  "name": "codetour video",
  "hasPart": [
    { "@type": "Clip", "name": "前言", "offset": "0" },
    {
      "@type": "Clip",
      "name": "0: 介绍",
      "offset": "00:00:02.633",
      "duration": 2633
    },
    {
      "@type": "Clip",
      "name": "1: 安装",
      "offset": "00:00:04.999",
      "duration": 4999
    },
    {
      "@type": "Clip",
      "name": "2: 编码",
      "offset": "00:00:07.666",
      "duration": 7666
    },
    { "@type": "Clip", "name": "结束语", "offset": "-1" }
  ]
}
```

### 1.0.0

1. 增加 Zen 模式延迟摄影模式。`Ctrl+K Z` 进入 Zen 模式 `Escape Escape` 退出
2. getOBS 可用

```json
"extensionDependencies": ["GoooIce.obs-developer-util"]
```

```javascript
// yarn add rxjs
const getOBS = extensions.getExtension('GoooIce.obs-developer-util').exports.getOBS;
const obs = getOBS();
obs.fromEvent('SceneItemEnableStateChanged').subscribe((event) => {});
obs._api('StopRecord').subscribe();
```

## Pre-Release Notes

### 0.4.0

1. 为终端命令提供了自动暂停/继续录制功能

### 0.3.0

1. 自动切换终端场景与桌面场景
2. 添加了新的录制提示动画，可以通过配置项`OBS-DeveloperUtil.visualCues`选择
3. 重构了 obs 连接库，预计 0.5.0 推出插件扩展接口

### 0.1.15

Fix bugs

### 0.1.14

Initial release of record feature

---

### For more information

- [obs-developer-util github](https://github.com/GoooIce/obs-developer-util.git)
- [勉途](https://miantu.net/)

**Enjoy!**
