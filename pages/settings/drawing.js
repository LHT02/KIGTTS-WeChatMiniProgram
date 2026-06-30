var storage = require('../../utils/storage')
var nav = require('../../utils/nav')
var theme = require('../../utils/theme')
var ripple = require('../../utils/ripple')
var routeAnim = require('../../utils/route-anim')
var system = require('../../utils/system')
var share = require('../../utils/share')

Page(share.attach(ripple.attach({
  data: {
    tool: 'pen', color: '#7DE8EA', brushSize: 4, eraserSize: 16,
    toolbarCollapsed: false,
    darkColors: ['#7DE8EA','#90CAF9','#FF9E9E','#AEE5B3','#FFE08A','#ECEFF1','#D1C4E9'],
    lightColors: ['#038387','#1E88E5','#E53935','#43A047','#FFA000','#212121','#5E35B1'],
    colorPalette: [],
    hasDrawn: false,
    themeClass: theme.themeClass(), screenClass: system.screenClass(), statusBarH: 44,
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
    var isLight = theme.isLight(settings)
    this.setData({
      themeClass: theme.themeClass(settings),
      screenClass: system.screenClass(),
      statusBarH: system.statusBarHeight(),
      colorPalette: isLight ? this.data.lightColors : this.data.darkColors,
      color: isLight ? '#038387' : '#7DE8EA',
      navMode: settings.navMode || 'bottom',
      drawerOpen: (settings.navMode || 'bottom') === 'drawer' ? this.data.drawerOpen : false
    })
    nav.syncTabBar(this)
    this._currentColor = isLight ? '#038387' : '#7DE8EA'
    routeAnim.enter(this)
    this._scheduleCanvasInit()
  },

  onLoad: function() {
    this.store = []
    this.redoStack = []
    this.canvas = null
    this.ctx = null
  },

  onReady: function() { this._scheduleCanvasInit() },
  onResize: function() {
    this.setData({ screenClass: system.screenClass(), statusBarH: system.statusBarHeight() })
    this._resetCanvas()
  },

  _boardBg: function() { return this.data.themeClass === 'theme-light' ? '#FCFDFE' : '#242424' },
  _getCurrentSize: function() { return this._currentTool === 'eraser' ? this.data.eraserSize : this.data.brushSize },
  _scheduleCanvasInit: function() {
    var that = this
    setTimeout(function() {
      that._initCanvas(function(ok) { if (ok) that._repaint() })
    }, 0)
  },
  _resetCanvas: function() {
    this.canvas = null
    this.ctx = null
    this._canvasWidth = 0
    this._canvasHeight = 0
    this._scheduleCanvasInit()
  },
  _initCanvas: function(callback) {
    if (this.canvas && this.ctx && this._canvasWidth && this._canvasHeight) {
      if (callback) callback(true)
      return
    }
    var that = this
    this.createSelectorQuery().select('#drawCanvas').fields({ node: true, size: true }).exec(function(res) {
      var data = res && res[0]
      var canvas = data && data.node
      var width = data && data.width
      var height = data && data.height
      if (!canvas || !canvas.getContext || !width || !height) {
        if (callback) callback(false)
        return
      }
      var dpr = system.pixelRatio()
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      var ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      that.canvas = canvas
      that.ctx = ctx
      that._canvasWidth = width
      that._canvasHeight = height
      that._clearCanvas()
      if (callback) callback(true)
    })
  },
  _clearCanvas: function() {
    if (!this.ctx) return
    var w = this._canvasWidth || 1
    var h = this._canvasHeight || 1
    this.ctx.clearRect(0, 0, w, h)
    this.ctx.fillStyle = this._boardBg()
    this.ctx.fillRect(0, 0, w, h)
  },
  _applyStrokeStyle: function(ctx, tool, color, size) {
    ctx.strokeStyle = tool === 'eraser' ? this._boardBg() : color
    ctx.lineWidth = size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  },
  _paintStoredStrokes: function() {
    if (!this.ctx) return
    var ctx = this.ctx
    this._clearCanvas()
    for (var si = 0; si < this.store.length; si++) {
      var stroke = this.store[si]
      for (var i = 1; i < stroke.path.length; i++) {
        ctx.beginPath(); ctx.moveTo(stroke.path[i-1].x, stroke.path[i-1].y); ctx.lineTo(stroke.path[i].x, stroke.path[i].y)
        this._applyStrokeStyle(ctx, stroke.tool, stroke.color, stroke.brushSize)
        ctx.stroke()
      }
    }
  },

  onTouchStart: function(e) {
    if (this.data.drawerOpen) return
    if (!this.ctx) { this._initCanvas(); return }
    var ctx = this.ctx, x = e.touches[0].x, y = e.touches[0].y
    ctx.beginPath(); ctx.moveTo(x, y)
    this._applyStrokeStyle(ctx, this._currentTool, this._currentColor, this._getCurrentSize())
    this._path = [{ x: x, y: y }]
  },

  onTouchMove: function(e) {
    if (this.data.drawerOpen) return
    if (!this.ctx || !this._path) return
    var ctx = this.ctx, x = e.touches[0].x, y = e.touches[0].y
    ctx.lineTo(x, y); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x, y)
    this._applyStrokeStyle(ctx, this._currentTool, this._currentColor, this._getCurrentSize())
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
        that.store = []
        that.redoStack = []
        that._path = null
        that._clearCanvas()
        that.setData({ hasDrawn: false })
      }
    })
  },

  onUndo: function() { if (this.store.length === 0) return; this.redoStack.push(this.store.pop()); this._repaint() },
  onRedo: function() { if (this.redoStack.length === 0) return; this.store.push(this.redoStack.pop()); this._repaint() },

  _repaint: function() {
    var that = this
    this._initCanvas(function(ok) {
      if (!ok) return
      that._paintStoredStrokes()
      that.setData({ hasDrawn: that.store.length > 0 })
    })
  },

  onToggleToolbar: function() { this.setData({ toolbarCollapsed: !this.data.toolbarCollapsed }) },

  onSave: function() {
    var that = this
    this._initCanvas(function(ok) {
      if (!ok || !that.canvas) { wx.showToast({ title: '导出失败', icon: 'none' }); return }
      that._paintStoredStrokes()
      wx.canvasToTempFilePath({ canvas: that.canvas,
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
      }, that)
    })
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
