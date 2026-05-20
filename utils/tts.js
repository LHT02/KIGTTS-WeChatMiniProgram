var plugin = null
var audioCtx = null

try {
  plugin = requirePlugin('WechatSI')
} catch (e) {
  plugin = null
}

function stop() {
  if (!audioCtx) return
  try { audioCtx.stop() } catch (e) {}
  try { audioCtx.destroy() } catch (e2) {}
  audioCtx = null
}

function utf8Length(ch) {
  var code = ch.charCodeAt(0)
  if (code <= 0x7f) return 1
  if (code <= 0x7ff) return 2
  if (code >= 0xd800 && code <= 0xdbff) return 4
  return 3
}

function limitContent(text) {
  var source = String(text || '').trim()
  var out = ''
  var size = 0
  for (var i = 0; i < source.length; i++) {
    var ch = source.charAt(i)
    var len = utf8Length(ch)
    if (size + len > 960) break
    out += ch
    size += len
    if (len === 4 && i + 1 < source.length) {
      out += source.charAt(i + 1)
      i++
    }
  }
  return out
}

function speak(text, options) {
  return new Promise(function(resolve, reject) {
    var content = limitContent(text)
    if (!content) {
      reject(new Error('没有可朗读的文本'))
      return
    }
    if (!plugin || !plugin.textToSpeech) {
      reject(new Error('微信同声传译插件不可用'))
      return
    }

    stop()
    plugin.textToSpeech({
      lang: (options && options.lang) || 'zh_CN',
      tts: true,
      content: content,
      success: function(res) {
        var src = res && (res.filename || res.tempFilePath)
        if (!src) {
          reject(new Error('语音合成未返回音频'))
          return
        }
        audioCtx = wx.createInnerAudioContext()
        audioCtx.obeyMuteSwitch = false
        audioCtx.src = src
        audioCtx.onEnded(function() {
          stop()
          resolve()
        })
        audioCtx.onError(function() {
          stop()
          reject(new Error('语音播放失败'))
        })
        audioCtx.play()
      },
      fail: function(err) {
        reject(err || new Error('语音合成失败'))
      }
    })
  })
}

module.exports = {
  speak: speak,
  stop: stop
}
