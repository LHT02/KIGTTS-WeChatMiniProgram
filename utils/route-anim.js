var ENTER_DURATION = 180
var EXIT_DURATION = 160

function nextTick(fn) {
  if (typeof wx !== 'undefined' && wx.nextTick) {
    wx.nextTick(fn)
  } else {
    setTimeout(fn, 0)
  }
}

function clearExitTimer(page) {
  if (page && page._routeExitTimer) {
    clearTimeout(page._routeExitTimer)
    page._routeExitTimer = null
  }
}

function applyClass(page, className, duration, done) {
  if (!page || typeof page.setData !== 'function') {
    if (done) done()
    return null
  }
  page.setData({ routeEnterClass: '' }, function() {
    nextTick(function() {
      page.setData({ routeEnterClass: className })
      if (done) {
        page._routeExitTimer = setTimeout(function() {
          page._routeExitTimer = null
          done()
        }, duration)
      }
    })
  })
  return page._routeExitTimer
}

function enter(page) {
  if (!page || typeof page.setData !== 'function') return
  clearExitTimer(page)
  page._routeExitToken = (page._routeExitToken || 0) + 1
  var next = page._routeEnterFlip ? 'route-enter-b' : 'route-enter-a'
  page._routeEnterFlip = !page._routeEnterFlip
  applyClass(page, next, ENTER_DURATION)
}

function exit(page, done) {
  if (!page || typeof page.setData !== 'function') {
    if (done) done()
    return
  }
  clearExitTimer(page)
  page._routeExitToken = (page._routeExitToken || 0) + 1
  var token = page._routeExitToken
  var next = page._routeExitFlip ? 'route-exit-b' : 'route-exit-a'
  page._routeExitFlip = !page._routeExitFlip
  applyClass(page, next, EXIT_DURATION, function() {
    if (page._routeExitToken !== token) return
    if (done) done()
  })
}

module.exports = {
  enter: enter,
  exit: exit,
  EXIT_DURATION: EXIT_DURATION
}
