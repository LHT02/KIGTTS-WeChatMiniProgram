var DEFAULT_SETTINGS = {
  subtitleFontSize: 72,
  subtitleBold: true,
  subtitleAutoFit: true,
  subtitleCenter: true,
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

function getDefaultSubtitleConfig() {
  return {
    groups: [{
      id: 1, title: '常用语', icon: 'sentiment_satisfied',
      items: [
        { id: 1, text: '可以合影吗？' }, { id: 2, text: '稍等一下，我马上回复你' },
        { id: 3, text: '谢谢你，辛苦了' }, { id: 4, text: '你好，很高兴见到你' },
        { id: 5, text: '再见，下次再聊' }, { id: 6, text: '这个角色好可爱' }
      ]
    }, {
      id: 2, title: '漫展', icon: 'celebration',
      items: [
        { id: 101, text: '请问这个摊位在哪里？' }, { id: 102, text: '可以交换联系方式吗？' },
        { id: 103, text: '这个角色的coser是谁？' }, { id: 104, text: '现场太吵了，我用字幕交流' }
      ]
    }, {
      id: 3, title: '游戏', icon: 'sports_esports', items: []
    }, {
      id: 4, title: '自定义', icon: 'edit', items: []
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
