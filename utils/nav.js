var items = [
  { path: 'pages/subtitle/index', text: '便捷字幕', label: '便捷字幕', icon: 'subtitles' },
  { path: 'pages/card/index', text: '快捷名片', label: '快捷名片', icon: 'id_card' },
  { path: 'pages/settings/drawing', text: '画板', label: '画板', icon: 'draw' },
  { path: 'pages/soundboard/index', text: '音效板', label: '音效板', icon: 'library_music' },
  { path: 'pages/settings/index', text: '设置', label: '设置', icon: 'tune' }
]
var logoGlyph = '\ue001'
var routeAnim = require('./route-anim')

function normalize(path) {
  return (path || '').replace(/^\/+/, '')
}

function go(path, currentPath) {
  var target = normalize(path)
  if (!target) return
  var pages = getCurrentPages()
  var currentPage = pages.length ? pages[pages.length - 1] : null
  if (target === normalize(currentPath)) {
    if (currentPage && currentPage.data && currentPage.data.drawerOpen) {
      currentPage.setData({ drawerOpen: false })
    }
    return
  }
  var run = function() {
    routeAnim.exit(currentPage, function() {
      wx.switchTab({
        url: '/' + target,
        fail: function() {
          if (currentPage) routeAnim.enter(currentPage)
        }
      })
    })
  }
  if (currentPage && currentPage.data && currentPage.data.drawerOpen) {
    currentPage.setData({ drawerOpen: false }, run)
  } else {
    run()
  }
}

function syncTabBar(page) {
  if (!page || typeof page.getTabBar !== 'function') return
  var tabBar = page.getTabBar()
  if (tabBar && typeof tabBar.sync === 'function') tabBar.sync()
}

module.exports = {
  items: items,
  logoGlyph: logoGlyph,
  go: go,
  syncTabBar: syncTabBar
}
