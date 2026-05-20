var storage = require('../../utils/storage')
var preset = require('../../utils/preset')
var nav = require('../../utils/nav')
var theme = require('../../utils/theme')
var logoData = require('../../utils/logo-data')
var initialSettings = storage.getSettings()
var initialThemeClass = theme.themeClass(initialSettings)

Page({
  data: {
    settings: initialSettings, showImportEditor: false, importData: '', themeClass: initialThemeClass,
    navMode: theme.navMode(initialSettings), statusBarH: 44,
    drawerOpen: false, currentPath: 'pages/settings/index', navItems: nav.items,
    logoGlyph: nav.logoGlyph,
    logoSrc: logoData.getLogoSrc(initialThemeClass)
  },
  onLoad: function() { this.loadSettings() },
  onShow: function() {
    this.loadSettings()
    var app = getApp()
    var settings = storage.getSettings()
    var themeMode = settings.themeMode || 0
    var sys = wx.getSystemInfoSync()
    this.setData({
      themeClass: themeMode === 1 ? 'theme-light' : '',
      statusBarH: sys.statusBarHeight || 44,
      navMode: settings.navMode || 'bottom',
      drawerOpen: (settings.navMode || 'bottom') === 'drawer' ? this.data.drawerOpen : false,
      logoSrc: logoData.getLogoSrc(themeMode === 1 ? 'theme-light' : '')
    })
    nav.syncTabBar(this)
  },

  loadSettings: function() {
    var settings = storage.getSettings()
    var themeMode = settings.themeMode || 0
    var navMode = settings.navMode || 'bottom'
    var themeClass = themeMode === 1 ? 'theme-light' : ''
    this.setData({
      settings: settings,
      themeClass: themeClass,
      navMode: navMode,
      drawerOpen: navMode === 'drawer' ? this.data.drawerOpen : false,
      logoSrc: logoData.getLogoSrc(themeClass)
    })
    nav.syncTabBar(this)
  },

  onExportAll: function() {
    var data = preset.exportAllPresets()
    wx.setClipboardData({
      data: JSON.stringify(data, null, 2),
      success: function() { wx.showToast({ title: '预设已复制到剪贴板', icon: 'success' }) }
    })
  },

  onShowImportEditor: function() { this.setData({ showImportEditor: true, importData: '' }) },
  onCloseImportEditor: function() { this.setData({ showImportEditor: false }) },
  onImportDataInput: function(e) { this.setData({ importData: e.detail.value }) },

  onDoImport: function() {
    var that = this
    var text = (this.data.importData || '').trim()
    if (!text) { wx.showToast({ title: '请粘贴预设数据', icon: 'none' }); return }
    try {
      var data = JSON.parse(text)
      if (data.subtitle) preset.importSubtitlePreset(data.subtitle)
      if (data.soundboard) preset.importSoundboardPreset(data.soundboard)
      if (!data.subtitle && !data.soundboard) {
        if (data.type === 'kigtpk') preset.importSubtitlePreset(data)
        else if (data.type === 'kigspk') preset.importSoundboardPreset(data)
        else { wx.showToast({ title: '无法识别的格式', icon: 'none' }); return }
      }
      that.loadSettings()
      that.setData({ showImportEditor: false })
      wx.showToast({ title: '预设导入成功', icon: 'success' })
    } catch (e) {
      wx.showToast({ title: 'JSON 格式错误', icon: 'none' })
    }
  },

  onClearAll: function() {
    var that = this
    wx.showModal({
      title: '确认清除', content: '确定要清除所有数据吗？此操作不可撤销，将恢复出厂设置。',
      confirmText: '确认清除', confirmColor: '#cf6679',
      success: function(r) {
        if (r.confirm) {
          wx.clearStorageSync()
          getApp().globalData.settings = storage.getSettings()
          getApp().globalData.themeClass = ''
          if (getApp().applyShellTheme) getApp().applyShellTheme(getApp().globalData.settings)
          that.loadSettings()
          wx.showToast({ title: '所有数据已清除', icon: 'success' })
        }
      }
    })
  },

  onToggleTheme: function() {
    var v = this.data.settings.themeMode === 1 ? 0 : 1
    storage.updateSetting('themeMode', v)
    getApp().globalData.settings = storage.getSettings()
    getApp().globalData.themeClass = v === 1 ? 'theme-light' : ''
    if (getApp().applyShellTheme) getApp().applyShellTheme(getApp().globalData.settings)
    this.loadSettings()
    var isLight = v === 1
    this.setData({ themeClass: isLight ? 'theme-light' : '' })
    nav.syncTabBar(this)
    wx.showToast({ title: isLight ? '已切换为浅色模式' : '已切换为深色模式', icon: 'none' })
  },

  onToggleNavMode: function() {
    var next = this.data.navMode === 'drawer' ? 'bottom' : 'drawer'
    this.setData({ drawerOpen: false, navMode: next })
    storage.updateSetting('navMode', next)
    getApp().globalData.settings = storage.getSettings()
    getApp().globalData.themeClass = (getApp().globalData.settings.themeMode || 0) === 1 ? 'theme-light' : ''
    if (getApp().applyShellTheme) getApp().applyShellTheme(getApp().globalData.settings)
    this.loadSettings()
    nav.syncTabBar(this)
    wx.showToast({ title: next === 'drawer' ? '已切换为抽屉菜单' : '已切换为底栏导航', icon: 'none' })
  },

  onToggleBold: function(e) { this._toggleSetting('subtitleBold', e) },
  onToggleCenter: function(e) { this._toggleSetting('subtitleCenter', e) },
  onToggleRotated: function(e) { this._toggleSetting('subtitleRotated180', e) },
  onToggleTtsEnabled: function(e) { this._toggleSetting('ttsEnabled', e) },
  onTogglePlayOnSend: function(e) { this._toggleSetting('subtitlePlayOnSend', e) },

  onSwitchTap: function(e) {
    var key = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.key : ''
    if (!key) return
    this._toggleSetting(key)
  },

  _toggleSetting: function(key, e) {
    var v = e && e.detail && typeof e.detail.value === 'boolean' ? e.detail.value : !this.data.settings[key]
    storage.updateSetting(key, v)
    getApp().globalData.settings = storage.getSettings()
    getApp().globalData.themeClass = (getApp().globalData.settings.themeMode || 0) === 1 ? 'theme-light' : ''
    this.loadSettings()
  },

  onOpenLicense: function() {
    wx.showToast({ title: '详见 GitHub 仓库 LICENSE 文件', icon: 'none' })
  },

  onOpenPrivacy: function() {
    wx.showToast({ title: '本小程序不收集用户个人信息', icon: 'none' })
  },

  onOpenDrawer: function() { this.setData({ drawerOpen: true }) },
  onCloseDrawer: function() { this.setData({ drawerOpen: false }) },
  onDrawerNavTap: function(e) { nav.go(e.currentTarget.dataset.path, this.data.currentPath) },
  noop: function() {}
})
