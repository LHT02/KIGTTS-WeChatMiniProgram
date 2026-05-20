var items = [
  { path: 'pages/subtitle/index', text: '便捷字幕', label: '便捷字幕', icon: 'subtitles' },
  { path: 'pages/card/index', text: '快捷名片', label: '快捷名片', icon: 'id_card' },
  { path: 'pages/settings/drawing', text: '画板', label: '画板', icon: 'draw' },
  { path: 'pages/soundboard/index', text: '音效板', label: '音效板', icon: 'library_music' },
  { path: 'pages/settings/index', text: '设置', label: '设置', icon: 'tune' }
]
var logoGlyph = '\ue001'

function normalize(path) {
  return (path || '').replace(/^\/+/, '')
}

function go(path, currentPath) {
  var target = normalize(path)
  if (!target) return
  if (target === normalize(currentPath)) return
  wx.switchTab({ url: '/' + target })
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
