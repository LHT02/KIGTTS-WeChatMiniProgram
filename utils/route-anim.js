function enter(page) {
  if (!page || typeof page.setData !== 'function') return
  var next = page._routeEnterFlip ? 'route-enter-b' : 'route-enter-a'
  page._routeEnterFlip = !page._routeEnterFlip
  page.setData({ routeEnterClass: '' }, function() {
    if (typeof wx !== 'undefined' && wx.nextTick) {
      wx.nextTick(function() { page.setData({ routeEnterClass: next }) })
    } else {
      setTimeout(function() { page.setData({ routeEnterClass: next }) }, 0)
    }
  })
}

module.exports = {
  enter: enter
}
