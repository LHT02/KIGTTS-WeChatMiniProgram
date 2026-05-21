var storage = require('../../utils/storage')
var theme = require('../../utils/theme')
var ripple = require('../../utils/ripple')
var system = require('../../utils/system')

Page(ripple.attach({
  data: {
    config: null, configGroups: [],
    groupId: 0, title: '', icon: 'sentiment_satisfied', items: [],
    showIconPicker: false,
    iconList: [
      "sentiment_satisfied","sentiment_very_satisfied","sentiment_neutral","sentiment_dissatisfied",
      "chat","forum","sms","alternate_email","emoji_people",
      "person","groups","accessibility_new","support_agent","translate",
      "work","school","home","restaurant","shopping_bag","local_hospital",
      "directions_car","train","flight","location_on","schedule",
      "event","payments","sports_esports","favorite","thumb_up",
      "handshake","celebration","pets","info","warning"
    ],
    showItemEditor: false, editingIndex: -1, editingText: '',
    batchMode: false, selectedItems: {}, batchCount: 0,
    draggingIndex: -1,
    themeClass: theme.themeClass()
  },

  onLoad: function(opt) {
    var settings = storage.getSettings()
    this.setData({ themeClass: theme.themeClass(settings), statusBarH: system.statusBarHeight() })
    var gid = parseInt(opt.gid) || 0
    var config = storage.getSubtitleConfig()
    var groupsCopy = this._cloneGroups(config.groups || [])
    var group = null
    for (var i = 0; i < groupsCopy.length; i++) { if (groupsCopy[i].id === gid) { group = groupsCopy[i]; break } }
    this.setData({ config: config, configGroups: groupsCopy })
    if (group) {
      var itemsCopy = []
      for (var j = 0; j < group.items.length; j++) {
        var orig = group.items[j]; itemsCopy.push({ id: orig.id, text: orig.text })
      }
      this.setData({ groupId: gid, title: group.title, icon: group.icon || 'sentiment_satisfied', items: itemsCopy })
    }
  },

  onTitleInput: function(e) { this.setData({ title: e.detail.value }) },
  onPickIcon: function(e) { this.setData({ icon: e.currentTarget.dataset.icon, showIconPicker: false }) },
  onOpenIconPicker: function() { this.setData({ showIconPicker: true }) },
  onCloseIconPicker: function() { this.setData({ showIconPicker: false }) },

  _cloneGroups: function(groups) {
    var out = []
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i] || {}
      var items = []
      var srcItems = g.items || []
      for (var j = 0; j < srcItems.length; j++) {
        items.push({ id: srcItems[j].id, text: srcItems[j].text })
      }
      out.push({ id: g.id, title: g.title, icon: g.icon, items: items })
    }
    return out
  },

  _syncCurrentGroupItems: function(items) {
    var groups = this.data.configGroups.slice()
    for (var i = 0; i < groups.length; i++) {
      if (groups[i].id === this.data.groupId) {
        groups[i].items = items.slice()
        this.setData({ configGroups: groups })
        return groups
      }
    }
    return groups
  },

  onSaveGroup: function() {
    var title = this.data.title.trim()
    if (!title) { wx.showToast({ title: '请输入名称', icon: 'none' }); return }
    var config = this.data.config || storage.getSubtitleConfig()
    config.groups = this.data.configGroups.slice()
    if (this.data.groupId) {
      for (var i = 0; i < config.groups.length; i++) { if (config.groups[i].id === this.data.groupId) { config.groups[i].title = title; config.groups[i].icon = this.data.icon; config.groups[i].items = this.data.items; break } }
    } else {
      var newId = Date.now()
      config.groups.push({ id: newId, title: title, icon: this.data.icon, items: this.data.items })
      if (!config.selectedGroupId) config.selectedGroupId = newId
    }
    storage.saveSubtitleConfig(config)
    wx.showToast({ title: '分组已保存', icon: 'success' })
    wx.navigateBack()
  },

  onDeleteGroup: function() {
    var that = this
    wx.showModal({ title: '删除分组', content: '删除整个分组及所有快捷文本？', confirmColor: '#cf6679',
      success: function(r) {
        if (!r.confirm) return
        var config = storage.getSubtitleConfig()
        var newGroups = []
        for (var i = 0; i < config.groups.length; i++) { if (config.groups[i].id !== that.data.groupId) newGroups.push(config.groups[i]) }
        config.groups = newGroups
        if (config.selectedGroupId === that.data.groupId) config.selectedGroupId = config.groups[0] ? config.groups[0].id : 0
        storage.saveSubtitleConfig(config)
        wx.navigateBack()
      }
    })
  },

  onItemTap: function(e) {
    var idx = e.currentTarget.dataset.index
    this.setData({ showItemEditor: true, editingIndex: idx, editingText: this.data.items[idx].text })
  },
  onItemRowTap: function(e) {
    if (!this.data.batchMode) return
    this.onToggleBatchItem(e)
  },
  onItemLongPress: function(e) {
    var idx = parseInt(e.currentTarget.dataset.index)
    if (idx < 0 || idx >= this.data.items.length) return
    var selected = {}
    selected[idx] = true
    this.setData({ batchMode: true, selectedItems: selected, batchCount: 1 })
    this._vibrate()
  },
  onAddItem: function() { this.setData({ showItemEditor: true, editingIndex: -1, editingText: '' }) },
  onCloseItemEditor: function() { this.setData({ showItemEditor: false }) },
  onItemTextInput: function(e) { this.setData({ editingText: e.detail.value }) },

  onSaveItem: function() {
    var text = this.data.editingText.trim()
    if (!text) { wx.showToast({ title: '请输入文本', icon: 'none' }); return }
    var items = this.data.items.slice()
    if (this.data.editingIndex >= 0) { items[this.data.editingIndex].text = text }
    else { items.push({ id: Date.now(), text: text }) }
    this._syncCurrentGroupItems(items)
    this.setData({ items: items, showItemEditor: false, editingIndex: -1 })
    wx.showToast({ title: '快捷文本已保存', icon: 'success' })
  },

  onDeleteItem: function(e) {
    var idx = e.currentTarget.dataset.index, that = this
    if (this.data.items.length <= 1) { wx.showToast({ title: '至少保留一条快捷文本', icon: 'none' }); return }
    wx.showModal({ title: '确认删除', content: '删除"' + this.data.items[idx].text + '"？', confirmColor: '#cf6679',
      success: function(r) { if (!r.confirm) return; var items = that.data.items.slice(); items.splice(idx, 1); that._syncCurrentGroupItems(items); that.setData({ items: items }) }
    })
  },

  onMoveUp: function(e) {
    var idx = parseInt(e.currentTarget.dataset.index)
    if (idx <= 0) return
    var items = this.data.items.slice(), t = items[idx]; items[idx] = items[idx-1]; items[idx-1] = t
    this._syncCurrentGroupItems(items)
    this.setData({ items: items })
  },

  onMoveDown: function(e) {
    var idx = parseInt(e.currentTarget.dataset.index)
    var items = this.data.items.slice()
    if (idx >= items.length - 1) return
    var t = items[idx]; items[idx] = items[idx+1]; items[idx+1] = t
    this._syncCurrentGroupItems(items)
    this.setData({ items: items })
  },

  onToggleBatchItem: function(e) {
    var idx = parseInt(e.currentTarget.dataset.index)
    if (idx < 0 || idx >= this.data.items.length) return
    var selected = Object.assign({}, this.data.selectedItems)
    if (selected[idx]) delete selected[idx]
    else selected[idx] = true
    var count = Object.keys(selected).length
    this.setData({ selectedItems: selected, batchCount: count, batchMode: count > 0 })
  },

  onExitBatch: function() {
    this.setData({ batchMode: false, selectedItems: {}, batchCount: 0 })
  },

  onBatchDelete: function() {
    var that = this
    var keys = Object.keys(this.data.selectedItems)
    if (!keys.length) return
    wx.showModal({ title: '删除快捷文本', content: '确定删除已选择的 ' + keys.length + ' 条快捷文本吗？', confirmColor: '#cf6679',
      success: function(r) {
        if (!r.confirm) return
        var items = that.data.items.slice()
        var indices = keys.map(function(k) { return parseInt(k) }).sort(function(a, b) { return b - a })
        for (var i = 0; i < indices.length; i++) items.splice(indices[i], 1)
        that._syncCurrentGroupItems(items)
        that.setData({ items: items, batchMode: false, selectedItems: {}, batchCount: 0 })
      }
    })
  },

  onBatchMove: function() {
    var that = this
    var keys = Object.keys(this.data.selectedItems)
    if (!keys.length || !this.data.groupId || this.data.configGroups.length < 2) return
    var targets = []
    for (var i = 0; i < this.data.configGroups.length; i++) {
      var g = this.data.configGroups[i]
      if (g.id !== this.data.groupId) targets.push({ index: i, title: g.title || '未命名分组' })
    }
    if (!targets.length) return
    wx.showActionSheet({ itemList: targets.map(function(g) { return g.title }),
      success: function(r) {
        var target = targets[r.tapIndex]
        if (!target) return
        var groups = that.data.configGroups.slice()
        var items = that.data.items.slice()
        var indices = keys.map(function(k) { return parseInt(k) }).sort(function(a, b) { return a - b })
        var moved = []
        for (var m = 0; m < indices.length; m++) moved.push(items[indices[m]])
        for (var d = indices.length - 1; d >= 0; d--) items.splice(indices[d], 1)
        if (!groups[target.index].items) groups[target.index].items = []
        groups[target.index].items = groups[target.index].items.concat(moved)
        for (var gi = 0; gi < groups.length; gi++) {
          if (groups[gi].id === that.data.groupId) { groups[gi].items = items; break }
        }
        that.setData({ configGroups: groups, items: items, batchMode: false, selectedItems: {}, batchCount: 0 })
        wx.showToast({ title: '已移动 ' + moved.length + ' 条', icon: 'none' })
      }
    })
  },

  onItemDragStart: function(e) {
    if (this.data.batchMode) return
    var idx = parseInt(e.currentTarget.dataset.index)
    if (idx < 0 || idx >= this.data.items.length) return
    var touch = e.touches && e.touches[0]
    this._dragState = { index: idx, y: touch ? touch.pageY : 0 }
    this.setData({ draggingIndex: idx })
    this._vibrate()
  },

  onItemDragMove: function(e) {
    if (!this._dragState) return
    var touch = e.touches && e.touches[0]
    if (!touch) return
    var threshold = this._dragThresholdPx()
    var diff = touch.pageY - this._dragState.y
    var step = diff > threshold ? Math.floor(diff / threshold) : (diff < -threshold ? Math.ceil(diff / threshold) : 0)
    if (!step) return
    var items = this.data.items.slice()
    var from = this._dragState.index
    var to = Math.max(0, Math.min(items.length - 1, from + step))
    if (to === from) return
    var moved = items.splice(from, 1)[0]
    items.splice(to, 0, moved)
    this._dragState.index = to
    this._dragState.y += step * threshold
    this._syncCurrentGroupItems(items)
    this.setData({ items: items, draggingIndex: to })
  },

  onItemDragEnd: function() {
    if (!this._dragState) return
    this._dragState = null
    this.setData({ draggingIndex: -1 })
  },

  _dragThresholdPx: function() {
    return Math.max(32, system.rpxToPx(76))
  },

  _vibrate: function() {
    try { wx.vibrateShort({ type: 'light' }) } catch (e) {}
  },

  onNavBack: function() { wx.navigateBack() },

  noop: function() {}
}))
