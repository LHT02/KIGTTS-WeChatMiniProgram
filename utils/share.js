var nav = require('./nav')

var DEFAULT_TITLE = 'KIGTTS LITE'
var MAIN_PATH = 'pages/main/index'
var activeCopyUrlHandler = null

function normalize(path) {
  return (path || '').replace(/^\/+/, '')
}

function isTabPath(path) {
  path = normalize(path)
  for (var i = 0; i < nav.items.length; i++) {
    if (nav.items[i].path === path) return true
  }
  return false
}

function tabLabel(path) {
  path = normalize(path)
  for (var i = 0; i < nav.items.length; i++) {
    if (nav.items[i].path === path) return nav.items[i].label || nav.items[i].text
  }
  return ''
}

function routeOf(page) {
  return normalize(page && page.route)
}

function activeTab(page) {
  var data = page && page.data ? page.data : {}
  if (isTabPath(data.activePath)) return data.activePath
  if (isTabPath(data.currentPath)) return data.currentPath
  var route = routeOf(page)
  if (isTabPath(route)) return route
  if (route === 'pages/settings/drawing') return route
  if (route === 'pages/subtitle/editor') return 'pages/subtitle/index'
  if (route === 'pages/soundboard/editor') return 'pages/soundboard/index'
  return 'pages/subtitle/index'
}

function shareTitle(page) {
  var data = page && page.data ? page.data : {}
  var label = data.activeTitle || data.navTitle || tabLabel(activeTab(page))
  return label ? DEFAULT_TITLE + ' - ' + label : DEFAULT_TITLE
}

function sharePath(page) {
  var tab = activeTab(page)
  if (tab && isTabPath(tab)) {
    return '/' + MAIN_PATH + '?tab=' + encodeURIComponent(tab)
  }
  return '/' + MAIN_PATH
}

function currentQuery(page) {
  var route = routeOf(page)
  if (route === MAIN_PATH) {
    var tab = activeTab(page)
    return tab && isTabPath(tab) ? 'tab=' + encodeURIComponent(tab) : ''
  }
  return ''
}

function onShareAppMessage() {
  return {
    title: shareTitle(this),
    path: sharePath(this)
  }
}

function onShareTimeline() {
  return {
    title: shareTitle(this),
    query: currentQuery(this)
  }
}

function onCopyUrl() {
  return {
    query: currentQuery(this)
  }
}

function showShareMenu() {
  try {
    if (typeof wx === 'undefined' || !wx.showShareMenu) return
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  } catch (e) {}
}

function bindCopyUrl(page) {
  try {
    if (typeof wx === 'undefined' || !wx.onCopyUrl) return
    if (activeCopyUrlHandler && wx.offCopyUrl) wx.offCopyUrl(activeCopyUrlHandler)
    var handler = function() { return onCopyUrl.call(page) }
    page._kigttsCopyUrlHandler = handler
    activeCopyUrlHandler = handler
    wx.onCopyUrl(handler)
  } catch (e) {}
}

function unbindCopyUrl(page) {
  try {
    if (!page || !page._kigttsCopyUrlHandler) return
    if (typeof wx !== 'undefined' && wx.offCopyUrl) wx.offCopyUrl(page._kigttsCopyUrlHandler)
    if (activeCopyUrlHandler === page._kigttsCopyUrlHandler) activeCopyUrlHandler = null
    page._kigttsCopyUrlHandler = null
  } catch (e) {}
}

function enable(page) {
  showShareMenu()
  bindCopyUrl(page)
}

function attach(options) {
  options = options || {}
  var oldLoad = options.onLoad
  var oldShow = options.onShow
  var oldHide = options.onHide
  var oldUnload = options.onUnload

  options.onShareAppMessage = options.onShareAppMessage || onShareAppMessage
  options.onShareTimeline = options.onShareTimeline || onShareTimeline
  options.onCopyUrl = options.onCopyUrl || onCopyUrl

  options.onLoad = function() {
    enable(this)
    if (oldLoad) return oldLoad.apply(this, arguments)
  }
  options.onShow = function() {
    enable(this)
    if (oldShow) return oldShow.apply(this, arguments)
  }
  options.onHide = function() {
    unbindCopyUrl(this)
    if (oldHide) return oldHide.apply(this, arguments)
  }
  options.onUnload = function() {
    unbindCopyUrl(this)
    if (oldUnload) return oldUnload.apply(this, arguments)
  }

  return options
}

module.exports = {
  attach: attach,
  enable: enable,
  onShareAppMessage: onShareAppMessage,
  onShareTimeline: onShareTimeline,
  onCopyUrl: onCopyUrl
}
