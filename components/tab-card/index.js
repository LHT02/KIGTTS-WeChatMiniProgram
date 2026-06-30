var storage = require('../../utils/storage')
var qr = require('../../utils/qrcode')
var nav = require('../../utils/nav')
var theme = require('../../utils/theme')
var ripple = require('../../utils/ripple')
var routeAnim = require('../../utils/route-anim')
var system = require('../../utils/system')

var PRESET_COLORS = ['#f44336','#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3','#03a9f4','#00bcd4','#009688','#4caf50','#8bc34a','#cddc39','#ffeb3b','#ffc107','#ff9800','#ff5722','#795548','#9e9e9e','#607d8b','#038387']

var componentPage = require('../../utils/component-page')
Component(componentPage.fromPage(ripple.attach({
  data: {
    cards: [], currentIndex: 0, sortMode: false,
    showPreview: false, previewCard: null,
    showEditor: false, editingId: null,
    title: '', note: '', color: '#038387', link: '', imagePath: '',
    showColorPicker: false, hexInput: '', hHue: 0, hSat: 1, hLight: 0.5,
    showDeleteConfirm: false, themeClass: theme.themeClass(), screenClass: system.screenClass(), statusBarH: 44,
    routeEnterClass: '',
    navMode: theme.navMode(),
    drawerOpen: false, currentPath: 'pages/card/index', navItems: nav.items,
    logoGlyph: nav.logoGlyph,
    cardFrameStyle: '',
    presetColors: PRESET_COLORS
  },

  onShow: function() {
    var app = getApp()
    var settings = storage.getSettings()
    var sys = system.windowInfo()
    var navMode = settings.navMode || 'bottom'
    this.setData({
      themeClass: theme.themeClass(settings),
      screenClass: system.screenClass(),
      statusBarH: system.statusBarHeight(),
      navMode: navMode,
      drawerOpen: navMode === 'drawer' ? this.data.drawerOpen : false,
      cardFrameStyle: this._buildCardFrameStyle(sys, navMode, this.data.sortMode)
    })
    nav.syncTabBar(this)
    this.loadCards()
    routeAnim.enter(this)
  },

  onReady: function() { this._syncCardFrameSize() },

  onResize: function() {
    this.setData({ screenClass: system.screenClass(), statusBarH: system.statusBarHeight() })
    this._syncCardFrameSize()
  },

  _syncCardFrameSize: function(navMode, sortMode) {
    var sys = system.windowInfo()
    this.setData({
      cardFrameStyle: this._buildCardFrameStyle(
        sys,
        navMode || this.data.navMode || 'bottom',
        typeof sortMode === 'boolean' ? sortMode : this.data.sortMode
      )
    })
  },

  _buildCardFrameStyle: function(sys, navMode, sortMode) {
    sys = sys || system.windowInfo()
    var ww = sys.windowWidth || sys.screenWidth || 375
    var wh = sys.windowHeight || sys.screenHeight || 667
    var rpx = system.rpxRatio()
    var status = sys.statusBarHeight || 0
    var safeBottom = system.safeAreaBottom(sys)

    var navHeight = status + 88 * rpx
    var slidePaddingY = 40 * rpx
    var dotsHeight = 32 * rpx
    var sortBarHeight = 0
    if (navMode === 'bottom') {
      dotsHeight = (sortMode ? 32 : 144) * rpx + (sortMode ? 0 : safeBottom)
      sortBarHeight = sortMode ? (208 * rpx + safeBottom) : 0
    } else if (sortMode) {
      sortBarHeight = 96 * rpx
    }

    var pagerEdgeX = 28 * rpx
    var slidePaddingX = 32 * rpx
    var maxWidth = Math.max(240, ww - pagerEdgeX * 2 - slidePaddingX)
    var maxHeight = wh - navHeight - dotsHeight - sortBarHeight - slidePaddingY
    maxHeight = Math.max(280, maxHeight)

    var aspect = 9 / 16
    var finalWidth = Math.min(maxWidth, maxHeight * aspect)
    var finalHeight = finalWidth / aspect
    return 'width:' + Math.floor(finalWidth) + 'px;height:' + Math.floor(finalHeight) + 'px;'
  },

  loadCards: function() {
    var c = storage.getCardConfig()
    var idx = this.data.currentIndex
    if (idx >= (c.cards || []).length) idx = Math.max(0, (c.cards || []).length - 1)
    this.setData({ cards: (c.cards || []), currentIndex: idx })
  },

  onSwiperChange: function(e) { this.setData({ currentIndex: e.detail.current }) },

  onCardTap: function(e) {
    var idx = e.currentTarget.dataset.index
    var card = this.data.cards[idx]
    if (!card) return
    this.setData({ showPreview: true, previewCard: card })
    this._drawPreviewQr(card)
  },

  onClosePreview: function() { this.setData({ showPreview: false, previewCard: null }) },

  _drawPreviewQr: function(card) {
    if (!card || !card.link) return
    var that = this
    wx.nextTick(function() {
      qr.drawCanvas(that, 'qrPreviewCanvas', card.link).catch(function() {
        wx.setClipboardData({
          data: card.link,
          success: function() { wx.showToast({ title: '内容过长，链接已复制', icon: 'none' }) }
        })
      })
    })
  },

  onCardLongPress: function(e) {
    var idx = e.currentTarget.dataset.index, card = this.data.cards[idx]
    if (!card) return
    var that = this
    wx.showActionSheet({ itemList: ['编辑','复制','删除'],
      success: function(r) {
        if (r.tapIndex===0) that._openEditor(card)
        else if (r.tapIndex===1) that._copyCard(card)
        else if (r.tapIndex===2) that._confirmDelete(card)
      }
    })
  },

  onAddCard: function() {
    this.setData({ showEditor:true, editingId:null, title:'', note:'', color:'#038387', link:'', imagePath:'' })
  },

  onCloseEditor: function() { this.setData({ showEditor:false }) },

  onSaveCard: function() {
    var title = (this.data.title||'').trim()
    if (!title) { wx.showToast({ title:'请输入标题', icon:'none' }); return }
    var c = storage.getCardConfig()
    var d = {
      id: this.data.editingId || Date.now(),
      title: title,
      note: (this.data.note||'').trim(),
      themeColor: this.data.color,
      link: (this.data.link||'').trim(),
      imagePath: this.data.imagePath
    }
    if (this.data.editingId) {
      var eid = this.data.editingId
      for (var i = 0; i < c.cards.length; i++) { if (c.cards[i].id === eid) { c.cards[i] = d; break } }
    } else { c.cards.push(d) }
    storage.saveCardConfig(c)
    this.setData({ showEditor:false }); this.loadCards()
    wx.showToast({ title: '名片已保存', icon: 'success' })
  },

  _openEditor: function(card) {
    this.setData({
      showEditor:true, editingId:card.id,
      title:card.title||'', note:card.note||'',
      color:card.themeColor||'#038387', link:card.link||'',
      imagePath:card.imagePath||''
    })
  },

  _copyCard: function(card) {
    var c = storage.getCardConfig()
    var copy = {
      id: Date.now(), title: card.title + ' (副本)',
      note: card.note || '', themeColor: card.themeColor || '#038387',
      link: card.link || '', imagePath: card.imagePath || ''
    }
    c.cards.push(copy)
    storage.saveCardConfig(c); this.loadCards()
    wx.showToast({ title: '已复制', icon: 'success' })
  },

  _confirmDelete: function(card) { this.setData({ showDeleteConfirm:true, previewCard:card }) },

  onConfirmDelete: function() {
    var card = this.data.previewCard; if (!card) return
    var c = storage.getCardConfig(), newCards = []
    for (var i = 0; i < c.cards.length; i++) { if (c.cards[i].id !== card.id) newCards.push(c.cards[i]) }
    c.cards = newCards
    storage.saveCardConfig(c); this.setData({showDeleteConfirm:false}); this.loadCards()
    wx.showToast({ title: '已删除', icon: 'success' })
  },

  onCancelDelete: function() { this.setData({showDeleteConfirm:false}) },

  onEditTap: function() {
    var card=this.data.previewCard
    this.setData({showPreview:false})
    if(card) this._openEditor(card)
  },

  onCardEditTap: function(e) {
    var idx = e.currentTarget.dataset.index
    var card = this.data.cards[idx]
    if (card) this._openEditor(card)
  },

  onOpenCardLink: function(e) {
    var link = e.currentTarget.dataset.link
    if (link) wx.setClipboardData({ data: link, success: function() { wx.showToast({ title: '链接已复制', icon: 'success' }) } })
  },

  onShareCardLink: function(e) {
    var link = e.currentTarget.dataset.link
    if (link) wx.setClipboardData({ data: link, success: function() { wx.showToast({ title: '链接已复制', icon: 'success' }) } })
  },

  onPickColor: function(e) {
    this.setData({ color: e.currentTarget.dataset.color })
  },

  onOpenColorPicker: function() {
    var col = this.data.color || '#038387'
    var hsl = this._hexToHsl(col)
    this.setData({ showColorPicker: true, hexInput: col, hHue: hsl.h, hSat: hsl.s, hLight: hsl.l })
  },

  onCloseColorPicker: function() { this.setData({ showColorPicker: false }) },

  onHexInputChange: function(e) { this.setData({ hexInput: e.detail.value }) },

  onApplyHexColor: function() {
    var hex = (this.data.hexInput || '').trim()
    if (!hex) { wx.showToast({ title: '请输入颜色值', icon: 'none' }); return }
    if (hex[0] !== '#') hex = '#' + hex
    if (/^#[0-9a-fA-F]{3,8}$/.test(hex)) {
      if (hex.length === 4) { hex = '#' + hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3] }
      this.setData({ color: hex, showColorPicker: false })
    } else {
      wx.showToast({ title: '无效的颜色值', icon: 'none' })
    }
  },

  onHueChange: function(e) {
    var h = parseInt(e.detail.value) || 0
    this.setData({ hHue: h })
    var hex = this._hslToHex(h, this.data.hSat, this.data.hLight)
    this.setData({ hexInput: hex, color: hex })
  },

  onSatChange: function(e) {
    var s = parseFloat(e.detail.value) / 100
    this.setData({ hSat: s })
    var hex = this._hslToHex(this.data.hHue, s, this.data.hLight)
    this.setData({ hexInput: hex, color: hex })
  },

  onLightChange: function(e) {
    var l = parseFloat(e.detail.value) / 100
    this.setData({ hLight: l })
    var hex = this._hslToHex(this.data.hHue, this.data.hSat, l)
    this.setData({ hexInput: hex, color: hex })
  },

  _hexToHsl: function(hex) {
    var r, g, b
    hex = hex.replace('#', '')
    if (hex.length === 3) {
      r = parseInt(hex[0]+hex[0], 16) / 255
      g = parseInt(hex[1]+hex[1], 16) / 255
      b = parseInt(hex[2]+hex[2], 16) / 255
    } else {
      r = parseInt(hex.substring(0,2), 16) / 255
      g = parseInt(hex.substring(2,4), 16) / 255
      b = parseInt(hex.substring(4,6), 16) / 255
    }
    var max = Math.max(r,g,b), min = Math.min(r,g,b)
    var h = 0, s = 0, l = (max+min)/2
    if (max !== min) {
      var d = max-min
      s = l > 0.5 ? d/(2-max-min) : d/(max+min)
      if (max === r) h = ((g-b)/d+(g<b?6:0)) * 60
      else if (max === g) h = ((b-r)/d+2) * 60
      else h = ((r-g)/d+4) * 60
    }
    return { h: Math.round(h), s: Math.round(s*100)/100, l: Math.round(l*100)/100 }
  },

  _hslToHex: function(h, s, l) {
    var c = (1-Math.abs(2*l-1))*s, x = c*(1-Math.abs(((h/60)%2)-1)), m = l-c/2
    var r1, g1, b1
    if (h < 60) { r1=c; g1=x; b1=0 }
    else if (h < 120) { r1=x; g1=c; b1=0 }
    else if (h < 180) { r1=0; g1=c; b1=x }
    else if (h < 240) { r1=0; g1=x; b1=c }
    else if (h < 300) { r1=x; g1=0; b1=c }
    else { r1=c; g1=0; b1=x }
    var toHex = function(v) {
      var hx = Math.round((v+m)*255).toString(16)
      return hx.length === 1 ? '0'+hx : hx
    }
    return '#' + toHex(r1) + toHex(g1) + toHex(b1)
  },

  onTitleInput: function(e) { this.setData({ title: e.detail.value }) },
  onNoteInput: function(e) { this.setData({ note: e.detail.value }) },
  onLinkInput: function(e) { this.setData({ link: e.detail.value }) },

  onToggleSort: function() {
    var next = !this.data.sortMode
    this.setData({ sortMode: next })
    this._syncCardFrameSize(null, next)
  },

  onEnterSort: function(e) {
    if (this.data.sortMode) return
    this.setData({ sortMode: true })
    this._syncCardFrameSize(null, true)
    wx.showToast({ title: '使用上下箭头调整顺序', icon: 'none', duration: 1500 })
  },

  onMoveCardUp: function() {
    var idx = this.data.currentIndex
    if (idx <= 0) return
    var c = storage.getCardConfig()
    var arr = c.cards
    var tmp = arr[idx]; arr[idx] = arr[idx-1]; arr[idx-1] = tmp
    storage.saveCardConfig(c)
    this.setData({ currentIndex: idx - 1 }); this.loadCards()
  },

  onMoveCardDown: function() {
    var idx = this.data.currentIndex
    var c = storage.getCardConfig()
    if (idx >= c.cards.length - 1) return
    var arr = c.cards
    var tmp = arr[idx]; arr[idx] = arr[idx+1]; arr[idx+1] = tmp
    storage.saveCardConfig(c)
    this.setData({ currentIndex: idx + 1 }); this.loadCards()
  },

  onChooseImage: function() {
    var that=this
    wx.chooseImage({ count:1, sizeType:['compressed'], success:function(r){that.setData({imagePath:r.tempFilePaths[0]})} })
  },

  onRemoveImage: function() { this.setData({ imagePath: '' }) },

  onPreviewShareLink: function() {
    var card=this.data.previewCard
    if(card&&card.link) wx.setClipboardData({data:card.link, success:function(){wx.showToast({title:'链接已复制',icon:'success'})}})
  },

  onOpenDrawer: function() { this.setData({ drawerOpen: true }) },
  onCloseDrawer: function() { this.setData({ drawerOpen: false }) },
  onDrawerNavTap: function(e) { nav.go(e.currentTarget.dataset.path, this.data.currentPath) },

  noop: function() {}
})))
