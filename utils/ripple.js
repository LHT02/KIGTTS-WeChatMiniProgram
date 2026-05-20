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

function onRippleTouchStart(e) {
  var p = touchPoint(e)
  if (!p) return
  var dataset = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset : {}
  if (dataset.rippleDisabled) return
  var size = parseInt(dataset.rippleSize, 10)
  if (!size) size = 48
  var half = size / 2
  var item = {
    id: nextRippleId(this),
    style: [
      'left:' + p.x + 'px',
      'top:' + p.y + 'px',
      'width:' + size + 'px',
      'height:' + size + 'px',
      'margin-left:-' + half + 'px',
      'margin-top:-' + half + 'px',
      'background-color:' + rippleColor(this, dataset)
    ].join(';') + ';'
  }
  var list = (this.data && this.data.rippleList ? this.data.rippleList.slice(-5) : [])
  list.push(item)
  this.setData({ rippleList: list })
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
