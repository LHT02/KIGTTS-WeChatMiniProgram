var storage = require('../../utils/storage')
var nav = require('../../utils/nav')
var theme = require('../../utils/theme')
var ripple = require('../../utils/ripple')
var routeAnim = require('../../utils/route-anim')

var componentPage = require('../../utils/component-page')
Component(componentPage.fromPage(ripple.attach({
  data: {
    tool: 'pen', color: '#7DE8EA', brushSize: 4, eraserSize: 16,
    toolbarCollapsed: false,
    darkColors: ['#7DE8EA','#90CAF9','#FF9E9E','#AEE5B3','#FFE08A','#ECEFF1','#D1C4E9'],
    lightColors: ['#038387','#1E88E5','#E53935','#43A047','#FFA000','#212121','#5E35B1'],
    colorPalette: [],
    hasDrawn: false,
    themeClass: theme.themeClass(), statusBarH: 44,
    routeEnterClass: '',
    navMode: theme.navMode(),
    drawerOpen: false,
    currentPath: 'pages/settings/drawing',
    navItems: nav.items,
    logoGlyph: nav.logoGlyph
  },

  _currentColor: '#7DE8EA',
  _currentTool: 'pen',

  onShow: function() {
    var settings = storage.getSettings()
    var themeMode = settings.themeMode || 0
    var sys = wx.getSystemInfoSync()
    var isLight = themeMode === 1
    this.setData({
      themeClass: isLight ? 'theme-light' : '',
      statusBarH: sys.statusBarHeight || 44,
      colorPalette: isLight ? this.data.lightColors : this.data.darkColors,
      color: isLight ? '#038387' : '#7DE8EA',
      navMode: settings.navMode || 'bottom',
      drawerOpen: (settings.navMode || 'bottom') === 'drawer' ? this.data.drawerOpen : false
    })
    nav.syncTabBar(this)
    this._currentColor = isLight ? '#038387' : '#7DE8EA'
    routeAnim.enter(this)
  },

  onLoad: function() {
    this.store = []
    this.redoStack = []
    this.ctx = wx.createCanvasContext('drawCanvas', this)
  },

  _boardBg: function() { return this.data.themeClass === 'theme-light' ? '#FCFDFE' : '#242424' },
  _getCurrentSize: function() { return this._currentTool === 'eraser' ? this.data.eraserSize : this.data.brushSize },

  onTouchStart: function(e) {
    if (this.data.drawerOpen) return
    if (!this.ctx) this.ctx = wx.createCanvasContext('drawCanvas', this)
    var ctx = this.ctx, x = e.touches[0].x, y = e.touches[0].y
    ctx.beginPath(); ctx.moveTo(x, y)
    var size = this._getCurrentSize(), bg = this._boardBg()
    if (this._currentTool === 'eraser') { ctx.setStrokeStyle(bg); ctx.setLineWidth(size) }
    else { ctx.setStrokeStyle(this._currentColor); ctx.setLineWidth(size) }
    ctx.setLineCap('round'); ctx.setLineJoin('round')
    this._path = [{ x: x, y: y }]
  },

  onTouchMove: function(e) {
    if (this.data.drawerOpen) return
    if (!this.ctx || !this._path) return
    var ctx = this.ctx, x = e.touches[0].x, y = e.touches[0].y, bg = this._boardBg()
    ctx.lineTo(x, y); ctx.stroke(); ctx.draw(true)
    ctx.beginPath(); ctx.moveTo(x, y)
    var size = this._getCurrentSize()
    if (this._currentTool === 'eraser') { ctx.setStrokeStyle(bg); ctx.setLineWidth(size) }
    else { ctx.setStrokeStyle(this._currentColor); ctx.setLineWidth(size) }
    ctx.setLineCap('round'); ctx.setLineJoin('round')
    this._path.push({ x: x, y: y })
    this.setData({ hasDrawn: true })
  },

  onTouchEnd: function() {
    if (this._path && this._path.length > 0) {
      this.store.push({ tool: this._currentTool, color: this._currentColor, brushSize: this._getCurrentSize(), path: this._path })
      this.redoStack = []
    }
    this._path = null
  },

  onSelectTool: function(e) {
    var t = e.currentTarget.dataset.tool
    this._currentTool = t; this.setData({ tool: t })
  },

  onPickColor: function(e) {
    var c = e.currentTarget.dataset.color
    this._currentColor = c; this.setData({ color: c })
  },

  onBrushSizeChange: function(e) { this.setData({ brushSize: Math.round(e.detail.value) }) },
  onEraserSizeChange: function(e) { this.setData({ eraserSize: Math.round(e.detail.value) }) },

  onClear: function() {
    var that = this
    wx.showModal({ title: '确认清除', content: '确定要清除画板吗？', confirmColor: '#cf6679',
      success: function(res) {
        if (!res.confirm) return
        that.ctx.draw(); that.store = []; that.redoStack = []; that.setData({ hasDrawn: false })
        that.ctx = wx.createCanvasContext('drawCanvas', that); that.ctx.draw()
      }
    })
  },

  onUndo: function() { if (this.store.length === 0) return; this.redoStack.push(this.store.pop()); this._repaint() },
  onRedo: function() { if (this.redoStack.length === 0) return; this.store.push(this.redoStack.pop()); this._repaint() },

  _repaint: function() {
    var ctx = wx.createCanvasContext('drawCanvas', this); ctx.draw(); var bg = this._boardBg()
    for (var si = 0; si < this.store.length; si++) {
      var stroke = this.store[si]
      for (var i = 1; i < stroke.path.length; i++) {
        ctx.beginPath(); ctx.moveTo(stroke.path[i-1].x, stroke.path[i-1].y); ctx.lineTo(stroke.path[i].x, stroke.path[i].y)
        if (stroke.tool === 'eraser') { ctx.setStrokeStyle(bg); ctx.setLineWidth(stroke.brushSize) }
        else { ctx.setStrokeStyle(stroke.color); ctx.setLineWidth(stroke.brushSize) }
        ctx.setLineCap('round'); ctx.setLineJoin('round'); ctx.stroke()
      }
    }
    ctx.draw(); this.ctx = ctx; this.setData({ hasDrawn: this.store.length > 0 })
  },

  onToggleToolbar: function() { this.setData({ toolbarCollapsed: !this.data.toolbarCollapsed }) },

  onSave: function() {
    var that = this
    wx.canvasToTempFilePath({ canvasId: 'drawCanvas',
      success: function(res) {
        wx.saveImageToPhotosAlbum({ filePath: res.tempFilePath,
          success: function() { wx.showToast({ title: '已保存到相册', icon: 'success' }) },
          fail: function(err) {
            if (err.errMsg.indexOf('auth deny') >= 0) {
              wx.showModal({ title: '需要相册权限', content: '请在设置中允许小程序保存图片到相册', showCancel: false })
            }
          }
        })
      },
      fail: function() { wx.showToast({ title: '导出失败', icon: 'none' }) }
    }, this)
  },

  onOpenDrawer: function() {
    this._path = null
    this.setData({ drawerOpen: true })
  },
  onCloseDrawer: function() {
    var that = this
    this.setData({ drawerOpen: false }, function() {
      setTimeout(function() { that._repaint() }, 40)
    })
  },
  onDrawerNavTap: function(e) { nav.go(e.currentTarget.dataset.path, this.data.currentPath) },
  noop: function() {}
})))
