var storage = require('./storage')

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

function themeClass(settings) {
  var s = settings || getSettings()
  return (s.themeMode || 0) === 1 ? 'theme-light' : ''
}

function navMode(settings) {
  var s = settings || getSettings()
  return s.navMode || 'bottom'
}

module.exports = {
  getSettings: getSettings,
  themeClass: themeClass,
  navMode: navMode
}
