var storage = require('./storage')
var system = require('./system')

var THEME_FOLLOW = 0
var THEME_LIGHT = 1
var THEME_DARK = 2

function getSettings() {
  try {
    var app = typeof getApp === 'function' ? getApp() : null
    if (app && app.globalData && app.globalData.settings) return app.globalData.settings
  } catch (e) {}
  try {
    return storage.getSettings()
  } catch (e) {
    return storage.getDefaultSettings()
  }
}

function themeClass(settings, systemTheme) {
  var s = settings || getSettings()
  return isLight(s, systemTheme) ? 'theme-light' : ''
}

function normalizeThemeMode(mode) {
  mode = parseInt(mode)
  if (mode === THEME_LIGHT || mode === THEME_DARK) return mode
  return THEME_FOLLOW
}

function isLight(settings, systemTheme) {
  var s = settings || getSettings()
  var mode = normalizeThemeMode(s.themeMode)
  if (mode === THEME_LIGHT) return true
  if (mode === THEME_DARK) return false
  return (systemTheme || system.systemTheme()) === 'light'
}

function themeModeLabel(settings) {
  var s = typeof settings === 'number' ? { themeMode: settings } : (settings || getSettings())
  var mode = normalizeThemeMode(s.themeMode)
  if (mode === THEME_LIGHT) return '浅色'
  if (mode === THEME_DARK) return '深色'
  return '跟随系统（当前' + (isLight(s) ? '浅色' : '深色') + '）'
}

function themeModeName(mode) {
  mode = normalizeThemeMode(mode)
  if (mode === THEME_LIGHT) return '浅色'
  if (mode === THEME_DARK) return '深色'
  return '跟随系统'
}

function navMode(settings) {
  var s = settings || getSettings()
  return s.navMode || 'bottom'
}

module.exports = {
  THEME_FOLLOW: THEME_FOLLOW,
  THEME_LIGHT: THEME_LIGHT,
  THEME_DARK: THEME_DARK,
  getSettings: getSettings,
  themeClass: themeClass,
  isLight: isLight,
  normalizeThemeMode: normalizeThemeMode,
  themeModeLabel: themeModeLabel,
  themeModeName: themeModeName,
  navMode: navMode
}
