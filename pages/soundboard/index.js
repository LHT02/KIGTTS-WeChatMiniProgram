var storage = require('../../utils/storage')
var audio = require('../../utils/audio')
var soundFile = require('../../utils/sound-file')
var nav = require('../../utils/nav')
var theme = require('../../utils/theme')
var ripple = require('../../utils/ripple')
var routeAnim = require('../../utils/route-anim')
var system = require('../../utils/system')

Page(ripple.attach({
  data: {
    config: { groups: [], selectedGroupId: 1, layoutMode: 'list' },
    currentGroup: { items: [] },
    layoutCols: 1,
    showEditor: false, showGroupEditor: false,
    editingItem: null, editingGroup: null,
    editingTitle: '', editingWakeWord: '', editingFilePath: '', editingFileName: '', editingFileSize: 0,
    editingGroupTitle: '', editingGroupIcon: 'music_note',
    playingId: null, themeClass: theme.themeClass(), statusBarH: 44,
    routeEnterClass: '',
    navMode: theme.navMode(),
    drawerOpen: false, currentPath: 'pages/soundboard/index', navItems: nav.items,
    logoGlyph: nav.logoGlyph,
    groupIcons: ['music_note','library_music','queue_music','album','graphic_eq','equalizer','volume_up','campaign','radio','piano','notifications','alarm','celebration','movie','theaters','sports_esports','sports_soccer','directions_run','emoji_events','bolt','rocket_launch','mood','favorite','chat','work','school','restaurant','pets']
  },

  onShow: function() {
    var that = this
    var settings = storage.getSettings()
    this.setData({
      themeClass: theme.themeClass(settings),
      statusBarH: system.statusBarHeight(),
      navMode: settings.navMode || 'bottom',
      drawerOpen: (settings.navMode || 'bottom') === 'drawer' ? this.data.drawerOpen : false
    })
    nav.syncTabBar(this)
    this.loadData(function() { that._syncPlayingState() })
    routeAnim.enter(this)
  },

  onHide: function() {
    if (!audio.isPlaying() && this.data.playingId !== null) this.setData({ playingId: null })
  },

  loadData(callback) {
    var config = storage.getSoundboardConfig()
    var currentGroup = config.groups
    for (var i = 0; i < config.groups.length; i++) { if (config.groups[i].id === config.selectedGroupId) { currentGroup = config.groups[i]; break } }
    var cols = config.layoutMode === 'grid' ? 3 : 1
    this.setData({ config: config, currentGroup: currentGroup, layoutCols: cols }, function() {
      if (callback) callback()
    })
  },

  _syncPlayingState: function() {
    if (!audio.isPlaying()) {
      if (this.data.playingId !== null) this.setData({ playingId: null })
      return
    }
    var currentSrc = audio.getCurrentPlayingId()
    var items = (this.data.currentGroup && this.data.currentGroup.items) || []
    var nextId = null
    for (var i = 0; i < items.length; i++) {
      if (items[i].filePath === currentSrc) {
        nextId = items[i].id
        break
      }
    }
    if (this.data.playingId !== nextId) this.setData({ playingId: nextId })
  },

  onGroupTap(e) {
    var gid = e.currentTarget.dataset.gid
    var config = storage.getSoundboardConfig()
    config.selectedGroupId = gid
    storage.saveSoundboardConfig(config)
    var currentGroup = { items: [] }
    for (var i = 0; i < config.groups.length; i++) { if (config.groups[i].id === gid) { currentGroup = config.groups[i]; break } }
    var cols = config.layoutMode === 'grid' ? 3 : 1
    var that = this
    this.setData({ config: config, currentGroup: currentGroup, layoutCols: cols }, function() {
      that._syncPlayingState()
    })
  },

  onGroupLongPress(e) {
    var gid = e.currentTarget.dataset.gid, that = this
    var group = null
    for (var i = 0; i < this.data.config.groups.length; i++) { if (this.data.config.groups[i].id === gid) { group = this.data.config.groups[i]; break } }
    if (!group) return
    wx.showActionSheet({ itemList: ['编辑分组', '删除分组'],
      success: function(r) {
        if (r.tapIndex === 0) { that.setData({ showGroupEditor: true, editingGroup: group, editingGroupTitle: group.title, editingGroupIcon: group.icon || 'music_note' }) }
        else if (r.tapIndex === 1) {
          wx.showModal({ title: '删除分组', content: '删除"' + group.title + '"及其所有音效？', confirmColor: '#cf6679',
            success: function(rr) {
              if (!rr.confirm) return
              var config = storage.getSoundboardConfig()
              var newGroups = []
              for (var ii = 0; ii < config.groups.length; ii++) { if (config.groups[ii].id !== gid) newGroups.push(config.groups[ii]) }
              config.groups = newGroups
              if (config.selectedGroupId === gid) config.selectedGroupId = config.groups[0] ? config.groups[0].id : 0
              storage.saveSoundboardConfig(config); that.loadData()
            }
          })
        }
      }
    })
  },

  onAddGroup() { this.setData({ showGroupEditor: true, editingGroup: null, editingGroupTitle: '', editingGroupIcon: 'music_note' }) },
  onCloseGroupEditor() { this.setData({ showGroupEditor: false }) },
  onEditorGroupTitleChange(e) { this.setData({ editingGroupTitle: e.detail.value }) },
  onPickGroupIcon(e) { this.setData({ editingGroupIcon: e.currentTarget.dataset.icon }) },

  onSaveGroup() {
    var title = this.data.editingGroupTitle.trim()
    if (!title) { wx.showToast({ title: '请输入名称', icon: 'none' }); return }
    var config = storage.getSoundboardConfig()
    if (this.data.editingGroup) {
      for (var i = 0; i < config.groups.length; i++) { if (config.groups[i].id === this.data.editingGroup.id) { config.groups[i].title = title; config.groups[i].icon = this.data.editingGroupIcon; break } }
    } else { config.groups.push({ id: Date.now(), title: title, icon: this.data.editingGroupIcon, items: [] }) }
    storage.saveSoundboardConfig(config)
    this.setData({ showGroupEditor: false }); this.loadData()
  },

  onToggleLayout() {
    var config = this.data.config
    config.layoutMode = config.layoutMode === 'grid' ? 'list' : 'grid'
    storage.saveSoundboardConfig(config)
    var cols = config.layoutMode === 'grid' ? 3 : 1
    this.setData({ config: config, layoutCols: cols })
    wx.showToast({ title: config.layoutMode === 'grid' ? '网格模式' : '列表模式', icon: 'none' })
  },

  onTogglePlayback(e) {
    var item = e.currentTarget.dataset.item
    if (!item || !item.filePath) { wx.showToast({ title: '请先选择音频文件', icon: 'none' }); return }
    if (this.data.playingId === item.id) { audio.stop(); this.setData({ playingId: null }); return }
    audio.stop()
    var that = this
    audio.play(item.filePath).then(function() {
      if (that.data.playingId === item.id) that.setData({ playingId: null })
    }).catch(function() {
      that.setData({ playingId: null })
      wx.showToast({ title: '播放失败', icon: 'none' })
    })
    this.setData({ playingId: item.id })
  },

  onItemLongPress(e) {
    var idx = parseInt(e.currentTarget.dataset.index)
    var item = this.data.currentGroup.items[idx]
    if (!item) return
    var that = this
    wx.showActionSheet({ itemList: ['编辑', '删除', '上移', '下移'],
      success: function(r) {
        if (r.tapIndex === 0) { that.setData({ showEditor: true, editingItem: item, editingTitle: item.title, editingWakeWord: item.wakeWord || '', editingFilePath: item.filePath || '', editingFileName: item.fileName || '', editingFileSize: item.fileSize || 0 }) }
        else if (r.tapIndex === 1) {
          wx.showModal({ title: '确认删除', content: '删除"' + item.title + '"？', confirmColor: '#cf6679',
            success: function(rr) { if (!rr.confirm) return; that._doDeleteItem(idx); }
          })
        } else if (r.tapIndex === 2) that._doMoveItem(idx, -1)
        else if (r.tapIndex === 3) that._doMoveItem(idx, 1)
      }
    })
  },

  _doDeleteItem(idx) {
    var config = storage.getSoundboardConfig()
    for (var i = 0; i < config.groups.length; i++) { if (config.groups[i].id === this.data.config.selectedGroupId) { config.groups[i].items.splice(idx, 1); break } }
    storage.saveSoundboardConfig(config); this.loadData()
  },

  _doMoveItem(idx, dir) {
    var config = storage.getSoundboardConfig()
    var g = null
    for (var i = 0; i < config.groups.length; i++) { if (config.groups[i].id === this.data.config.selectedGroupId) { g = config.groups[i]; break } }
    if (!g) return; var ni = idx + dir; if (ni < 0 || ni >= g.items.length) return
    var t = g.items[idx]; g.items[idx] = g.items[ni]; g.items[ni] = t
    storage.saveSoundboardConfig(config); this.loadData()
  },

  onAddItem() { this.setData({ showEditor: true, editingItem: null, editingTitle: '', editingWakeWord: '', editingFilePath: '', editingFileName: '', editingFileSize: 0 }) },
  onCloseEditor() { this.setData({ showEditor: false }) },
  onEditorTitleChange(e) { this.setData({ editingTitle: e.detail.value }) },
  onEditorWakeWordChange(e) { this.setData({ editingWakeWord: e.detail.value }) },
  onChooseAudioFile() {
    var that = this
    soundFile.chooseAudioFile().then(function(file) {
      that.setData({ editingFilePath: file.filePath, editingFileName: file.fileName, editingFileSize: file.fileSize || 0 })
      wx.showToast({ title: '音频已导入', icon: 'success' })
    }).catch(function(err) {
      if (err && err.errMsg && err.errMsg.indexOf('cancel') !== -1) return
      wx.showToast({ title: '导入失败', icon: 'none' })
    })
  },

  onSaveItem() {
    var title = this.data.editingTitle.trim()
    if (!title) { wx.showToast({ title: '请输入音效名称', icon: 'none' }); return }
    if (!this.data.editingFilePath) { wx.showToast({ title: '请选择音频文件', icon: 'none' }); return }
    var config = storage.getSoundboardConfig()
    for (var i = 0; i < config.groups.length; i++) {
      if (config.groups[i].id === this.data.config.selectedGroupId) {
        if (this.data.editingItem) {
          for (var j = 0; j < config.groups[i].items.length; j++) { if (config.groups[i].items[j].id === this.data.editingItem.id) { config.groups[i].items[j].title = title; config.groups[i].items[j].wakeWord = this.data.editingWakeWord; config.groups[i].items[j].filePath = this.data.editingFilePath; config.groups[i].items[j].fileName = this.data.editingFileName; config.groups[i].items[j].fileSize = this.data.editingFileSize || 0; break } }
        } else {
          config.groups[i].items.push({ id: Date.now(), title: title, wakeWord: this.data.editingWakeWord, filePath: this.data.editingFilePath, fileName: this.data.editingFileName, fileSize: this.data.editingFileSize || 0 })
        }
        break
      }
    }
    storage.saveSoundboardConfig(config)
    this.setData({ showEditor: false }); this.loadData()
    wx.showToast({ title: '音效已保存', icon: 'success' })
  },

  onEditCurrentGroup: function() {
    var gid = this.data.config.selectedGroupId
    var group = null
    for (var i = 0; i < this.data.config.groups.length; i++) { if (this.data.config.groups[i].id === gid) { group = this.data.config.groups[i]; break } }
    if (!group) return
    this.setData({ showGroupEditor: true, editingGroup: group, editingGroupTitle: group.title, editingGroupIcon: group.icon || 'music_note' })
  },

  onOpenEditor: function() {
    wx.navigateTo({ url: '/pages/soundboard/editor' })
  },

  onOpenDrawer: function() { this.setData({ drawerOpen: true }) },
  onCloseDrawer: function() { this.setData({ drawerOpen: false }) },
  onDrawerNavTap: function(e) { nav.go(e.currentTarget.dataset.path, this.data.currentPath) },
  noop: function() {}
}))
