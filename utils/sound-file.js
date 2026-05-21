var AUDIO_EXTENSIONS = ['mp3', 'm4a', 'wav', 'aac', 'flac', 'ogg', 'opus', 'amr', 'caf']
var SOUND_DIR = 'kigtts_soundboard'

function baseName(path) {
  if (!path) return ''
  var parts = String(path).split(/[\\/]/)
  return parts[parts.length - 1] || ''
}

function safeFileName(name) {
  name = String(name || 'sound')
  name = name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_')
  if (name.length > 80) name = name.slice(name.length - 80)
  return name || 'sound'
}

function extName(name) {
  var m = /\.([^.]+)$/.exec(String(name || '').toLowerCase())
  return m ? m[1] : ''
}

function canUseExtensionFilter() {
  try {
    return !wx.canIUse || wx.canIUse('chooseMessageFile.object.extension')
  } catch (e) {
    return false
  }
}

function normalizeFile(file) {
  file = file || {}
  var filePath = file.path || file.tempFilePath || ''
  var fileName = file.name || baseName(filePath) || 'sound'
  return {
    tempPath: filePath,
    fileName: fileName,
    fileSize: file.size || 0,
    extension: extName(fileName || filePath)
  }
}

function ensureDir(fs, dir) {
  try {
    fs.accessSync(dir)
    return
  } catch (e) {}

  try {
    fs.mkdirSync(dir, true)
  } catch (e2) {
    try { fs.mkdirSync(dir) } catch (e3) {}
  }
}

function persistPickedFile(file) {
  return new Promise(function(resolve, reject) {
    var picked = normalizeFile(file)
    if (!picked.tempPath) {
      reject(new Error('empty file path'))
      return
    }

    var fs = wx.getFileSystemManager()
    var root = wx.env && wx.env.USER_DATA_PATH
    if (!fs || !root) {
      resolve({
        filePath: picked.tempPath,
        fileName: picked.fileName,
        fileSize: picked.fileSize
      })
      return
    }

    var dir = root + '/' + SOUND_DIR
    ensureDir(fs, dir)

    var suffix = picked.extension ? ('.' + picked.extension) : ''
    var name = safeFileName(picked.fileName)
    if (suffix && name.toLowerCase().slice(-suffix.length) !== suffix) name += suffix
    var dest = dir + '/' + Date.now() + '_' + Math.floor(Math.random() * 100000) + '_' + name

    fs.copyFile({
      srcPath: picked.tempPath,
      destPath: dest,
      success: function() {
        resolve({
          filePath: dest,
          fileName: picked.fileName,
          fileSize: picked.fileSize
        })
      },
      fail: function(copyErr) {
        wx.saveFile({
          tempFilePath: picked.tempPath,
          success: function(res) {
            resolve({
              filePath: res.savedFilePath || picked.tempPath,
              fileName: picked.fileName,
              fileSize: picked.fileSize
            })
          },
          fail: function(saveErr) {
            reject(saveErr || copyErr)
          }
        })
      }
    })
  })
}

function chooseAudioFile() {
  return new Promise(function(resolve, reject) {
    var options = {
      count: 1,
      type: 'file',
      success: function(res) {
        var file = res && res.tempFiles && res.tempFiles[0]
        persistPickedFile(file).then(resolve).catch(reject)
      },
      fail: reject
    }
    if (canUseExtensionFilter()) options.extension = AUDIO_EXTENSIONS
    wx.chooseMessageFile(options)
  })
}

function displayName(item) {
  if (!item) return '未选择'
  return item.fileName || baseName(item.filePath) || '未选择'
}

module.exports = {
  chooseAudioFile: chooseAudioFile,
  persistPickedFile: persistPickedFile,
  displayName: displayName,
  AUDIO_EXTENSIONS: AUDIO_EXTENSIONS
}
