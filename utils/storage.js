var DEFAULT_SUBTITLE_FONT_SIZE = 90

var DEFAULT_SETTINGS = {
  subtitleFontSize: DEFAULT_SUBTITLE_FONT_SIZE,
  subtitleBold: true,
  subtitleAutoFit: true,
  subtitleCenter: false,
  subtitleRotated180: false,
  ttsEnabled: true,
  subtitlePlayOnSend: false,
  quickInputCollapsed: false,
  themeMode: 0,
  navMode: 'bottom'
}

var KEYS = {
  SETTINGS: 'kigtts_settings',
  SUBTITLE_CONFIG: 'kigtts_subtitle_config',
  SOUNDBOARD_CONFIG: 'kigtts_soundboard_config',
  CARD_CONFIG: 'kigtts_card_config',
  SUBTITLE_HISTORY: 'kigtts_subtitle_history'
}

function init() {
  var settings = wx.getStorageSync(KEYS.SETTINGS)
  if (!settings) {
    wx.setStorageSync(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS))
  }
}

function initSync() { init() }

function getDefaultSettings() {
  var d = {}
  for (var k in DEFAULT_SETTINGS) d[k] = DEFAULT_SETTINGS[k]
  return d
}

function getSettings() {
  try {
    var raw = wx.getStorageSync(KEYS.SETTINGS)
    var d = {}
    for (var k in DEFAULT_SETTINGS) d[k] = DEFAULT_SETTINGS[k]
    if (!raw) return d
    var parsed = JSON.parse(raw)
    for (var kp in DEFAULT_SETTINGS) {
      if (Object.prototype.hasOwnProperty.call(parsed, kp)) d[kp] = parsed[kp]
    }
    return d
  } catch (e) { return getDefaultSettings() }
}

function updateSetting(key, value) {
  var settings = getSettings()
  settings[key] = value
  wx.setStorageSync(KEYS.SETTINGS, JSON.stringify(settings))
  return settings
}

function updateSettings(updates) {
  var settings = getSettings()
  for (var k in updates) settings[k] = updates[k]
  wx.setStorageSync(KEYS.SETTINGS, JSON.stringify(settings))
  return settings
}

function getSubtitleConfig() {
  try {
    var raw = wx.getStorageSync(KEYS.SUBTITLE_CONFIG)
    if (!raw) return getDefaultSubtitleConfig()
    return JSON.parse(raw)
  } catch (e) { return getDefaultSubtitleConfig() }
}

function makeQuickItems(baseId, texts) {
  var items = []
  for (var i = 0; i < texts.length; i++) {
    items.push({ id: baseId + i, text: texts[i] })
  }
  return items
}

function getDefaultSubtitleConfig() {
  return {
    groups: [{
      id: 1, title: '通用', icon: 'sentiment_satisfied',
      items: makeQuickItems(1000, [
        '你好呀~',
        '谢谢！太感谢了！',
        '不好意思，我不太方便说话',
        '稍等一下哈',
        '没事没事，不用客气',
        '对对对，就是这个意思',
        '哈哈哈哈哈哈',
        '好的好的',
        '没问题',
        '抱歉抱歉',
        '太可爱了！',
        '好棒！',
        '嗯嗯'
      ])
    }, {
      id: 2, title: '扩列', icon: 'group_add',
      items: makeQuickItems(2000, [
        '扩列吗？加个联系方式~',
        '你出的是XX吗？好还原！太好看了！',
        '刚刚是你出的XX吗？太好看了！',
        '求个关注，这是我的账号',
        '可以集个邮吗？',
        '这个迷你~小小心意',
        '交换一下无料吗？',
        '加个好友吧，我拉你进同好群',
        '你有出过XX吗？我超喜欢那个角色',
        '你这个道具做得好精致啊！',
        '我们之前是不是在哪个展子见过？'
      ])
    }, {
      id: 3, title: '拍照', icon: 'photo_camera',
      items: makeQuickItems(3000, [
        '可以合影嘛~',
        '麻烦等一下，我摆个姿势',
        '拍好了吗？',
        '可以再拍一张吗？',
        '手机给我，我帮你们拍',
        '可以帮我拍个全身吗？',
        '你站那边就好，我OK的',
        '等一下我整理一下衣服/头壳',
        '麻烦开个闪光灯可以吗？',
        '可以比个心吗？',
        '谢谢！拍得真好',
        '大家一起看镜头~',
        '麻烦让一下，挡住后面的人了'
      ])
    }, {
      id: 4, title: '后勤', icon: 'support_agent',
      items: makeQuickItems(4000, [
        '后勤！！！速来！！！',
        '我要中暑了！快带我去休息！',
        '快帮我摘头壳！喘不过气了！',
        '带我去厕所！快憋不住了！',
        '我渴了，帮我拿一下水',
        '头壳歪了没？帮我看一下',
        '太热了，帮我拿一下小风扇',
        '帮我整理一下后面的衣服/假发',
        '帮我把包拿过来一下',
        '帮我递张纸巾',
        '我走不动了，歇一下吧',
        '帮我看看假发乱了没',
        '帮我擦擦汗'
      ])
    }],
    selectedGroupId: 1
  }
}

function saveSubtitleConfig(config) {
  wx.setStorageSync(KEYS.SUBTITLE_CONFIG, JSON.stringify(config))
}

function getSoundboardConfig() {
  try {
    var raw = wx.getStorageSync(KEYS.SOUNDBOARD_CONFIG)
    if (!raw) return getDefaultSoundboardConfig()
    return JSON.parse(raw)
  } catch (e) { return getDefaultSoundboardConfig() }
}

function getDefaultSoundboardConfig() {
  return {
    groups: [{ id: 1, title: '常用音效', icon: 'music_note', items: [] }],
    selectedGroupId: 1, layoutMode: 'list'
  }
}

function saveSoundboardConfig(config) {
  wx.setStorageSync(KEYS.SOUNDBOARD_CONFIG, JSON.stringify(config))
}

function getCardConfig() {
  try {
    var raw = wx.getStorageSync(KEYS.CARD_CONFIG)
    if (!raw) return getDefaultCardConfig()
    return JSON.parse(raw)
  } catch (e) { return getDefaultCardConfig() }
}

function getDefaultCardConfig() {
  return {
    cards: [
      { id: 1, title: '角色名', note: '欢迎互关/合影', themeColor: '#038387', link: '', imagePath: '' },
      { id: 2, title: '示例名片', note: '长按编辑或点击查看', themeColor: '#ff6d00', link: '', imagePath: '' }
    ]
  }
}

function saveCardConfig(config) {
  wx.setStorageSync(KEYS.CARD_CONFIG, JSON.stringify(config))
}

function getSubtitleHistory() {
  try {
    var raw = wx.getStorageSync(KEYS.SUBTITLE_HISTORY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (e) { return [] }
}

function addSubtitleHistory(text) {
  var history = getSubtitleHistory()
  history.unshift({ text: text, time: Date.now() })
  if (history.length > 500) { history.length = 500 }
  wx.setStorageSync(KEYS.SUBTITLE_HISTORY, JSON.stringify(history))
  return history
}

function clearSubtitleHistory() {
  wx.setStorageSync(KEYS.SUBTITLE_HISTORY, JSON.stringify([]))
}

function deleteSubtitleHistory(text) {
  var history = getSubtitleHistory()
  var newHistory = []
  for (var i = 0; i < history.length; i++) { if (history[i].text !== text) newHistory.push(history[i]) }
  wx.setStorageSync(KEYS.SUBTITLE_HISTORY, JSON.stringify(newHistory))
}

module.exports = {
  init: init, initSync: initSync,
  getDefaultSettings: getDefaultSettings, getSettings: getSettings,
  updateSetting: updateSetting, updateSettings: updateSettings,
  getSubtitleConfig: getSubtitleConfig, saveSubtitleConfig: saveSubtitleConfig,
  getDefaultSubtitleConfig: getDefaultSubtitleConfig,
  getSoundboardConfig: getSoundboardConfig, saveSoundboardConfig: saveSoundboardConfig,
  getCardConfig: getCardConfig, saveCardConfig: saveCardConfig,
  getDefaultCardConfig: getDefaultCardConfig,
  getSubtitleHistory: getSubtitleHistory, addSubtitleHistory: addSubtitleHistory,
  clearSubtitleHistory: clearSubtitleHistory, deleteSubtitleHistory: deleteSubtitleHistory,
  KEYS: KEYS
}
