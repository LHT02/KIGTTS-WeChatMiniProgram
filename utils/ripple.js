function nextRippleId(page) {
  page._rippleId = (page._rippleId || 0) + 1
  return 'ripple-' + page._rippleId
}

var SCROLL_SUPPRESS_MS = 180

var RIPPLE_SELECTOR = [
  '.btn-filled', '.btn-outlined', '.btn-text',
  '.btn-filled-sm', '.btn-outlined-sm', '.btn-text-sm',
  '.icon-btn', '.icon-btn-sm',
  '.md-chip', '.group-chip', '.group-tab', '.quick-chip', '.list-item',
  '.send-btn', '.group-edit-segment', '.card-toolbar-toggle',
  '.btn-micro', '.card-edit-btn', '.link-icon-btn', '.icon-chip',
  '.quick-list-item', '.sheet-list-item', '.sound-card',
  '.preview-close-btn',
  '.nav-back', '.tool-toggle', '.item-row', '.icon-cell', '.color-dot',
  '.md1-switch', '.icon-row', '.add-card-placeholder', '.name-card', '.tab-item'
].join(',')

function eventPoint(e) {
  var p = e && e.detail
  if (p && p.x != null && p.y != null) return { x: p.x, y: p.y }

  var t = e && e.changedTouches && e.changedTouches[0]
  if (!t && e && e.touches) t = e.touches[0]
  if (!t) return null

  var x = t.clientX != null ? t.clientX : (t.pageX != null ? t.pageX : t.x)
  var y = t.clientY != null ? t.clientY : (t.pageY != null ? t.pageY : t.y)
  if (x == null || y == null) return null
  return { x: x, y: y }
}

function queryTargets(page, done) {
  try {
    var query = page.createSelectorQuery ? page.createSelectorQuery() : wx.createSelectorQuery().in(page)
    query.selectAll(RIPPLE_SELECTOR).fields({
      size: true,
      rect: true,
      computedStyle: ['backgroundColor']
    }, function(rects) {
      done(rects || [])
    }).exec()
  } catch (e) {
    done([])
  }
}

function rectRight(rect) {
  return rect.right != null ? rect.right : rect.left + rect.width
}

function rectBottom(rect) {
  return rect.bottom != null ? rect.bottom : rect.top + rect.height
}

function contains(rect, p) {
  if (!rect || !p) return false
  return p.x >= rect.left && p.x <= rectRight(rect) &&
    p.y >= rect.top && p.y <= rectBottom(rect)
}

function pickRect(rects, p) {
  var picked = null
  var pickedArea = 0
  for (var i = 0; i < rects.length; i++) {
    var rect = rects[i]
    if (!contains(rect, p)) continue
    var area = (rect.width || 0) * (rect.height || 0)
    if (!picked || area < pickedArea) {
      picked = rect
      pickedArea = area
    }
  }
  return picked
}

function fallbackRect(p, size) {
  var half = size / 2
  return {
    left: p.x - half,
    top: p.y - half,
    width: size,
    height: size,
    backgroundColor: ''
  }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function parseRgba(color) {
  if (!color || color === 'transparent') return null
  var match = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/.exec(color)
  if (!match) return null
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] == null ? 1 : parseFloat(match[4])
  }
}

function rgbIsLight(rgba) {
  if (!rgba || rgba.a === 0) return null
  return 0.299 * rgba.r + 0.578 * rgba.g + 0.114 * rgba.b >= 192 * rgba.a
}

function rippleColor(page, dataset, backgroundColor) {
  if (dataset && dataset.rippleColor) return dataset.rippleColor
  var isLight = rgbIsLight(parseRgba(backgroundColor))
  if (isLight != null) return isLight ? 'rgb(0,0,0)' : 'rgb(255,255,255)'
  return page.data && page.data.themeClass === 'theme-light' ? 'rgb(0,0,0)' : 'rgb(255,255,255)'
}

function rippleSize(rect, dataset) {
  var fixed = parseInt(dataset && dataset.rippleSize, 10)
  if (fixed) return fixed
  return Math.max(rect.width || 48, rect.height || 48)
}

function clipRadius(rect, dataset) {
  if (dataset && dataset.rippleRadius) return dataset.rippleRadius
  var w = rect.width || 0
  var h = rect.height || 0
  if (Math.abs(w - h) <= 2 && w <= 56) return '50%'
  return '4px'
}

function suppressTap(page) {
  if (!page) return
  page._rippleSuppressTapUntil = Date.now() + SCROLL_SUPPRESS_MS
}

function tapSuppressed(page) {
  return !!(page && page._rippleSuppressTapUntil && Date.now() < page._rippleSuppressTapUntil)
}

function addRipple(page, p, dataset, rect, hold) {
  rect = rect || fallbackRect(p, parseInt(dataset && dataset.rippleSize, 10) || 48)
  var width = rect.width || 48
  var height = rect.height || 48
  var localX = clamp(p.x - rect.left, 0, width)
  var localY = clamp(p.y - rect.top, 0, height)
  var size = rippleSize(rect, dataset)
  var half = size / 2
  var item = {
    id: nextRippleId(page),
    hold: !!hold,
    clipStyle: [
      'left:' + rect.left + 'px',
      'top:' + rect.top + 'px',
      'width:' + width + 'px',
      'height:' + height + 'px',
      'border-radius:' + clipRadius(rect, dataset)
    ].join(';') + ';',
    style: [
      'left:' + (localX - half) + 'px',
      'top:' + (localY - half) + 'px',
      'width:' + size + 'px',
      'height:' + size + 'px',
      'background-color:' + rippleColor(page, dataset, rect.backgroundColor)
    ].join(';') + ';'
  }
  var list = page.data && page.data.rippleList ? page.data.rippleList.slice(-5) : []
  list.push(item)
  page.setData({ rippleList: list })
}

function addRippleFromEvent(page, e, hold) {
  if (tapSuppressed(page) && !hold) return
  var dataset = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset : {}
  if (dataset.rippleDisabled) return
  var p = eventPoint(e)
  if (!p) return

  queryTargets(page, function(rects) {
    var rect = pickRect(rects, p)
    if (!rect) {
      if (dataset.ripple) rect = fallbackRect(p, parseInt(dataset.rippleSize, 10) || 48)
      else return
    }
    addRipple(page, p, dataset, rect, hold)
  })
}

function clearHoldRipples(page) {
  var list = page && page.data && page.data.rippleList ? page.data.rippleList : []
  if (!list.length) return
  var next = []
  for (var i = 0; i < list.length; i++) {
    if (!list[i].hold) next.push(list[i])
  }
  if (next.length !== list.length) page.setData({ rippleList: next })
}

function clearRipples(page) {
  if (page && page.data && page.data.rippleList && page.data.rippleList.length) {
    page.setData({ rippleList: [] })
  }
}

function onRippleTap(e) {
  if (this._rippleLongPressUntil && Date.now() < this._rippleLongPressUntil) return
  addRippleFromEvent(this, e, false)
}

function onRippleLongPress(e) {
  this._rippleLongPressUntil = Date.now() + 450
  addRippleFromEvent(this, e, true)
}

function onRippleTouchStart() {
}

function onRippleTouchMove() {
  suppressTap(this)
  clearHoldRipples(this)
}

function onRippleTouchEnd() {
  clearHoldRipples(this)
}

function onRippleTouchCancel() {
  suppressTap(this)
  clearHoldRipples(this)
}

function onRippleCancel() {
  clearRipples(this)
}

function onRippleScroll() {
  suppressTap(this)
  clearRipples(this)
}

function onRippleAnimationEnd(e) {
  var id = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.id : ''
  var list = this.data && this.data.rippleList ? this.data.rippleList : []
  if (!list.length) return
  if (!id) {
    this.setData({ rippleList: list.slice(1) })
    return
  }

  var next = []
  var changed = false
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      if (list[i].hold) next.push(list[i])
      else changed = true
    } else {
      next.push(list[i])
    }
  }
  if (changed) this.setData({ rippleList: next })
}

function attach(options) {
  options = options || {}
  var oldHide = options.onHide
  var oldUnload = options.onUnload
  options.data = Object.assign({ rippleList: [] }, options.data || {})
  options.onRippleTap = options.onRippleTap || onRippleTap
  options.onRippleLongPress = options.onRippleLongPress || onRippleLongPress
  options.onRippleTouchStart = options.onRippleTouchStart || onRippleTouchStart
  options.onRippleTouchMove = options.onRippleTouchMove || onRippleTouchMove
  options.onRippleTouchEnd = options.onRippleTouchEnd || onRippleTouchEnd
  options.onRippleTouchCancel = options.onRippleTouchCancel || onRippleTouchCancel
  options.onRippleCancel = options.onRippleCancel || onRippleCancel
  options.onRippleClear = options.onRippleClear || onRippleCancel
  options.onRippleScroll = options.onRippleScroll || onRippleScroll
  options.onRippleAnimationEnd = options.onRippleAnimationEnd || onRippleAnimationEnd
  options.onHide = function() {
    clearRipples(this)
    if (oldHide) oldHide.apply(this, arguments)
  }
  options.onUnload = function() {
    clearRipples(this)
    if (oldUnload) oldUnload.apply(this, arguments)
  }
  return options
}

module.exports = {
  attach: attach,
  methods: {
    onRippleTap: onRippleTap,
    onRippleLongPress: onRippleLongPress,
    onRippleTouchStart: onRippleTouchStart,
    onRippleTouchMove: onRippleTouchMove,
    onRippleTouchEnd: onRippleTouchEnd,
    onRippleTouchCancel: onRippleTouchCancel,
    onRippleCancel: onRippleCancel,
    onRippleClear: onRippleCancel,
    onRippleScroll: onRippleScroll,
    onRippleAnimationEnd: onRippleAnimationEnd
  }
}
