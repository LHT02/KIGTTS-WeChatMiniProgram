var storage = require('../utils/storage')
var nav = require('../utils/nav')
var theme = require('../utils/theme')
var ripple = require('../utils/ripple')
var routeAnim = require('../utils/route-anim')

Component({
  data: {
    rippleList: [],
    selectedPath: '',
    navMode: theme.navMode(),
    themeClass: theme.themeClass(),
    keyboardHidden: false,
    activeIndex: 0,
    tabDriverStyle: 'width:20%;transform:translateX(0%);',
    list: nav.items
  },

  lifetimes: {
    attached: function() {
      this.sync()
    },
    detached: function() {
      this._switchingPath = ''
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
      var activeIndex = 0
      for (var i = 0; i < nav.items.length; i++) {
        if (nav.items[i].path === current) {
          activeIndex = i
          break
        }
      }
      var count = nav.items.length || 1
      this.setData({
        selectedPath: current,
        activeIndex: activeIndex,
        tabDriverStyle: 'width:' + (100 / count) + '%;transform:translateX(' + (activeIndex * 100) + '%);',
        navMode: settings.navMode || 'bottom',
        themeClass: settings.themeMode === 1 ? 'theme-light' : ''
      })
    },

    onTap: function(e) {
      var path = e.currentTarget.dataset.path
      if (!path || path === this.data.selectedPath) return
      this._switchingPath = path
      var activeIndex = 0
      for (var i = 0; i < nav.items.length; i++) {
        if (nav.items[i].path === path) {
          activeIndex = i
          break
        }
      }
      var count = nav.items.length || 1
      var that = this
      this.setData({
        selectedPath: path,
        activeIndex: activeIndex,
        tabDriverStyle: 'width:' + (100 / count) + '%;transform:translateX(' + (activeIndex * 100) + '%);'
      })
      var pages = getCurrentPages()
      var currentPage = pages.length ? pages[pages.length - 1] : null
      routeAnim.exit(currentPage, function() {
        if (that._switchingPath !== path) return
        that._switchingPath = ''
        wx.switchTab({
          url: '/' + path,
          fail: function() {
            if (currentPage) routeAnim.enter(currentPage)
            that.sync()
          }
        })
      })
    },

    setKeyboardHidden: function(hidden) {
      var next = !!hidden
      if (this.data.keyboardHidden === next) return
      this.setData({ keyboardHidden: next })
    },

    onRippleTap: ripple.methods.onRippleTap,
    onRippleLongPress: ripple.methods.onRippleLongPress,
    onRippleTouchStart: ripple.methods.onRippleTouchStart,
    onRippleTouchMove: ripple.methods.onRippleTouchMove,
    onRippleTouchEnd: ripple.methods.onRippleTouchEnd,
    onRippleTouchCancel: ripple.methods.onRippleTouchCancel,
    onRippleClear: ripple.methods.onRippleClear,
    onRippleAnimationEnd: ripple.methods.onRippleAnimationEnd
  }
})
