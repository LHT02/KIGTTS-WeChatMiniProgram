var items = [
  { path: 'pages/subtitle/index', text: '便捷字幕', label: '便捷字幕', icon: 'subtitles' },
  { path: 'pages/card/index', text: '快捷名片', label: '快捷名片', icon: 'id_card' },
  { path: 'pages/settings/drawing', text: '画板', label: '画板', icon: 'draw' },
  { path: 'pages/soundboard/index', text: '音效板', label: '音效板', icon: 'library_music' },
  { path: 'pages/settings/index', text: '设置', label: '设置', icon: 'tune' }
]
var logoGlyph = '\ue001'
var MAIN_PATH = 'pages/main/index'

function normalize(path) {
  return (path || '').replace(/^\/+/, '')
}

function goMain(target) {
  wx.redirectTo({
    url: '/' + MAIN_PATH + '?tab=' + encodeURIComponent(target),
    fail: function() {
      wx.reLaunch({ url: '/' + MAIN_PATH + '?tab=' + encodeURIComponent(target) })
    }
  })
}

function go(path, currentPath) {
  var target = normalize(path)
  if (!target) return
  var pages = getCurrentPages()
  var currentPage = pages.length ? pages[pages.length - 1] : null
  var currentRoute = currentPage && normalize(currentPage.route)

  if (currentRoute === MAIN_PATH && currentPage && typeof currentPage.switchToPath === 'function') {
    currentPage.switchToPath(target)
    return
  }

  if (target === normalize(currentPath)) {
    if (currentPage && currentPage.data && currentPage.data.drawerOpen) {
      currentPage.setData({ drawerOpen: false })
    }
    return
  }

  if (!currentRoute || currentRoute !== MAIN_PATH) {
    goMain(target)
    return
  }

  if (currentPage && currentPage.data && currentPage.data.drawerOpen) {
    currentPage.setData({ drawerOpen: false }, function() { goMain(target) })
  } else {
    goMain(target)
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
