var storage = require('../utils/storage')
var nav = require('../utils/nav')
var theme = require('../utils/theme')
var ripple = require('../utils/ripple')

Component({
  data: {
    rippleList: [],
    selectedPath: '',
    navMode: theme.navMode(),
    themeClass: theme.themeClass(),
    keyboardHidden: false,
    list: nav.items
  },

  lifetimes: {
    attached: function() {
      this.sync()
    }
  },

  pageLifetimes: {
    show: function() {
      ripple.methods.onRippleClear.call(this)
      this.sync()
    },
    hide: function() {
      ripple.methods.onRippleClear.call(this)
    }
  },

  methods: {
    sync: function() {
      var pages = getCurrentPages()
      var current = pages.length ? pages[pages.length - 1].route : ''
      var settings = storage.getSettings()
      this.setData({
        selectedPath: current,
        navMode: settings.navMode || 'bottom',
        themeClass: settings.themeMode === 1 ? 'theme-light' : ''
      })
    },

    onTap: function(e) {
      var path = e.currentTarget.dataset.path
      if (!path || path === this.data.selectedPath) return
      wx.switchTab({ url: '/' + path })
    },

    setKeyboardHidden: function(hidden) {
      var next = !!hidden
      if (this.data.keyboardHidden === next) return
      this.setData({ keyboardHidden: next })
    },

    onRippleTouchStart: ripple.methods.onRippleTouchStart,
    onRippleTouchMove: ripple.methods.onRippleTouchMove,
    onRippleTouchEnd: ripple.methods.onRippleTouchEnd,
    onRippleTouchCancel: ripple.methods.onRippleTouchCancel,
    onRippleClear: ripple.methods.onRippleClear,
    onRippleAnimationEnd: ripple.methods.onRippleAnimationEnd
  }
})
