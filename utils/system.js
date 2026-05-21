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

function windowWidth() {
  var info = windowInfo()
  return info.windowWidth || info.screenWidth || 375
}

function windowHeight() {
  var info = windowInfo()
  return info.windowHeight || info.screenHeight || 667
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
  return windowWidth() / 750
}

function rpxToPx(rpx) {
  return rpxRatio() * rpx
}

module.exports = {
  windowInfo: windowInfo,
  windowWidth: windowWidth,
  windowHeight: windowHeight,
  screenHeight: screenHeight,
  statusBarHeight: statusBarHeight,
  safeAreaBottom: safeAreaBottom,
  rpxRatio: rpxRatio,
  rpxToPx: rpxToPx
}
