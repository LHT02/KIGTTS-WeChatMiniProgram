var nav = require('../../utils/nav')
var theme = require('../../utils/theme')
var storage = require('../../utils/storage')
var ripple = require('../../utils/ripple')
var system = require('../../utils/system')
var share = require('../../utils/share')

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

var TAB_DRIVER_RPX = 56
var TAB_DRIVER_MIN_PX = 24
var TAB_DRIVER_MAX_RATIO = 0.62

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

function fallbackTabDriverStyle(index) {
  var count = nav.items.length || 1
  if (system.isLargeScreen && system.isLargeScreen()) {
    var slotPx = system.windowWidth() / count
    var widthPx = rpxToPx(TAB_DRIVER_RPX)
    var leftPx = slotPx * index + Math.max(0, (slotPx - widthPx) / 2)
    return 'width:' + widthPx + 'px;transform:translateX(' + leftPx + 'px) translateY(-1px);'
  }
  var slot = 750 / count
  var left = slot * index + Math.max(0, (slot - TAB_DRIVER_RPX) / 2)
  return 'width:' + TAB_DRIVER_RPX + 'rpx;transform:translateX(' + left + 'rpx) translateY(-2rpx);'
}

function rpxToPx(rpx) {
  return system.rpxToPx(rpx)
}

function tabDriverWidth(itemWidth) {
  var defaultWidth = rpxToPx(TAB_DRIVER_RPX)
  var maxWidth = Math.max(TAB_DRIVER_MIN_PX, itemWidth * TAB_DRIVER_MAX_RATIO)
  return Math.max(TAB_DRIVER_MIN_PX, Math.min(defaultWidth, maxWidth))
}

Page(share.attach(ripple.attach({
  data: {
    activePath: 'pages/subtitle/index',
    activeTitle: '便捷字幕',
    activeActions: ACTIONS['pages/subtitle/index'],
    activeIndex: 0,
    tabDriverStyle: fallbackTabDriverStyle(0),
    tabDriverUnequal: false,
    tabScrollLeft: 0,
    navItems: nav.items,
    navMode: theme.navMode(),
    themeClass: theme.themeClass(),
    screenClass: system.screenClass(),
    statusBarH: 44,
    drawerOpen: false,
    keyboardHidden: false,
    shellOverlayOpen: false,
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
    this._scheduleTabMeasure()
  },

  onShow: function() {
    this._syncShell(true)
    this._activateCurrent()
    this._scheduleTabMeasure()
  },

  onResize: function() {
    this._syncShell(true)
  },

  refreshThemeFromSystem: function() {
    this._syncShell(true)
  },

  _syncShell: function(syncChildren) {
    var settings = storage.getSettings()
    var that = this
    this.setData({
      themeClass: theme.themeClass(settings),
      screenClass: system.screenClass(),
      navMode: settings.navMode || 'bottom',
      statusBarH: system.statusBarHeight(),
      drawerOpen: (settings.navMode || 'bottom') === 'drawer' ? this.data.drawerOpen : false
    }, function() {
      if (syncChildren) that._syncChildrenShell()
      that._scheduleTabMeasure()
    })
  },

  _setActiveState: function(path, animateChrome) {
    var idx = indexFor(path)
    var data = {
      activePath: path,
      activeTitle: titleFor(path),
      activeActions: this._actionsFor(path),
      activeIndex: idx,
      keyboardHidden: false,
      shellOverlayOpen: false
    }
    Object.assign(data, this._tabDriverState(idx, this.data.activeIndex))
    if (animateChrome) data.chromeAnimClass = 'chrome-changing'
    this.setData(data)
  },

  _scheduleTabMeasure: function() {
    if (this.data.navMode === 'drawer' || this.data.keyboardHidden) return
    if (this._tabMeasureTimer) clearTimeout(this._tabMeasureTimer)
    var that = this
    this._tabMeasureTimer = setTimeout(function() {
      that._tabMeasureTimer = null
      that._measureTabs()
    }, 0)
  },

  _measureTabs: function() {
    if (this.data.navMode === 'drawer' || this.data.keyboardHidden) return
    var query = this.createSelectorQuery()
    query.select('#main-tab').boundingClientRect()
    query.selectAll('.main-tab-item').boundingClientRect()
    query.exec(function(res) {
      var container = res && res[0]
      var items = res && res[1]
      if (!container || !items || !items.length) return
      var start = items[0].left
      var end = items[items.length - 1].right
      this._tabMetrics = {
        scrollViewWidth: container.width || 0,
        tabStartPosition: start || 0,
        tabListWidth: (end || 0) - (start || 0),
        items: items
      }
      this.setData(this._tabDriverState(this.data.activeIndex, this.data.activeIndex))
    }.bind(this))
  },

  _tabDriverState: function(index, previousIndex) {
    var count = nav.items.length || 1
    var metrics = this._tabMetrics
    if (!metrics || !metrics.items || !metrics.items[index]) {
      return {
        tabDriverStyle: fallbackTabDriverStyle(index),
        tabDriverUnequal: false
      }
    }

    var item = metrics.items[index]
    var previous = metrics.items[previousIndex]
    var width = tabDriverWidth(item.width || 0)
    var previousWidth = previous ? tabDriverWidth(previous.width || 0) : width
    var left = item.left - metrics.tabStartPosition + Math.max(0, ((item.width || width) - width) / 2)
    var data = {
      tabDriverStyle: 'width:' + width + 'px;transform:translateX(' + left + 'px) translateY(-2rpx);',
      tabDriverUnequal: !!(previous && Math.abs(previousWidth - width) > 0.5)
    }

    if (metrics.scrollViewWidth && metrics.scrollViewWidth < metrics.tabListWidth) {
      var scrollLeft = this._tabScrollLeft || 0
      var btnStart = item.left
      var btnEnd = item.right
      var start = metrics.tabStartPosition
      if (!(btnStart >= scrollLeft + start && btnEnd <= Math.ceil(scrollLeft + metrics.scrollViewWidth + start))) {
        if (btnStart - start <= scrollLeft) {
          data.tabScrollLeft = index === 0 ? 0 : btnStart - start - (index > 0 ? (metrics.items[index - 1].width / 2) : 0)
        } else {
          data.tabScrollLeft = btnEnd - metrics.scrollViewWidth - start + ((index + 1) < count ? (metrics.items[index + 1].width / 2) : 0)
        }
      }
    }

    return data
  },

  _componentFor: function(path) {
    var id = PATH_TO_ID[path || this.data.activePath]
    return id ? this.selectComponent('#' + id) : null
  },

  _hasBlockingOverlay: function() {
    if (this.data.shellOverlayOpen) return true
    var child = this._componentFor(this.data.activePath)
    return !!(child && child.data && child.data.showPreview)
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
      screenClass: this.data.screenClass,
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
    if (this._hasBlockingOverlay()) return
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

  onTabScroll: function(e) {
    this._tabScrollLeft = e && e.detail ? e.detail.scrollLeft : 0
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
    this.setData({ keyboardHidden: hidden }, this._scheduleTabMeasure.bind(this))
  },

  onShellOverlay: function(e) {
    var open = !!(e && e.detail && e.detail.open)
    if (this.data.shellOverlayOpen === open) return
    this.setData({ shellOverlayOpen: open })
  },

  onShellChange: function() {
    this._syncShell(true)
  },

  noop: function() {}
})))
