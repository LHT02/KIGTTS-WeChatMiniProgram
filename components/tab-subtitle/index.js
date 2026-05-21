var app = getApp()
var storage = require('../../utils/storage')
var preset = require('../../utils/preset')
var nav = require('../../utils/nav')
var tts = require('../../utils/tts')
var theme = require('../../utils/theme')
var ripple = require('../../utils/ripple')
var routeAnim = require('../../utils/route-anim')
var system = require('../../utils/system')
var initialSettings = storage.getSettings()
var PLACEHOLDER_TEXT = '我不太方便说话，请等我一下……'

var componentPage = require('../../utils/component-page')
Component(componentPage.fromPage(ripple.attach({
  data: {
    displayText: '',
    settings: initialSettings, config: {}, currentGroup: {},
    showActionButtons: true, showPreview: false, showHistory: false, showQuickList: false,
    inputText: '', autoFontSize: 72, subtitleNeedsScroll: false, textAnim: false,
    previewText: '', previewFontSize: 90, previewNeedsScroll: false, previewPlaceholder: false,
    quickInputCollapsed: !!initialSettings.quickInputCollapsed,
    keyboardActive: false, keyboardCompact: false, keyboardHeight: 0,
    ttsBusy: false,
    subtitlePlaceholder: true,
    themeClass: theme.themeClass(initialSettings),
    routeEnterClass: '',
    statusBarH: 44, navTitle: '便捷字幕',
    navMode: theme.navMode(initialSettings),
    drawerOpen: false, currentPath: 'pages/subtitle/index', navItems: nav.items,
    logoGlyph: nav.logoGlyph
  },

  onShow: function() {
    var app = getApp()
    var settings = storage.getSettings()
    var themeMode = settings.themeMode || 0
    this.setData({
      themeClass: themeMode === 1 ? 'theme-light' : '',
      statusBarH: system.statusBarHeight(),
      navMode: settings.navMode || 'bottom',
      drawerOpen: (settings.navMode || 'bottom') === 'drawer' ? this.data.drawerOpen : false
    })
    nav.syncTabBar(this)
    this._setTabBarKeyboardHidden(false)
    this._load()
    if (app.globalData.currentSubtitle) {
      this.setData({ displayText: app.globalData.currentSubtitle, subtitlePlaceholder: false })
    }
    if (!this.data.displayText || this._isPlaceholderText(this.data.displayText)) {
      this.setData({ displayText: PLACEHOLDER_TEXT, subtitlePlaceholder: true })
    }
    this._scheduleFit(80)
    routeAnim.enter(this)
  },

  onHide: function() {
    this.setData({ keyboardActive: false, keyboardCompact: false, keyboardHeight: 0 })
    this._setShellOverlay(false)
    this._setTabBarKeyboardHidden(false)
  },

  _load: function() {
    var s = storage.getSettings()
    var c = storage.getSubtitleConfig()
    var cg = { items: [] }
    for (var i = 0; i < c.groups.length; i++) { if (c.groups[i].id === c.selectedGroupId) { cg = c.groups[i]; break } }
    this.setData({ settings: s, config: c, currentGroup: cg, quickInputCollapsed: !!s.quickInputCollapsed })
  },

  onSubtitleTap: function() {
    var t = this._visibleDisplayText()
    if (!t) return
    var that = this
    this._setShellOverlay(true)
    this.setData({
      showPreview: true,
      previewText: t,
      previewPlaceholder: this._isPlaceholderText(t),
      previewFontSize: Math.round((this.data.settings.subtitleFontSize || 72) * 1.25),
      previewNeedsScroll: false
    }, function() {
      that._schedulePreviewFit(40)
    })
  },

  onClosePreview: function() {
    this._previewFitToken = ''
    this._setShellOverlay(false)
    this.setData({ showPreview: false, previewText: '', previewPlaceholder: false })
  },

  onPreviewTextLongPress: function() {
    var t = (this.data.previewText || '').trim()
    if (!t) return
    wx.setClipboardData({ data: t, success: function() { wx.showToast({ title: '已复制', icon: 'success' }) } })
  },

  onSubtitleLongPress: function() {
    var t = this._visibleDisplayText()
    if (!t || this._isPlaceholderText(t)) return
    var that = this
    wx.showActionSheet({ itemList: ['复制字幕', '清除字幕'],
      success: function(r) {
        if (r.tapIndex === 0) { wx.setClipboardData({ data: t, success: function() { wx.showToast({ title: '已复制', icon: 'success' }) } }) }
        else if (r.tapIndex === 1) { that._doClear() }
      }
    })
  },

  onFontSizeChanging: function(e) { this._setSubtitleFontSize(e.detail.value, false) },
  onFontSizeChange: function(e) { this._setSubtitleFontSize(e.detail.value, true) },
  _setSubtitleFontSize: function(value, persist) {
    var v = parseInt(value) || 72
    if (persist) storage.updateSetting('subtitleFontSize', v)
    this.data.settings.subtitleFontSize = v
    this.setData({ settings: this.data.settings, autoFontSize: v })
    this._scheduleFit(0)
  },
  onToggleBold: function() { this._tog('subtitleBold'); this._scheduleFit(0) },
  onToggleCenter: function() { this._tog('subtitleCenter') },
  onToggleRotated: function() { this._tog('subtitleRotated180'); this._scheduleFit(0) },
  onTogglePlayOnSend: function() {
    var v = !this.data.settings.subtitlePlayOnSend
    storage.updateSetting('subtitlePlayOnSend', v)
    this.data.settings.subtitlePlayOnSend = v
    this.setData({ settings: this.data.settings })
    wx.showToast({ title: v ? '发送后朗读已开启' : '发送后朗读已关闭', icon: 'none' })
  },
  onTogglePanel: function() {
    this.setData({ showActionButtons: !this.data.showActionButtons })
  },
  onToggleQuickInput: function() {
    var v = !this.data.quickInputCollapsed
    storage.updateSetting('quickInputCollapsed', v)
    this.data.settings.quickInputCollapsed = v
    this.setData({ quickInputCollapsed: v, settings: this.data.settings })
  },
  _tog: function(k) {
    var v = !this.data.settings[k]; storage.updateSetting(k, v)
    this.data.settings[k] = v
    this.setData({ settings: this.data.settings })
  },

  onEditGroupMain: function() {
    wx.navigateTo({ url: '/pages/subtitle/editor?gid=' + this.data.config.selectedGroupId })
  },

  onClearScreen: function() { this._doClear() },

  _doClear: function() {
    var that = this
    wx.showModal({ title: '确认清除', content: '要清空当前字幕显示吗？', confirmColor: '#cf6679',
      success: function(r) {
        if (!r.confirm) return
        that._animateSubtitleText({
          displayText: PLACEHOLDER_TEXT,
          subtitlePlaceholder: true,
          autoFontSize: that.data.settings.subtitleFontSize || 72,
          subtitleNeedsScroll: false
        }, function() {
          that._scheduleFit(0)
        })
        app.globalData.currentSubtitle = ''
      }
    })
  },

  onShowHistory: function() {
    var h = storage.getSubtitleHistory(), that = this
    var mapped = []
    for (var i = 0; i < h.length; i++) { mapped.push({ text: h[i].text, time: h[i].time, _idx: i, timeStr: that._fmt(h[i].time) }) }
    this.setData({ showHistory: true, history: mapped })
  },
  onCloseHistory: function() { this.setData({ showHistory: false }) },
  onHistoryTap: function(e) {
    var t = e.currentTarget.dataset.text
    this.setData({ showHistory: false })
    this._applySubtitleText(t, false)
  },
  onHistoryLongPress: function(e) {
    var t = e.currentTarget.dataset.text, that = this
    wx.showActionSheet({ itemList: ['复制', '删除此条'],
      success: function(r) {
        if (r.tapIndex === 0) { wx.setClipboardData({ data: t, success: function() { wx.showToast({ title: '已复制', icon: 'success' }) } }) }
        else if (r.tapIndex === 1) {
          wx.showModal({ title: '删除记录', content: '删除这条历史记录？', confirmColor: '#cf6679',
            success: function(rr) { if (!rr.confirm) return; storage.deleteSubtitleHistory(t); that._refreshHistory() }
          })
        }
      }
    })
  },
  _refreshHistory: function() {
    var that = this
    var h = storage.getSubtitleHistory()
    var mapped = []
    for (var i = 0; i < h.length; i++) { mapped.push({ text: h[i].text, time: h[i].time, _idx: i, timeStr: that._fmt(h[i].time) }) }
    this.setData({ history: mapped })
  },
  onClearHistory: function() {
    var that = this
    wx.showModal({ title: '确认清空', content: '清空所有历史记录？', confirmColor: '#cf6679',
      success: function(r) { if (r.confirm) { storage.clearSubtitleHistory(); that.setData({ showHistory: false }) } }
    })
  },

  onSelectGroup: function(e) {
    var gid = e.currentTarget.dataset.gid
    var c2 = this.data.config
    c2.selectedGroupId = gid
    storage.saveSubtitleConfig(c2)
    var cg = { items: [] }
    for (var i = 0; i < c2.groups.length; i++) { if (c2.groups[i].id === gid) { cg = c2.groups[i]; break } }
    this.setData({ config: c2, currentGroup: cg })
  },

  onGroupLongPress: function(e) {
    var gid = e.currentTarget.dataset.gid, that = this
    wx.showActionSheet({ itemList: ['编辑分组', '添加分组', '管理快捷文本', '删除分组'],
      success: function(r) {
        if (r.tapIndex === 0) wx.navigateTo({ url: '/pages/subtitle/editor?gid=' + gid })
        else if (r.tapIndex === 1) wx.navigateTo({ url: '/pages/subtitle/editor?gid=0' })
        else if (r.tapIndex === 2) wx.navigateTo({ url: '/pages/subtitle/editor?gid=' + gid })
        else if (r.tapIndex === 3) that._delGroup(gid)
      }
    })
  },

  _delGroup: function(gid) {
    var that = this, gname = ''
    for (var i = 0; i < this.data.config.groups.length; i++) { if (this.data.config.groups[i].id === gid) { gname = this.data.config.groups[i].title; break } }
    wx.showModal({ title: '删除分组', content: '删除"' + gname + '"及其所有快捷文本？', confirmColor: '#cf6679',
      success: function(r) {
        if (!r.confirm) return
        var c2 = that.data.config
        var newGroups = []
        for (var ii = 0; ii < c2.groups.length; ii++) { if (c2.groups[ii].id !== gid) newGroups.push(c2.groups[ii]) }
        c2.groups = newGroups
        if (c2.selectedGroupId === gid) c2.selectedGroupId = c2.groups[0] ? c2.groups[0].id : 0
        storage.saveSubtitleConfig(c2)
        var cg = { items: [] }
        for (var jj = 0; jj < c2.groups.length; jj++) { if (c2.groups[jj].id === c2.selectedGroupId) { cg = c2.groups[jj]; break } }
        that.setData({ config: c2, currentGroup: cg })
      }
    })
  },

  onAddGroup: function() { wx.navigateTo({ url: '/pages/subtitle/editor?gid=0' }) },

  onQuickTextTap: function(e) {
    var t = e.currentTarget.dataset.text
    if (!t) return
    this._applySubtitleText(t, this._shouldSpeakOnSend())
  },

  onQuickTextLongPress: function(e) {
    this.setData({ showQuickList: true })
  },

  onCloseQuickList: function() { this.setData({ showQuickList: false }) },
  onQuickListItemTap: function(e) {
    var t = e.currentTarget.dataset.text
    this.setData({ showQuickList: false })
    this._applySubtitleText(t, this._shouldSpeakOnSend())
  },
  onQuickListManage: function() {
    this.setData({ showQuickList: false })
    this.onManageEditor()
  },

  _delItem: function(id) { var that = this
    wx.showModal({ title: '确认删除', content: '删除这条快捷文本？', confirmColor: '#cf6679',
      success: function(r) { if (!r.confirm) return; that._doDelItem(id) }
    })
  },
  _doDelItem: function(id) {
    var c2 = this.data.config
    for (var i = 0; i < c2.groups.length; i++) {
      if (c2.groups[i].id === c2.selectedGroupId) {
        var newItems = []
        for (var j = 0; j < c2.groups[i].items.length; j++) { if (c2.groups[i].items[j].id !== id) newItems.push(c2.groups[i].items[j]) }
        c2.groups[i].items = newItems; break
      }
    }
    storage.saveSubtitleConfig(c2)
    var cg = { items: [] }
    for (var ii = 0; ii < c2.groups.length; ii++) { if (c2.groups[ii].id === c2.selectedGroupId) { cg = c2.groups[ii]; break } }
    this.setData({ config: c2, currentGroup: cg })
  },

  _moveItem: function(idx, dir) {
    var c2 = this.data.config
    for (var i = 0; i < c2.groups.length; i++) {
      if (c2.groups[i].id === c2.selectedGroupId) {
        var ni = idx + dir; if (ni < 0 || ni >= c2.groups[i].items.length) return
        var t = c2.groups[i].items[idx]; c2.groups[i].items[idx] = c2.groups[i].items[ni]; c2.groups[i].items[ni] = t
        break
      }
    }
    storage.saveSubtitleConfig(c2)
    var cg = { items: [] }
    for (var ii = 0; ii < c2.groups.length; ii++) { if (c2.groups[ii].id === c2.selectedGroupId) { cg = c2.groups[ii]; break } }
    this.setData({ config: c2, currentGroup: cg })
  },

  onInputChange: function(e) {
    this.setData({ inputText: e.detail.value })
    if (this.data.keyboardCompact) {
      this._pulseSubtitleText()
      this._scheduleFit(0)
    }
  },
  onInputFocus: function(e) {
    this.setData({ keyboardActive: true })
    this._setTabBarKeyboardHidden(true)
    this._updateKeyboardCompact(e && e.detail ? e.detail.height : 0)
  },
  onInputBlur: function() {
    var that = this
    this._setTabBarKeyboardHidden(false)
    this.setData({ keyboardActive: false, keyboardCompact: false, keyboardHeight: 0 }, function() {
      that._scheduleFit(80)
    })
  },
  onKeyboardHeightChange: function(e) {
    this._updateKeyboardCompact(e && e.detail ? e.detail.height : 0)
  },
  onInputConfirm: function() { this._send(this.data.inputText) },
  onSendText: function() { this._send(this.data.inputText) },

  _send: function(text) {
    var t = (text || '').trim()
    if (!t) return
    this.setData({ inputText: '', keyboardActive: false, keyboardCompact: false, keyboardHeight: 0 })
    this._setTabBarKeyboardHidden(false)
    try { wx.hideKeyboard() } catch (e) {}
    this._applySubtitleText(t, this._shouldSpeakOnSend())
  },

  _applySubtitleText: function(text, speakAfterApply) {
    var t = (text || '').trim()
    if (!t) return
    app.globalData.currentSubtitle = t
    storage.addSubtitleHistory(t)
    var that = this
    this._animateSubtitleText({ displayText: t, subtitlePlaceholder: false }, function() {
      that._scheduleFit(0)
      if (speakAfterApply) that._speak(t)
    })
  },

  _visibleDisplayText: function() {
    if (this.data.keyboardCompact) return this.data.inputText || ''
    return this.data.displayText
  },

  _animateSubtitleText: function(updates, done) {
    var that = this
    if (this._textAnimTimer) clearTimeout(this._textAnimTimer)
    this.setData({ textAnim: false })
    wx.nextTick(function() {
      var next = updates || {}
      if (next.displayText !== undefined && next.subtitlePlaceholder === undefined) {
        next.subtitlePlaceholder = that._isPlaceholderText(next.displayText)
      }
      next.textAnim = true
      that.setData(next, done)
      that._textAnimTimer = setTimeout(function() {
        that.setData({ textAnim: false })
      }, 220)
    })
  },

  _pulseSubtitleText: function() {
    var that = this
    if (this._textAnimTimer) clearTimeout(this._textAnimTimer)
    this.setData({ textAnim: false })
    wx.nextTick(function() {
      that.setData({ textAnim: true })
      that._textAnimTimer = setTimeout(function() {
        that.setData({ textAnim: false })
      }, 180)
    })
  },

  _updateKeyboardCompact: function(height) {
    var h = height || 0
    var compact = !!this.data.keyboardActive || h > 0
    var that = this
    this._setTabBarKeyboardHidden(compact)
    this.setData({ keyboardHeight: h, keyboardCompact: compact }, function() {
      that._scheduleFit(0)
    })
  },

  _setTabBarKeyboardHidden: function(hidden) {
    try {
      var tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null
      if (tabBar && typeof tabBar.setKeyboardHidden === 'function') tabBar.setKeyboardHidden(hidden)
    } catch (e) {}
  },

  _shouldSpeakOnSend: function() {
    return !!(this.data.settings && this.data.settings.ttsEnabled && this.data.settings.subtitlePlayOnSend)
  },

  onSpeakCurrent: function() {
    var t = (this.data.displayText || '').trim()
    if (!t || this._isPlaceholderText(t)) {
      wx.showToast({ title: '没有可朗读的字幕', icon: 'none' })
      return
    }
    this._speak(t)
  },

  _speak: function(text) {
    if (!this.data.settings.ttsEnabled) {
      wx.showToast({ title: '语音播报已关闭', icon: 'none' })
      return
    }
    var that = this
    this.setData({ ttsBusy: true })
    tts.speak(text).then(function() {
      that.setData({ ttsBusy: false })
    }).catch(function(err) {
      that.setData({ ttsBusy: false })
      wx.showToast({ title: (err && err.message) || '语音合成失败', icon: 'none' })
    })
  },

  onManageEditor: function() { wx.navigateTo({ url: '/pages/subtitle/editor?gid=' + this.data.config.selectedGroupId }) },

  onImportPreset: function() {
    var that = this
    preset.chooseAndImportPreset().then(function(result) {
      if (result.type === 'subtitle' || result.type === 'all') {
        that._load()
        wx.showToast({ title: '字幕预设已导入', icon: 'success' })
      }
    }).catch(function() {
      wx.showToast({ title: '导入取消或格式错误', icon: 'none' })
    })
  },

  onExportPreset: function() {
    var data = preset.exportSubtitlePreset()
    wx.setClipboardData({
      data: JSON.stringify(data, null, 2),
      success: function() { wx.showToast({ title: '字幕预设已复制到剪贴板', icon: 'success' }) }
    })
  },

  _scheduleFit: function(delay) {
    var that = this
    var token = Date.now() + '_' + Math.random()
    this._fitToken = token
    setTimeout(function() {
      if (that._fitToken !== token) return
      that._fitFont()
    }, delay || 0)
  },

  _rpxRatio: function() {
    return system.rpxRatio()
  },

  _charWidthFactor: function(code, ch) {
    if (code >= 0xD800 && code <= 0xDFFF) return 1.05
    if (code >= 0x2E80) return 1
    if (/\s/.test(ch)) return 0.34
    if (/[ilI1\.,'`|!:\;]/.test(ch)) return 0.32
    if (/[mwMW@#%&]/.test(ch)) return 0.88
    if (/[A-Z]/.test(ch)) return 0.66
    if (/[0-9]/.test(ch)) return 0.58
    if (/[a-z]/.test(ch)) return 0.56
    return 0.5
  },

  _getMeasureContext: function(fontSize, bold, ratio) {
    try {
      if (!this._measureCanvas && wx.createOffscreenCanvas) {
        this._measureCanvas = wx.createOffscreenCanvas({ type: '2d', width: 1, height: 1 })
        this._measureCtx = this._measureCanvas.getContext('2d')
      }
      if (!this._measureCtx) return null
      this._measureCtx.font = (bold ? '600 ' : '400 ') + Math.max(1, fontSize * ratio) + 'px sans-serif'
      return this._measureCtx
    } catch (e) {
      return null
    }
  },

  _measureUnitWidth: function(ctx, unit, fontSize, bold, ratio) {
    if (ctx && ctx.measureText) {
      try {
        var measured = ctx.measureText(unit).width / ratio
        if (measured > 0) return measured
      } catch (e) {}
    }
    return fontSize * this._charWidthFactor(unit.charCodeAt(0), unit) * (bold ? 1.04 : 1)
  },

  _measureWrappedText: function(text, fontSize, maxWidth, lineHeight, bold) {
    var ratio = this._rpxRatio()
    var ctx = this._getMeasureContext(fontSize, bold, ratio)
    var widthCache = {}
    var paragraphs = String(text || '').replace(/\r\n/g, '\n').split('\n')
    var lines = 0
    var widest = 0
    for (var p = 0; p < paragraphs.length; p++) {
      var lineWidth = 0
      var chars = paragraphs[p]
      if (!chars) {
        lines++
        continue
      }
      var units = Array.from(chars)
      for (var i = 0; i < units.length; i++) {
        var ch = units[i]
        var w = widthCache[ch]
        if (w == null) {
          w = this._measureUnitWidth(ctx, ch, fontSize, bold, ratio)
          widthCache[ch] = w
        }
        if (lineWidth > 0 && lineWidth + w > maxWidth) {
          widest = Math.max(widest, lineWidth)
          lines++
          lineWidth = w
        } else {
          lineWidth += w
        }
      }
      widest = Math.max(widest, lineWidth)
      lines++
    }
    return {
      width: widest,
      height: lines * fontSize * lineHeight,
      lines: lines
    }
  },

  _calcFitSize: function(rect, text, baseSize, options) {
    options = options || {}
    var ratio = this._rpxRatio()
    var rectW = rect.width / ratio
    var rectH = rect.height / ratio
    var padW = options.padW == null ? 56 : options.padW
    var padH = options.padH == null ? 12 : options.padH
    var availW = Math.max(rectW - padW, 40)
    var availH = Math.max(rectH - padH, 40)
    var requestedMax = Math.max(28, baseSize || 72)
    var minSize = Math.min(options.minSize || 28, requestedMax)
    var lineHeight = options.lineHeight || 1.15
    var bold = !!(this.data.settings && this.data.settings.subtitleBold)
    var autoFit = options.forceAutoFit ? true : !(this.data.settings && this.data.settings.subtitleAutoFit === false)
    var source = String(text || '').trim()
    if (!source) return { size: requestedMax, needsScroll: false }
    if (!autoFit) return { size: requestedMax, needsScroll: true }
    var dynamicMax = options.maxSize ? Math.max(minSize, options.maxSize) : Math.min(260, Math.max(minSize, requestedMax))

    var fits = function(size) {
      var m = this._measureWrappedText(source, size, availW, lineHeight, bold)
      return m.width <= availW + 0.5 && m.height <= availH + 0.5
    }.bind(this)

    var minMeasure = this._measureWrappedText(source, minSize, availW, lineHeight, bold)
    if (minMeasure.height > availH || minMeasure.width > availW + 0.5) {
      return { size: minSize, needsScroll: true }
    }

    var low = minSize
    var high = dynamicMax
    var best = minSize
    for (var i = 0; i < 16; i++) {
      var mid = (low + high) / 2
      if (fits(mid)) {
        best = mid
        low = mid
      } else {
        high = mid
      }
    }
    return { size: Math.max(minSize, Math.floor(best)), needsScroll: false }
  },

  _fitFont: function() {
    var that = this
    var text = this._visibleDisplayText()
    var baseSize = this.data.settings.subtitleFontSize || 72
    if (!text) {
      this.setData({ autoFontSize: baseSize, subtitleNeedsScroll: false }); return
    }
    var sel = '.subtitle-text-wrap'
    wx.createSelectorQuery().in(that).select(sel).boundingClientRect(function(rect) {
      if (!rect || rect.width < 40 || rect.height < 40) {
        setTimeout(function() { that._fitFont() }, 120)
        return
      }
      var fit = that._calcFitSize(rect, text, baseSize)
      that.setData({ autoFontSize: fit.size, subtitleNeedsScroll: fit.needsScroll })
    }).exec()
  },

  _schedulePreviewFit: function(delay) {
    var that = this
    var token = Date.now() + '_' + Math.random()
    this._previewFitToken = token
    setTimeout(function() {
      if (that._previewFitToken !== token || !that.data.showPreview) return
      that._fitPreviewFont()
    }, delay || 0)
  },

  _fitPreviewFont: function() {
    var that = this
    var text = (this.data.previewText || '').trim()
    var baseSize = Math.round((this.data.settings.subtitleFontSize || 72) * 1.25)
    if (!text) {
      this.setData({ previewFontSize: baseSize, previewNeedsScroll: false })
      return
    }
    wx.createSelectorQuery().in(that).select('.preview-text-wrap').boundingClientRect(function(rect) {
      if (!rect || rect.width < 40 || rect.height < 40) {
        setTimeout(function() { if (that.data.showPreview) that._fitPreviewFont() }, 120)
        return
      }
      var fit = that._calcFitSize(rect, text, baseSize, {
        forceAutoFit: true,
        minSize: 32,
        maxSize: Math.min(320, Math.max(180, baseSize * 1.4)),
        padW: 48,
        padH: 16,
        lineHeight: 1.18
      })
      that.setData({ previewFontSize: fit.size, previewNeedsScroll: fit.needsScroll })
    }).exec()
  },

  _fmt: function(ts) {
    var d = new Date(ts)
    function pad(n) { return n < 10 ? '0' + n : '' + n }
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
  },

  _isPlaceholderText: function(text) {
    return String(text || '').trim() === PLACEHOLDER_TEXT
  },

  onOpenDrawer: function() { this.setData({ drawerOpen: true }) },
  onCloseDrawer: function() { this.setData({ drawerOpen: false }) },
  onDrawerNavTap: function(e) { nav.go(e.currentTarget.dataset.path, this.data.currentPath) },
  _setShellOverlay: function(open) {
    if (typeof this.triggerEvent === 'function') {
      this.triggerEvent('shelloverlay', { open: !!open }, { bubbles: true, composed: true })
    }
  },

  noop: function() {}
})))
