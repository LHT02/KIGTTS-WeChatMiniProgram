var storage = require('../../utils/storage')
var preset = require('../../utils/preset')
var theme = require('../../utils/theme')
var ripple = require('../../utils/ripple')
var soundFile = require('../../utils/sound-file')
var system = require('../../utils/system')

Page(ripple.attach({
  data: {
    config: null, groups: [], selectedGroupIdx: 0, selectedGroup: null,
    themeClass: theme.themeClass(),

    // Settings
    portraitLayout: 'list', landscapeLayout: 'grid',

    // Group editor
    editingGroupTitle: '', editingGroupIcon: 'music_note',
    showIconPicker: false,

    // Item editor
    showAddDialog: false, addTitle: '', addWakeWord: '', addFilePath: '', addFileName: '', addFileSize: 0,
    showEditDialog: false, editItemIdx: -1, editTitle: '', editWakeWord: '', editFilePath: '', editFileName: '', editFileSize: 0,
    showDeleteConfirm: false, deleteItemIdx: -1,

    // Batch operations
    batchMode: false, selectedItems: {}, batchCount: 0,
    draggingIndex: -1,

    iconList: ['music_note','library_music','queue_music','album','graphic_eq','equalizer','volume_up','campaign','radio','piano','notifications','alarm','celebration','movie','theaters','sports_esports','sports_soccer','directions_run','emoji_events','bolt','rocket_launch','mood','favorite','chat','work','school','restaurant','pets']
  },

  onLoad: function() {
    var settings = storage.getSettings()
    var sc = storage.getSoundboardConfig()
    var groups = sc.groups || []
    var sel = groups.length > 0 ? groups[0] : null
    this.setData({
      config: sc,
      groups: groups,
      selectedGroup: sel,
      selectedGroupIdx: sc.selectedGroupId ? this._findGroupIdx(sc.selectedGroupId) : 0,
      portraitLayout: sc.portraitLayout || sc.layoutMode || 'list',
      landscapeLayout: sc.landscapeLayout || sc.layoutMode || 'grid',
      editingGroupTitle: sel ? sel.title : '',
      editingGroupIcon: sel ? (sel.icon || 'music_note') : 'music_note'
    })
  },

  onShow: function() {
    var settings = storage.getSettings()
    this.setData({ themeClass: theme.themeClass(settings), statusBarH: system.statusBarHeight() })
    this._refresh()
  },

  _refresh: function() {
    var sc = storage.getSoundboardConfig()
    var groups = sc.groups || []
    var selIdx = this.data.selectedGroupIdx
    if (selIdx >= groups.length) selIdx = Math.max(0, groups.length - 1)
    var sel = groups.length > 0 ? groups[selIdx] : null
    this.setData({
      config: sc, groups: groups, selectedGroup: sel, selectedGroupIdx: selIdx,
      editingGroupTitle: sel ? sel.title : '',
      editingGroupIcon: sel ? (sel.icon || 'music_note') : 'music_note'
    })
  },

  _findGroupIdx: function(gid) {
    for (var i = 0; i < this.data.groups.length; i++) { if (this.data.groups[i].id === gid) return i }
    return 0
  },

  _save: function() {
    var sc = this.data.config
    sc.groups = this.data.groups
    sc.portraitLayout = this.data.portraitLayout
    sc.landscapeLayout = this.data.landscapeLayout
    storage.saveSoundboardConfig(sc)
  },

  // === Settings ===
  onPortraitLayoutChange: function(e) { this.setData({ portraitLayout: e.detail.value }); this._save() },
  onLandscapeLayoutChange: function(e) { this.setData({ landscapeLayout: e.detail.value }); this._save() },

  // === Groups ===
  onSelectGroup: function(e) {
    var idx = parseInt(e.currentTarget.dataset.index)
    var sel = this.data.groups[idx]
    this.setData({
      selectedGroupIdx: idx, selectedGroup: sel, batchMode: false, selectedItems: {}, batchCount: 0,
      editingGroupTitle: sel.title, editingGroupIcon: sel.icon || 'music_note'
    })
    var sc = this.data.config; sc.selectedGroupId = sel.id; storage.saveSoundboardConfig(sc)
  },

  onAddGroup: function() {
    var newGroup = { id: Date.now(), title: '新分组', icon: 'music_note', items: [] }
    var groups = this.data.groups.slice()
    groups.push(newGroup)
    this.setData({ groups: groups, selectedGroup: newGroup, selectedGroupIdx: groups.length - 1,
      editingGroupTitle: '新分组', editingGroupIcon: 'music_note' })
    this._save()
  },

  onGroupTitleInput: function(e) {
    this.setData({ editingGroupTitle: e.detail.value })
    var g = this.data.selectedGroup; if (!g) return
    g.title = e.detail.value
    for (var i = 0; i < this.data.groups.length; i++) { if (this.data.groups[i].id === g.id) { this.data.groups[i] = g; break } }
    this._save()
  },

  onOpenIconPicker: function() { this.setData({ showIconPicker: true }) },
  onCloseIconPicker: function() { this.setData({ showIconPicker: false }) },
  onPickGroupIcon: function(e) {
    var icon = e.currentTarget.dataset.icon
    this.setData({ editingGroupIcon: icon, showIconPicker: false })
    var g = this.data.selectedGroup; if (!g) return
    g.icon = icon
    this._save()
  },

  onMoveGroupLeft: function() {
    var idx = this.data.selectedGroupIdx; if (idx <= 0) return
    var groups = this.data.groups.slice()
    var tmp = groups[idx]; groups[idx] = groups[idx-1]; groups[idx-1] = tmp
    this.setData({ groups: groups, selectedGroupIdx: idx - 1, selectedGroup: groups[idx-1] })
    this._save()
  },

  onMoveGroupRight: function() {
    var idx = this.data.selectedGroupIdx; if (idx >= this.data.groups.length - 1) return
    var groups = this.data.groups.slice()
    var tmp = groups[idx]; groups[idx] = groups[idx+1]; groups[idx+1] = tmp
    this.setData({ groups: groups, selectedGroupIdx: idx + 1, selectedGroup: groups[idx+1] })
    this._save()
  },

  onDeleteGroup: function() {
    if (this.data.groups.length <= 1) { wx.showToast({ title: '至少保留一个分组', icon: 'none' }); return }
    var that = this
    wx.showModal({ title: '删除分组', content: '删除"' + (this.data.selectedGroup.title || '') + '"及其所有音效？', confirmColor: '#cf6679',
      success: function(r) {
        if (!r.confirm) return
        var groups = that.data.groups.slice()
        groups.splice(that.data.selectedGroupIdx, 1)
        var newIdx = Math.min(that.data.selectedGroupIdx, groups.length - 1)
        var sel = groups[newIdx] || null
        that.setData({ groups: groups, selectedGroup: sel, selectedGroupIdx: newIdx,
          editingGroupTitle: sel ? sel.title : '', editingGroupIcon: sel ? (sel.icon || 'music_note') : 'music_note' })
        that._save()
      }
    })
  },

  // === Items ===
  onAddItem: function() {
    this.setData({ showAddDialog: true, addTitle: '', addWakeWord: '', addFilePath: '', addFileName: '', addFileSize: 0 })
  },

  onCloseAddDialog: function() { this.setData({ showAddDialog: false }) },

  onAddTitleInput: function(e) { this.setData({ addTitle: e.detail.value }) },
  onAddWakeInput: function(e) { this.setData({ addWakeWord: e.detail.value }) },

  onConfirmAdd: function() {
    var title = (this.data.addTitle || '').trim()
    if (!title) { wx.showToast({ title: '请输入条目名', icon: 'none' }); return }
    if (!this.data.addFilePath) { wx.showToast({ title: '请选择音频文件', icon: 'none' }); return }
    var g = this.data.selectedGroup; if (!g) return
    if (!g.items) g.items = []
    g.items.push({ id: Date.now(), title: title, wakeWord: (this.data.addWakeWord || '').trim(), filePath: this.data.addFilePath, fileName: this.data.addFileName, fileSize: this.data.addFileSize || 0 })
    this.setData({ showAddDialog: false })
    this._save(); this._refresh()
  },

  onEditItem: function(e) {
    var idx = parseInt(e.currentTarget.dataset.index)
    var item = this.data.selectedGroup.items[idx]
    if (!item) return
    this.setData({ showEditDialog: true, editItemIdx: idx, editTitle: item.title || '', editWakeWord: item.wakeWord || '', editFilePath: item.filePath || '', editFileName: item.fileName || '', editFileSize: item.fileSize || 0 })
  },

  onCloseEditDialog: function() { this.setData({ showEditDialog: false }) },
  onEditTitleInput: function(e) { this.setData({ editTitle: e.detail.value }) },
  onEditWakeInput: function(e) { this.setData({ editWakeWord: e.detail.value }) },

  onConfirmEdit: function() {
    var title = (this.data.editTitle || '').trim()
    if (!title) { wx.showToast({ title: '请输入条目名', icon: 'none' }); return }
    if (!this.data.editFilePath) { wx.showToast({ title: '请选择音频文件', icon: 'none' }); return }
    var g = this.data.selectedGroup; if (!g) return
    var item = g.items[this.data.editItemIdx]
    if (item) {
      item.title = title
      item.wakeWord = (this.data.editWakeWord || '').trim()
      item.filePath = this.data.editFilePath
      item.fileName = this.data.editFileName
      item.fileSize = this.data.editFileSize || 0
    }
    this.setData({ showEditDialog: false })
    this._save(); this._refresh()
  },

  onDeleteItem: function(e) {
    var idx = parseInt(e.currentTarget.dataset.index); this.setData({ showDeleteConfirm: true, deleteItemIdx: idx })
  },

  onConfirmDeleteItem: function() {
    var g = this.data.selectedGroup; if (!g) return
    g.items.splice(this.data.deleteItemIdx, 1)
    this.setData({ showDeleteConfirm: false })
    this._save(); this._refresh()
  },

  onCancelDeleteItem: function() { this.setData({ showDeleteConfirm: false }) },

  onMoveItemUp: function(e) {
    var idx = parseInt(e.currentTarget.dataset.index); if (idx <= 0) return
    var g = this.data.selectedGroup; if (!g) return
    var tmp = g.items[idx]; g.items[idx] = g.items[idx-1]; g.items[idx-1] = tmp
    this._save(); this._refresh()
  },

  onMoveItemDown: function(e) {
    var idx = parseInt(e.currentTarget.dataset.index)
    var g = this.data.selectedGroup; if (!g) return
    if (idx >= g.items.length - 1) return
    var tmp = g.items[idx]; g.items[idx] = g.items[idx+1]; g.items[idx+1] = tmp
    this._save(); this._refresh()
  },

  onItemDragStart: function(e) {
    if (this.data.batchMode) return
    var idx = parseInt(e.currentTarget.dataset.index)
    var g = this.data.selectedGroup
    if (!g || !g.items || idx < 0 || idx >= g.items.length) return
    var touch = e.touches && e.touches[0]
    this._dragState = { index: idx, y: touch ? touch.pageY : 0 }
    this.setData({ draggingIndex: idx })
    this._vibrate()
  },

  onItemDragMove: function(e) {
    if (!this._dragState) return
    var touch = e.touches && e.touches[0]
    if (!touch) return
    var g = this.data.selectedGroup
    if (!g || !g.items) return
    var threshold = this._dragThresholdPx()
    var diff = touch.pageY - this._dragState.y
    var step = diff > threshold ? Math.floor(diff / threshold) : (diff < -threshold ? Math.ceil(diff / threshold) : 0)
    if (!step) return
    var from = this._dragState.index
    var to = Math.max(0, Math.min(g.items.length - 1, from + step))
    if (to === from) return
    var groups = this.data.groups.slice()
    var selectedGroup = Object.assign({}, groups[this.data.selectedGroupIdx])
    var items = (selectedGroup.items || []).slice()
    var moved = items.splice(from, 1)[0]
    items.splice(to, 0, moved)
    selectedGroup.items = items
    groups[this.data.selectedGroupIdx] = selectedGroup
    this._dragState.index = to
    this._dragState.y += step * threshold
    this.setData({ groups: groups, selectedGroup: selectedGroup, draggingIndex: to })
  },

  onItemDragEnd: function() {
    if (!this._dragState) return
    this._dragState = null
    this.setData({ draggingIndex: -1 })
    this._save()
  },

  _dragThresholdPx: function() {
    return Math.max(32, system.rpxToPx(76))
  },

  onChooseAudio: function(e) {
    var that = this, idx = parseInt(e.currentTarget.dataset.index)
    soundFile.chooseAudioFile().then(function(file) {
      var g = that.data.selectedGroup; if (!g) return
      var item = g.items[idx]; if (!item) return
      item.filePath = file.filePath
      item.fileName = file.fileName
      item.fileSize = file.fileSize || 0
      that._save(); that._refresh()
      wx.showToast({ title: '音频已导入', icon: 'success' })
    }).catch(function(err) {
      if (err && err.errMsg && err.errMsg.indexOf('cancel') !== -1) return
      wx.showToast({ title: '导入失败', icon: 'none' })
    })
  },

  onChooseAddAudio: function() {
    var that = this
    soundFile.chooseAudioFile().then(function(file) {
      that.setData({ addFilePath: file.filePath, addFileName: file.fileName, addFileSize: file.fileSize || 0 })
      wx.showToast({ title: '音频已导入', icon: 'success' })
    }).catch(function(err) {
      if (err && err.errMsg && err.errMsg.indexOf('cancel') !== -1) return
      wx.showToast({ title: '导入失败', icon: 'none' })
    })
  },

  onChooseEditAudio: function() {
    var that = this
    soundFile.chooseAudioFile().then(function(file) {
      that.setData({ editFilePath: file.filePath, editFileName: file.fileName, editFileSize: file.fileSize || 0 })
      wx.showToast({ title: '音频已导入', icon: 'success' })
    }).catch(function(err) {
      if (err && err.errMsg && err.errMsg.indexOf('cancel') !== -1) return
      wx.showToast({ title: '导入失败', icon: 'none' })
    })
  },

  // === Batch ===
  onItemRowTap: function(e) {
    if (!this.data.batchMode) return
    this.onToggleBatchItem(e)
  },

  onItemLongPress: function(e) {
    this.onEnterBatch(e)
  },

  onEnterBatch: function(e) {
    var selected = {}
    var count = 0
    if (e && e.currentTarget && e.currentTarget.dataset) {
      var idx = parseInt(e.currentTarget.dataset.index)
      if (idx >= 0) { selected[idx] = true; count = 1 }
    }
    this.setData({ batchMode: true, selectedItems: selected, batchCount: count })
    this._vibrate()
  },

  onExitBatch: function() { this.setData({ batchMode: false, selectedItems: {}, batchCount: 0 }) },

  onToggleBatchItem: function(e) {
    var idx = parseInt(e.currentTarget.dataset.index)
    var sel = Object.assign({}, this.data.selectedItems)
    if (sel[idx]) { delete sel[idx] } else { sel[idx] = true }
    var keys = Object.keys(sel)
    this.setData({ selectedItems: sel, batchCount: keys.length, batchMode: keys.length > 0 })
  },

  onBatchDelete: function() {
    var that = this, keys = Object.keys(this.data.selectedItems)
    if (keys.length === 0) return
    wx.showModal({ title: '删除音效条目', content: '确定删除已选择的 ' + keys.length + ' 个条目吗？', confirmColor: '#cf6679',
      success: function(r) {
        if (!r.confirm) return
        var g = that.data.selectedGroup; if (!g) return
        var indices = keys.map(function(k) { return parseInt(k) }).sort(function(a, b) { return b - a })
        for (var ii = 0; ii < indices.length; ii++) { g.items.splice(indices[ii], 1) }
        that.setData({ batchMode: false, selectedItems: {}, batchCount: 0 })
        that._save(); that._refresh()
      }
    })
  },

  onBatchMove: function() {
    var that = this, keys = Object.keys(this.data.selectedItems)
    if (keys.length === 0 || this.data.groups.length < 2) return
    var otherGroups = []
    for (var i = 0; i < this.data.groups.length; i++) { if (i !== this.data.selectedGroupIdx) otherGroups.push({ index: i, title: this.data.groups[i].title }) }
    var titles = otherGroups.map(function(g) { return g.title })
    wx.showActionSheet({ itemList: titles,
      success: function(r) {
        var targetIdx = otherGroups[r.tapIndex].index
        var g = that.data.selectedGroup; if (!g) return
        var indices = keys.map(function(k) { return parseInt(k) }).sort(function(a, b) { return a - b })
        var moved = []
        for (var ii = 0; ii < indices.length; ii++) { moved.push(g.items[indices[ii]]) }
        for (var ri = indices.length - 1; ri >= 0; ri--) { g.items.splice(indices[ri], 1) }
        var target = that.data.groups[targetIdx]
        if (!target.items) target.items = []
        for (var jj = 0; jj < moved.length; jj++) { target.items.push(moved[jj]) }
        that.setData({ batchMode: false, selectedItems: {}, batchCount: 0 })
        that._save(); that._refresh()
      }
    })
  },

  _vibrate: function() {
    try { wx.vibrateShort({ type: 'light' }) } catch (e) {}
  },

  // === Import/Export ===
  onImportPreset: function() {
    var that = this
    preset.chooseAndImportPreset().then(function(result) {
      if (result.type === 'soundboard' || result.type === 'all') { that._refresh(); wx.showToast({ title: '导入成功', icon: 'success' }) }
    }).catch(function() { wx.showToast({ title: '导入取消', icon: 'none' }) })
  },

  onExportPreset: function() {
    var data = preset.exportSoundboardPreset()
    wx.setClipboardData({ data: JSON.stringify(data, null, 2), success: function() { wx.showToast({ title: '已复制到剪贴板', icon: 'success' }) } })
  },

  onNavBack: function() { wx.navigateBack() },

  noop: function() {}
}))
