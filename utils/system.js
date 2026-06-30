function legacySystemInfo() {
  try {
    if (typeof wx === 'undefined') return {}
    return wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
  } catch (e) {
    return {}
  }
}

function windowInfo() {
  try {
    if (typeof wx === 'undefined') return {}
    if (wx.getWindowInfo) return wx.getWindowInfo()
  } catch (e) {}
  return legacySystemInfo()
}

function appBaseInfo() {
  try {
    if (typeof wx === 'undefined') return {}
    if (wx.getAppBaseInfo) return wx.getAppBaseInfo()
  } catch (e) {}
  return legacySystemInfo()
}

function systemTheme() {
  try {
    var app = typeof getApp === 'function' ? getApp() : null
    var cached = app && app.globalData ? app.globalData.systemTheme : ''
    if (cached === 'light' || cached === 'dark') return cached
  } catch (e) {}
  var info = appBaseInfo()
  return info.theme === 'light' ? 'light' : 'dark'
}

function windowWidth() {
  var info = windowInfo()
  return info.windowWidth || info.screenWidth || 375
}

function windowHeight() {
  var info = windowInfo()
  return info.windowHeight || info.screenHeight || 667
}

var LARGE_SCREEN_MIN_EDGE = 600
var LARGE_SCREEN_RPX_BASE = 414

function isLargeScreen() {
  var w = windowWidth()
  var h = windowHeight()
  return Math.min(w, h) >= LARGE_SCREEN_MIN_EDGE
}

function effectiveWindowWidth() {
  var w = windowWidth()
  return isLargeScreen() ? Math.min(w, LARGE_SCREEN_RPX_BASE) : w
}

function screenClass() {
  return isLargeScreen() ? 'large-screen' : ''
}

function pixelRatio() {
  var info = windowInfo()
  return info.pixelRatio || 1
}

function screenHeight(info) {
  info = info || windowInfo()
  return info.screenHeight || info.windowHeight || 667
}

function statusBarHeight(defaultValue) {
  var info = windowInfo()
  var fallback = defaultValue == null ? 44 : defaultValue
  return info.statusBarHeight || fallback
}

function safeAreaBottom(info) {
  info = info || windowInfo()
  var screenH = screenHeight(info)
  if (info.safeArea && info.safeArea.bottom && screenH) {
    return Math.max(0, screenH - info.safeArea.bottom)
  }
  return 0
}

function rpxRatio() {
  return effectiveWindowWidth() / 750
}

function rpxToPx(rpx) {
  return rpxRatio() * rpx
}

module.exports = {
  appBaseInfo: appBaseInfo,
  systemTheme: systemTheme,
  windowInfo: windowInfo,
  windowWidth: windowWidth,
  windowHeight: windowHeight,
  effectiveWindowWidth: effectiveWindowWidth,
  isLargeScreen: isLargeScreen,
  screenClass: screenClass,
  pixelRatio: pixelRatio,
  screenHeight: screenHeight,
  statusBarHeight: statusBarHeight,
  safeAreaBottom: safeAreaBottom,
  rpxRatio: rpxRatio,
  rpxToPx: rpxToPx
}
