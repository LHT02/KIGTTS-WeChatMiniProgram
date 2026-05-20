var audioCtx = null
var currentPlayingId = null

function createAudio(src) {
  stopAll()
  var ctx = wx.createInnerAudioContext()
  ctx.src = src
  ctx.obeyMuteSwitch = false
  audioCtx = ctx
  return ctx
}

function playAudio(src) {
  return new Promise(function(resolve, reject) {
    var ctx = createAudio(src)
    ctx.onEnded(function() {
      currentPlayingId = null
      resolve()
    })
    ctx.onError(function(err) {
      currentPlayingId = null
      reject(err)
    })
    ctx.play()
    currentPlayingId = src
  })
}

function stopAll() {
  if (audioCtx) {
    audioCtx.stop()
    audioCtx.destroy()
    audioCtx = null
  }
  currentPlayingId = null
}

function pauseAudio() {
  if (audioCtx) { audioCtx.pause() }
}

function resumeAudio() {
  if (audioCtx) { audioCtx.play() }
}

function isPlaying() {
  return audioCtx && !audioCtx.paused
}

function getCurrentPlayingId() {
  return currentPlayingId
}

module.exports = {
  play: function(src) { return playAudio(src) },
  stop: stopAll,
  playAudio: playAudio,
  stopAll: stopAll,
  pauseAudio: pauseAudio,
  resumeAudio: resumeAudio,
  isPlaying: isPlaying,
  getCurrentPlayingId: getCurrentPlayingId,
  createAudio: createAudio
}
