function noop() {}

function fromPage(pageOptions) {
  pageOptions = pageOptions || {}

  var onLoad = pageOptions.onLoad
  var onReady = pageOptions.onReady
  var onShow = pageOptions.onShow
  var onHide = pageOptions.onHide
  var onUnload = pageOptions.onUnload
  var onResize = pageOptions.onResize

  var methods = {}
  Object.keys(pageOptions).forEach(function(key) {
    if (key === 'data' || key === 'properties' || key === 'options') return
    if (key === 'onLoad' || key === 'onReady' || key === 'onShow' || key === 'onHide' || key === 'onUnload' || key === 'onResize') return
    if (typeof pageOptions[key] === 'function') methods[key] = pageOptions[key]
    else methods[key] = pageOptions[key]
  })

  methods.activate = function() {
    if (onShow) onShow.apply(this, arguments)
  }
  methods.deactivate = function() {
    if (onHide) onHide.apply(this, arguments)
  }
  methods.setShellState = function(state) {
    state = state || {}
    var data = {}
    if (state.themeClass != null) data.themeClass = state.themeClass
    if (state.navMode != null) data.navMode = state.navMode
    if (state.statusBarH != null) data.statusBarH = state.statusBarH
    if (state.drawerOpen != null) data.drawerOpen = state.drawerOpen
    if (state.screenClass != null) data.screenClass = state.screenClass
    if (Object.keys(data).length) this.setData(data)
  }
  methods.onOpenDrawer = function() {
    this.triggerEvent('opendrawer', {}, { bubbles: true, composed: true })
  }
  methods.onCloseDrawer = noop
  methods.onDrawerNavTap = noop

  if (typeof methods._setTabBarKeyboardHidden === 'function') {
    var oldKeyboardHidden = methods._setTabBarKeyboardHidden
    methods._setTabBarKeyboardHidden = function(hidden) {
      oldKeyboardHidden.call(this, hidden)
      this.triggerEvent('keyboardhidden', { hidden: !!hidden }, { bubbles: true, composed: true })
    }
  }

  ;['onThemeModeTap', 'onToggleNavMode'].forEach(function(name) {
    if (typeof methods[name] !== 'function') return
    var oldMethod = methods[name]
    methods[name] = function() {
      var result = oldMethod.apply(this, arguments)
      var that = this
      setTimeout(function() {
        that.triggerEvent('shellchange', {}, { bubbles: true, composed: true })
      }, 0)
      return result
    }
  })

  return {
    options: Object.assign({ styleIsolation: 'apply-shared' }, pageOptions.options || {}),
    properties: Object.assign({
      active: { type: Boolean, value: false }
    }, pageOptions.properties || {}),
    data: pageOptions.data || {},
    lifetimes: {
      attached: function() {
        if (onLoad) onLoad.call(this, {})
      },
      ready: function() {
        if (onReady) onReady.apply(this, arguments)
      },
      detached: function() {
        if (onUnload) onUnload.apply(this, arguments)
      }
    },
    pageLifetimes: {
      show: noop,
      hide: function() {
        if (onHide) onHide.apply(this, arguments)
      },
      resize: function() {
        if (onResize) onResize.apply(this, arguments)
      }
    },
    methods: methods
  }
}

module.exports = {
  fromPage: fromPage
}
