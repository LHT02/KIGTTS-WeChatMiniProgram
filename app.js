var storage = require('./utils/storage')

App({
  onLaunch: function() {
    try {
      storage.initSync()
      this.globalData.settings = storage.getSettings()
      this.globalData.themeClass = (this.globalData.settings.themeMode || 0) === 1 ? 'theme-light' : ''
      this.applyShellTheme(this.globalData.settings)
    } catch (e) {
      console.error('初始化失败', e)
    }
  },

  onShow: function() {
    try {
      this.globalData.settings = storage.getSettings()
      this.globalData.themeClass = (this.globalData.settings.themeMode || 0) === 1 ? 'theme-light' : ''
      this.applyShellTheme(this.globalData.settings)
    } catch (e) {}
  },

  globalData: {
    settings: null,
    themeClass: '',
    subtitleHistory: [],
    currentSubtitle: ''
  },

  getSettings: function() {
    return this.globalData.settings || storage.getDefaultSettings()
  },

  updateSettings: function(key, value) {
    storage.updateSetting(key, value)
    this.globalData.settings = storage.getSettings()
    this.globalData.themeClass = (this.globalData.settings.themeMode || 0) === 1 ? 'theme-light' : ''
    this.applyShellTheme(this.globalData.settings)
  },

  applyShellTheme: function(settings) {
    var light = ((settings || storage.getDefaultSettings()).themeMode || 0) === 1
    var bg = light ? '#F1F3F5' : '#121416'
    var bar = light ? '#FFFFFF' : '#1D2023'
    try {
      wx.setNavigationBarColor({ frontColor: light ? '#000000' : '#ffffff', backgroundColor: bar })
    } catch (e) {}
    try {
      wx.setBackgroundColor({ backgroundColor: bg, backgroundColorTop: bg, backgroundColorBottom: bg })
    } catch (e) {}
  }
})
