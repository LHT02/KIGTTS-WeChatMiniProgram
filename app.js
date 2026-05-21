var storage = require('./utils/storage')
var theme = require('./utils/theme')

App({
  onLaunch: function() {
    try {
      storage.initSync()
      this.globalData.settings = storage.getSettings()
      this.globalData.systemTheme = ''
      this.globalData.themeClass = theme.themeClass(this.globalData.settings)
      this.applyShellTheme(this.globalData.settings)
      this.bindSystemThemeChange()
    } catch (e) {
      console.error('初始化失败', e)
    }
  },

  onShow: function() {
    try {
      this.globalData.settings = storage.getSettings()
      this.globalData.systemTheme = ''
      this.globalData.themeClass = theme.themeClass(this.globalData.settings)
      this.applyShellTheme(this.globalData.settings)
    } catch (e) {}
  },

  globalData: {
    settings: null,
    themeClass: '',
    systemTheme: '',
    subtitleHistory: [],
    currentSubtitle: ''
  },

  getSettings: function() {
    return this.globalData.settings || storage.getDefaultSettings()
  },

  updateSettings: function(key, value) {
    storage.updateSetting(key, value)
    this.globalData.settings = storage.getSettings()
    this.globalData.systemTheme = ''
    this.globalData.themeClass = theme.themeClass(this.globalData.settings)
    this.applyShellTheme(this.globalData.settings)
  },

  bindSystemThemeChange: function() {
    if (this._systemThemeBound || typeof wx === 'undefined' || !wx.onThemeChange) return
    this._systemThemeBound = true
    var app = this
    wx.onThemeChange(function(res) {
      app.globalData.systemTheme = res && res.theme ? res.theme : ''
      var settings = storage.getSettings()
      app.globalData.settings = settings
      app.globalData.themeClass = theme.themeClass(settings, app.globalData.systemTheme)
      app.applyShellTheme(settings, app.globalData.systemTheme)
      app.refreshCurrentTheme()
    })
  },

  refreshCurrentTheme: function() {
    try {
      var pages = getCurrentPages()
      var page = pages && pages[pages.length - 1]
      if (page && typeof page.refreshThemeFromSystem === 'function') page.refreshThemeFromSystem()
    } catch (e) {}
  },

  applyShellTheme: function(settings, systemTheme) {
    var light = theme.isLight(settings || storage.getDefaultSettings(), systemTheme)
    var bg = light ? '#F1F3F5' : '#131416'
    var bar = light ? '#FFFFFF' : '#34383b'
    try {
      wx.setNavigationBarColor({ frontColor: light ? '#000000' : '#ffffff', backgroundColor: bar })
    } catch (e) {}
    try {
      wx.setBackgroundColor({ backgroundColor: bg, backgroundColorTop: bg, backgroundColorBottom: bg })
    } catch (e) {}
  }
})
