var nav = require('../../utils/nav')
var theme = require('../../utils/theme')
var storage = require('../../utils/storage')
var ripple = require('../../utils/ripple')

var PATH_TO_ID = {
  'pages/subtitle/index': 'tab-subtitle',
  'pages/card/index': 'tab-card',
  'pages/settings/drawing': 'tab-drawing',
  'pages/soundboard/index': 'tab-soundboard',
  'pages/settings/index': 'tab-settings'
}

var ACTIONS = {
  'pages/subtitle/index': [{ icon: 'edit', action: 'onManageEditor' }],
  'pages/card/index': [{ icon: 'add', action: 'onAddCard' }, { icon: 'sort', action: 'onToggleSort' }],
  'pages/settings/drawing': [{ icon: 'save', action: 'onSave' }],
  'pages/settings/index': []
}

function normalize(path) {
  return (path || '').replace(/^\/+/, '')
}

function titleFor(path) {
  for (var i = 0; i < nav.items.length; i++) {
    if (nav.items[i].path === path) return nav.items[i].label || nav.items[i].text
  }
  return '便捷字幕'
}

function indexFor(path) {
  for (var i = 0; i < nav.items.length; i++) {
    if (nav.items[i].path === path) return i
  }
  return 0
}

Page(ripple.attach({
  data: {
    activePath: 'pages/subtitle/index',
    activeTitle: '便捷字幕',
    activeActions: ACTIONS['pages/subtitle/index'],
    activeIndex: 0,
    tabDriverStyle: 'width:20%;transform:translateX(0%);',
    navItems: nav.items,
    navMode: theme.navMode(),
    themeClass: theme.themeClass(),
    statusBarH: 44,
    drawerOpen: false,
    keyboardHidden: false,
    chromeAnimClass: '',
    logoGlyph: nav.logoGlyph
  },

  onLoad: function(query) {
    var target = normalize(query && query.tab) || 'pages/subtitle/index'
    if (!PATH_TO_ID[target]) target = 'pages/subtitle/index'
    this._setActiveState(target, false)
    this._syncShell(false)
  },

  onReady: function() {
    this._syncChildrenShell()
    this._activateCurrent()
  },

  onShow: function() {
    this._syncShell(true)
    this._activateCurrent()
  },

  _syncShell: function(syncChildren) {
    var settings = storage.getSettings()
    var sys = wx.getSystemInfoSync()
    this.setData({
      themeClass: (settings.themeMode || 0) === 1 ? 'theme-light' : '',
      navMode: settings.navMode || 'bottom',
      statusBarH: sys.statusBarHeight || 44,
      drawerOpen: (settings.navMode || 'bottom') === 'drawer' ? this.data.drawerOpen : false
    }, syncChildren ? this._syncChildrenShell.bind(this) : undefined)
  },

  _setActiveState: function(path, animateChrome) {
    var idx = indexFor(path)
    var count = nav.items.length || 1
    var data = {
      activePath: path,
      activeTitle: titleFor(path),
      activeActions: this._actionsFor(path),
      activeIndex: idx,
      tabDriverStyle: 'width:' + (100 / count) + '%;transform:translateX(' + (idx * 100) + '%);',
      keyboardHidden: false
    }
    if (animateChrome) data.chromeAnimClass = 'chrome-changing'
    this.setData(data)
  },

  _componentFor: function(path) {
    var id = PATH_TO_ID[path || this.data.activePath]
    return id ? this.selectComponent('#' + id) : null
  },

  _actionsFor: function(path) {
    if (path === 'pages/soundboard/index') {
      var child = this._componentFor(path)
      var mode = child && child.data && child.data.config && child.data.config.layoutMode
      return [{ icon: mode === 'grid' ? 'view_list' : 'grid_view', action: 'onToggleLayout' }]
    }
    return ACTIONS[path] || []
  },

  _activateCurrent: function() {
    var child = this._componentFor(this.data.activePath)
    if (child && typeof child.activate === 'function') child.activate()
    this.setData({ activeActions: this._actionsFor(this.data.activePath) })
    this._syncChildrenShell()
  },

  _syncChildrenShell: function() {
    var state = {
      themeClass: this.data.themeClass,
      navMode: this.data.navMode,
      statusBarH: this.data.statusBarH,
      drawerOpen: this.data.drawerOpen
    }
    Object.keys(PATH_TO_ID).forEach(function(path) {
      var child = this._componentFor(path)
      if (child && typeof child.setShellState === 'function') child.setShellState(state)
    }, this)
  },

  switchToPath: function(path) {
    path = normalize(path)
    if (!PATH_TO_ID[path]) return
    if (path === this.data.activePath) {
      if (this.data.drawerOpen) this.onCloseDrawer()
      return
    }
    var oldChild = this._componentFor(this.data.activePath)
    if (oldChild && typeof oldChild.deactivate === 'function') oldChild.deactivate()

    this.setData({ drawerOpen: false })
    this._setActiveState(path, true)
    var that = this
    this._syncShell(true)
    wx.nextTick(function() {
      var child = that._componentFor(path)
      if (child && typeof child.activate === 'function') child.activate()
      setTimeout(function() {
        if (that.data.chromeAnimClass) that.setData({ chromeAnimClass: '' })
      }, 160)
    })
  },

  onTabTap: function(e) {
    this.switchToPath(e.currentTarget.dataset.path)
  },

  onTopActionTap: function(e) {
    var action = e.currentTarget.dataset.action
    var child = this._componentFor(this.data.activePath)
    if (child && action && typeof child[action] === 'function') {
      child[action]()
      this.setData({ activeActions: this._actionsFor(this.data.activePath) })
    }
  },

  onOpenDrawer: function() {
    this.setData({ drawerOpen: true }, this._syncChildrenShell.bind(this))
  },

  onCloseDrawer: function() {
    this.setData({ drawerOpen: false }, this._syncChildrenShell.bind(this))
  },

  onDrawerNavTap: function(e) {
    this.switchToPath(e.currentTarget.dataset.path)
  },

  onKeyboardHidden: function(e) {
    var hidden = !!(e && e.detail && e.detail.hidden)
    if (this.data.keyboardHidden === hidden) return
    this.setData({ keyboardHidden: hidden })
  },

  onShellChange: function() {
    this._syncShell(true)
  },

  noop: function() {}
}))
