var storage = require('./storage')

function exportSubtitlePreset() {
  var config = storage.getSubtitleConfig()
  var gs = []
  for (var i = 0; i < config.groups.length; i++) {
    var g = config.groups[i]
    var is = []
    for (var j = 0; j < g.items.length; j++) { is.push({ text: g.items[j].text }) }
    gs.push({ title: g.title, icon: g.icon, items: is })
  }
  return { version: 1, type: 'kigtpk', timestamp: Date.now(), groups: gs }
}

function importSubtitlePreset(data) {
  try {
    var preset
    if (typeof data === 'string') { preset = JSON.parse(data) }
    else { preset = data }
    if (!preset.groups || typeof preset.groups.length === 'undefined') { throw new Error('格式错误：缺少 groups 字段') }
    var config = storage.getSubtitleConfig()
    var maxId = 0
    for (var i = 0; i < config.groups.length; i++) { if (config.groups[i].id > maxId) maxId = config.groups[i].id }
    for (var gi = 0; gi < preset.groups.length; gi++) {
      maxId++
      var group = preset.groups[gi]
      var items = []
      for (var ji = 0; ji < (group.items || []).length; ji++) { items.push({ id: Date.now() + maxId * 100 + ji, text: group.items[ji].text || '' }) }
      config.groups.push({ id: Date.now() + maxId, title: group.title || '导入分组', icon: group.icon || 'sentiment_satisfied', items: items })
    }
    storage.saveSubtitleConfig(config)
    return config
  } catch (e) { throw e }
}

function exportSoundboardPreset() {
  var config = storage.getSoundboardConfig()
  var gs = []
  for (var i = 0; i < config.groups.length; i++) {
    var g = config.groups[i]
    var is = []
    for (var j = 0; j < g.items.length; j++) { is.push({ title: g.items[j].title, wakeWord: g.items[j].wakeWord || '' }) }
    gs.push({ title: g.title, icon: g.icon, items: is })
  }
  return { version: 1, type: 'kigspk', timestamp: Date.now(), groups: gs }
}

function importSoundboardPreset(data) {
  try {
    var preset
    if (typeof data === 'string') { preset = JSON.parse(data) }
    else { preset = data }
    if (!preset.groups || typeof preset.groups.length === 'undefined') { throw new Error('格式错误：缺少 groups 字段') }
    var config = storage.getSoundboardConfig()
    var maxId = 0
    for (var i = 0; i < config.groups.length; i++) { if (config.groups[i].id > maxId) maxId = config.groups[i].id }
    for (var gi = 0; gi < preset.groups.length; gi++) {
      maxId++
      var group = preset.groups[gi]
      var items = []
      for (var ji = 0; ji < (group.items || []).length; ji++) { items.push({ id: Date.now() + maxId * 100 + ji, title: group.items[ji].title || '新音效', wakeWord: group.items[ji].wakeWord || '' }) }
      config.groups.push({ id: Date.now() + maxId, title: group.title || '导入分组', icon: group.icon || 'music_note', items: items })
    }
    storage.saveSoundboardConfig(config)
    return config
  } catch (e) { throw e }
}

function exportAllPresets() {
  return { subtitle: exportSubtitlePreset(), soundboard: exportSoundboardPreset(), exportTime: Date.now() }
}

function importPresetFromFile(filePath) {
  return new Promise(function(resolve, reject) {
    var fs = wx.getFileSystemManager()
    try {
      var data = fs.readFileSync(filePath, 'utf-8')
      var preset = JSON.parse(data)
      if (preset.type === 'kigtpk' || preset.type === 'kigspk') {
        if (preset.type === 'kigtpk') { resolve({ type: 'subtitle', result: importSubtitlePreset(preset) }) }
        else { resolve({ type: 'soundboard', result: importSoundboardPreset(preset) }) }
      } else if (preset.subtitle || preset.soundboard) {
        var results = {}
        if (preset.subtitle) results.subtitle = importSubtitlePreset(preset.subtitle)
        if (preset.soundboard) results.soundboard = importSoundboardPreset(preset.soundboard)
        resolve({ type: 'all', result: results })
      } else { reject(new Error('无法识别的预设格式')) }
    } catch (e) { reject(e) }
  })
}

function chooseAndImportPreset() {
  return new Promise(function(resolve, reject) {
    wx.chooseMessageFile({
      count: 1, type: 'file',
      success: function(res) { importPresetFromFile(res.tempFiles[0].path).then(resolve).catch(reject) },
      fail: reject
    })
  })
}

module.exports = {
  exportSubtitlePreset: exportSubtitlePreset,
  importSubtitlePreset: importSubtitlePreset,
  exportSoundboardPreset: exportSoundboardPreset,
  importSoundboardPreset: importSoundboardPreset,
  exportAllPresets: exportAllPresets,
  importPresetFromFile: importPresetFromFile,
  chooseAndImportPreset: chooseAndImportPreset
}
