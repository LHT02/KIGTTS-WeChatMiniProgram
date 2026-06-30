var storage = require('../../utils/storage')
var preset = require('../../utils/preset')
var nav = require('../../utils/nav')
var theme = require('../../utils/theme')
var logoData = require('../../utils/logo-data')
var ripple = require('../../utils/ripple')
var routeAnim = require('../../utils/route-anim')
var system = require('../../utils/system')
var share = require('../../utils/share')
var initialSettings = storage.getSettings()
var initialThemeClass = theme.themeClass(initialSettings)
var THEME_OPTIONS = [
  { value: 0, label: '跟随系统', support: '使用微信当前明暗模式', icon: 'brightness_auto' },
  { value: 1, label: '浅色', support: '始终使用浅色界面', icon: 'light_mode' },
  { value: 2, label: '深色', support: '始终使用深色界面', icon: 'dark_mode' }
]

Page(share.attach(ripple.attach({
  data: {
    settings: initialSettings, showImportEditor: false, showThemeSheet: false, importData: '', themeClass: initialThemeClass,
    screenClass: system.screenClass(),
    navMode: theme.navMode(initialSettings), statusBarH: 44,
    routeEnterClass: '',
    drawerOpen: false, currentPath: 'pages/settings/index', navItems: nav.items,
    logoGlyph: nav.logoGlyph,
    switchAnimKey: '',
    themeOptions: THEME_OPTIONS,
    themeModeLabel: theme.themeModeLabel(initialSettings),
    logoSrc: logoData.getLogoSrc(initialThemeClass)
  },
  onLoad: function() { this.loadSettings() },
  onShow: function() {
    this.loadSettings()
    var settings = storage.getSettings()
    var themeClass = theme.themeClass(settings)
    this.setData({
      themeClass: themeClass,
      screenClass: system.screenClass(),
      statusBarH: system.statusBarHeight(),
      navMode: settings.navMode || 'bottom',
      drawerOpen: (settings.navMode || 'bottom') === 'drawer' ? this.data.drawerOpen : false,
      themeModeLabel: theme.themeModeLabel(settings),
      logoSrc: logoData.getLogoSrc(themeClass)
    })
    nav.syncTabBar(this)
    routeAnim.enter(this)
  },
  onUnload: function() {
    if (this._switchAnimTimer) {
      clearTimeout(this._switchAnimTimer)
      this._switchAnimTimer = null
    }
  },

  onResize: function() {
    this.setData({ screenClass: system.screenClass(), statusBarH: system.statusBarHeight() })
  },

  loadSettings: function() {
    var settings = storage.getSettings()
    var navMode = settings.navMode || 'bottom'
    var themeClass = theme.themeClass(settings)
    this.setData({
      settings: settings,
      themeClass: themeClass,
      screenClass: system.screenClass(),
      navMode: navMode,
      drawerOpen: navMode === 'drawer' ? this.data.drawerOpen : false,
      themeModeLabel: theme.themeModeLabel(settings),
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
          getApp().globalData.themeClass = theme.themeClass(getApp().globalData.settings)
          if (getApp().applyShellTheme) getApp().applyShellTheme(getApp().globalData.settings)
          that.loadSettings()
          wx.showToast({ title: '所有数据已清除', icon: 'success' })
        }
      }
    })
  },

  onOpenThemeSheet: function() {
    this.setData({ showThemeSheet: true })
  },

  onCloseThemeSheet: function() {
    this.setData({ showThemeSheet: false })
  },

  onThemeModeTap: function(e) {
    var v = theme.normalizeThemeMode(e.currentTarget.dataset.mode)
    storage.updateSetting('themeMode', v)
    getApp().globalData.settings = storage.getSettings()
    getApp().globalData.themeClass = theme.themeClass(getApp().globalData.settings)
    if (getApp().applyShellTheme) getApp().applyShellTheme(getApp().globalData.settings)
    this.setData({ showThemeSheet: false })
    this.loadSettings()
    nav.syncTabBar(this)
    wx.showToast({ title: '已切换为' + theme.themeModeName(v), icon: 'none' })
  },

  onToggleNavMode: function() {
    var next = this.data.navMode === 'drawer' ? 'bottom' : 'drawer'
    this.setData({ drawerOpen: false, navMode: next })
    storage.updateSetting('navMode', next)
    getApp().globalData.settings = storage.getSettings()
    getApp().globalData.themeClass = theme.themeClass(getApp().globalData.settings)
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
    if (this._switchAnimTimer) clearTimeout(this._switchAnimTimer)
    var that = this
    this.setData({ switchAnimKey: key })
    this._switchAnimTimer = setTimeout(function() {
      if (that.data.switchAnimKey === key) that.setData({ switchAnimKey: '' })
    }, 360)
  },

  onSwitchAnimationEnd: function() {
    if (this._switchAnimTimer) {
      clearTimeout(this._switchAnimTimer)
      this._switchAnimTimer = null
    }
    if (this.data.switchAnimKey) this.setData({ switchAnimKey: '' })
  },

  _toggleSetting: function(key, e) {
    var v = e && e.detail && typeof e.detail.value === 'boolean' ? e.detail.value : !this.data.settings[key]
    storage.updateSetting(key, v)
    getApp().globalData.settings = storage.getSettings()
    getApp().globalData.themeClass = theme.themeClass(getApp().globalData.settings)
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
})))
