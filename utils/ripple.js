function nextRippleId(page) {
  page._rippleId = (page._rippleId || 0) + 1
  return 'ripple-' + page._rippleId
}

function touchPoint(e) {
  var t = e && e.touches && e.touches[0]
  if (!t && e && e.changedTouches) t = e.changedTouches[0]
  if (!t && e && e.detail) t = e.detail
  if (!t) return null
  var x = t.clientX != null ? t.clientX : (t.pageX != null ? t.pageX : t.x)
  var y = t.clientY != null ? t.clientY : (t.pageY != null ? t.pageY : t.y)
  if (x == null || y == null) return null
  return { x: x, y: y }
}

function rippleColor(page, dataset) {
  if (dataset && dataset.rippleColor) return dataset.rippleColor
  return page.data && page.data.themeClass === 'theme-light' ? 'rgb(0,0,0)' : 'rgb(255,255,255)'
}

var RIPPLE_SELECTOR = [
  '.btn-filled', '.btn-outlined', '.btn-text',
  '.btn-filled-sm', '.btn-outlined-sm', '.btn-text-sm',
  '.icon-btn', '.icon-btn-sm',
  '.md-chip', '.group-chip', '.group-tab', '.quick-chip', '.list-item',
  '.send-btn', '.group-edit-segment', '.card-toolbar-toggle',
  '.btn-micro', '.card-edit-btn', '.link-icon-btn', '.icon-chip',
  '.quick-list-item', '.sheet-list-item', '.sound-card',
  '.preview-close-btn', '.nav-back', '.tool-toggle', '.item-row',
  '.icon-cell', '.color-dot', '.md1-switch', '.icon-row',
  '.add-card-placeholder', '.name-card', '.tab-item'
].join(',')

function queryRects(page, done) {
  try {
    var query = page.createSelectorQuery ? page.createSelectorQuery() : wx.createSelectorQuery().in(page)
    query.selectAll(RIPPLE_SELECTOR).boundingClientRect(function(rects) {
      done(rects || [])
    }).exec()
  } catch (e) {
    done([])
  }
}

function contains(rect, p) {
  if (!rect || !p) return false
  var right = rect.right != null ? rect.right : rect.left + rect.width
  var bottom = rect.bottom != null ? rect.bottom : rect.top + rect.height
  return p.x >= rect.left && p.x <= right &&
    p.y >= rect.top && p.y <= bottom
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
    right: p.x + half,
    bottom: p.y + half,
    width: size,
    height: size
  }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function rippleDiameter(rect, x, y, dataset) {
  var fixed = parseInt(dataset && dataset.rippleSize, 10)
  if (fixed) return fixed
  var w = rect.width || 48
  var h = rect.height || 48
  var dx = Math.max(x, w - x)
  var dy = Math.max(y, h - y)
  return Math.ceil(Math.sqrt(dx * dx + dy * dy) * 2)
}

function clipRadius(rect, dataset) {
  if (dataset && dataset.rippleRadius) return dataset.rippleRadius
  var w = rect.width || 0
  var h = rect.height || 0
  if (Math.abs(w - h) <= 2 && w <= 56) return '50%'
  return '4px'
}

function addRipple(page, p, dataset, rect) {
  rect = rect || fallbackRect(p, parseInt(dataset.rippleSize, 10) || 48)
  var localX = clamp(p.x - rect.left, 0, rect.width || 0)
  var localY = clamp(p.y - rect.top, 0, rect.height || 0)
  var size = rippleDiameter(rect, localX, localY, dataset)
  var half = size / 2
  var item = {
    id: nextRippleId(page),
    clipStyle: [
      'left:' + rect.left + 'px',
      'top:' + rect.top + 'px',
      'width:' + rect.width + 'px',
      'height:' + rect.height + 'px',
      'border-radius:' + clipRadius(rect, dataset)
    ].join(';') + ';',
    style: [
      'left:' + localX + 'px',
      'top:' + localY + 'px',
      'width:' + size + 'px',
      'height:' + size + 'px',
      'margin-left:-' + half + 'px',
      'margin-top:-' + half + 'px',
      'background-color:' + rippleColor(page, dataset)
    ].join(';') + ';'
  }
  var list = (page.data && page.data.rippleList ? page.data.rippleList.slice(-5) : [])
  list.push(item)
  page.setData({ rippleList: list })
}

function onRippleTouchStart(e) {
  var p = touchPoint(e)
  if (!p) return
  var dataset = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset : {}
  if (dataset.rippleDisabled) return
  var page = this
  queryRects(page, function(rects) {
    addRipple(page, p, dataset, pickRect(rects, p))
  })
}

function onRippleAnimationEnd(e) {
  var id = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.id : ''
  var list = this.data && this.data.rippleList ? this.data.rippleList : []
  if (!id) {
    this.setData({ rippleList: list.slice(1) })
    return
  }
  var next = []
  for (var i = 0; i < list.length; i++) {
    if (list[i].id !== id) next.push(list[i])
  }
  this.setData({ rippleList: next })
}

function attach(options) {
  options = options || {}
  options.data = Object.assign({ rippleList: [] }, options.data || {})
  options.onRippleTouchStart = options.onRippleTouchStart || onRippleTouchStart
  options.onRippleAnimationEnd = options.onRippleAnimationEnd || onRippleAnimationEnd
  return options
}

module.exports = {
  attach: attach,
  methods: {
    onRippleTouchStart: onRippleTouchStart,
    onRippleAnimationEnd: onRippleAnimationEnd
  }
}
