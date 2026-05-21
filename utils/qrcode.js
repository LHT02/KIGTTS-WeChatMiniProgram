/**
 * Local QR code renderer.
 *
 * The mini program intentionally avoids WeChat service-market QR plugins and
 * remote QR APIs. This module draws byte-mode QR codes directly to canvas.
 */

var system = require('./system')

var VERSIONS = [
  { version: 1, size: 21, dataCodewords: 19, eccCodewords: 7, align: [] },
  { version: 2, size: 25, dataCodewords: 34, eccCodewords: 10, align: [6, 18] },
  { version: 3, size: 29, dataCodewords: 55, eccCodewords: 15, align: [6, 22] },
  { version: 4, size: 33, dataCodewords: 80, eccCodewords: 20, align: [6, 26] },
  { version: 5, size: 37, dataCodewords: 108, eccCodewords: 26, align: [6, 30] }
]

var EXP = []
var LOG = []
initGalois()

function initGalois() {
  var x = 1
  for (var i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255]
}

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0
  return EXP[LOG[a] + LOG[b]]
}

function utf8Bytes(str) {
  var out = []
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i)
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
      var d = str.charCodeAt(++i)
      c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00)
    }
    if (c < 0x80) out.push(c)
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f))
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f))
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f))
  }
  return out
}

function chooseVersion(byteLength) {
  for (var i = 0; i < VERSIONS.length; i++) {
    var v = VERSIONS[i]
    var bits = 4 + 8 + byteLength * 8
    if (bits <= v.dataCodewords * 8) return v
  }
  throw new Error('二维码内容过长')
}

function BitBuffer() {
  this.bits = []
}
BitBuffer.prototype.put = function(value, length) {
  for (var i = length - 1; i >= 0; i--) this.bits.push((value >>> i) & 1)
}
BitBuffer.prototype.toCodewords = function(capacity) {
  var bits = this.bits
  var maxBits = capacity * 8
  var terminator = Math.min(4, maxBits - bits.length)
  for (var i = 0; i < terminator; i++) bits.push(0)
  while (bits.length % 8 !== 0) bits.push(0)
  var out = []
  for (var j = 0; j < bits.length; j += 8) {
    var n = 0
    for (var k = 0; k < 8; k++) n = (n << 1) | bits[j + k]
    out.push(n)
  }
  var pad = [0xec, 0x11]
  var p = 0
  while (out.length < capacity) out.push(pad[(p++) & 1])
  return out
}

function makeData(bytes, dataCodewords) {
  var bb = new BitBuffer()
  bb.put(0x4, 4)
  bb.put(bytes.length, 8)
  for (var i = 0; i < bytes.length; i++) bb.put(bytes[i], 8)
  return bb.toCodewords(dataCodewords)
}

function rsGenerator(degree) {
  var poly = [1]
  for (var i = 0; i < degree; i++) {
    var next = new Array(poly.length + 1)
    for (var n = 0; n < next.length; n++) next[n] = 0
    for (var j = 0; j < poly.length; j++) {
      next[j] ^= poly[j]
      next[j + 1] ^= gfMul(poly[j], EXP[i])
    }
    poly = next
  }
  return poly
}

function reedSolomon(data, eccLength) {
  var gen = rsGenerator(eccLength)
  var msg = data.slice()
  for (var z = 0; z < eccLength; z++) msg.push(0)
  for (var i = 0; i < data.length; i++) {
    var coef = msg[i]
    if (coef === 0) continue
    for (var j = 0; j < gen.length; j++) {
      msg[i + j] ^= gfMul(gen[j], coef)
    }
  }
  return msg.slice(msg.length - eccLength)
}

function makeMatrix(size) {
  var m = []
  for (var y = 0; y < size; y++) {
    m[y] = []
    for (var x = 0; x < size; x++) m[y][x] = false
  }
  return m
}

function setModule(modules, reserved, x, y, dark) {
  if (y < 0 || y >= modules.length || x < 0 || x >= modules.length) return
  modules[y][x] = !!dark
  reserved[y][x] = true
}

function drawFinder(modules, reserved, x, y) {
  for (var dy = -1; dy <= 7; dy++) {
    for (var dx = -1; dx <= 7; dx++) {
      var xx = x + dx
      var yy = y + dy
      if (xx < 0 || yy < 0 || xx >= modules.length || yy >= modules.length) continue
      var dark = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6 &&
        (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4))
      setModule(modules, reserved, xx, yy, dark)
    }
  }
}

function drawAlignment(modules, reserved, cx, cy) {
  for (var dy = -2; dy <= 2; dy++) {
    for (var dx = -2; dx <= 2; dx++) {
      var dark = Math.max(Math.abs(dx), Math.abs(dy)) !== 1
      setModule(modules, reserved, cx + dx, cy + dy, dark)
    }
  }
}

function reserveFormat(reserved, size) {
  for (var i = 0; i <= 8; i++) {
    reserved[8][i] = true
    reserved[i][8] = true
  }
  for (var j = size - 8; j < size; j++) {
    reserved[8][j] = true
    reserved[j][8] = true
  }
}

function buildBase(versionInfo) {
  var size = versionInfo.size
  var modules = makeMatrix(size)
  var reserved = makeMatrix(size)
  drawFinder(modules, reserved, 0, 0)
  drawFinder(modules, reserved, size - 7, 0)
  drawFinder(modules, reserved, 0, size - 7)

  for (var i = 8; i < size - 8; i++) {
    setModule(modules, reserved, i, 6, i % 2 === 0)
    setModule(modules, reserved, 6, i, i % 2 === 0)
  }

  var align = versionInfo.align
  for (var ay = 0; ay < align.length; ay++) {
    for (var ax = 0; ax < align.length; ax++) {
      var x = align[ax]
      var y = align[ay]
      if (reserved[y][x]) continue
      drawAlignment(modules, reserved, x, y)
    }
  }

  setModule(modules, reserved, 8, size - 8, true)
  reserveFormat(reserved, size)
  return { modules: modules, reserved: reserved }
}

function cloneMatrix(m) {
  var out = []
  for (var y = 0; y < m.length; y++) out[y] = m[y].slice()
  return out
}

function maskBit(mask, x, y) {
  switch (mask) {
    case 0: return (x + y) % 2 === 0
    case 1: return y % 2 === 0
    case 2: return x % 3 === 0
    case 3: return (x + y) % 3 === 0
    case 4: return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0
    case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0
    case 7: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
  }
  return false
}

function placeData(modules, reserved, codewords, mask) {
  var bits = []
  for (var i = 0; i < codewords.length; i++) {
    for (var b = 7; b >= 0; b--) bits.push((codewords[i] >>> b) & 1)
  }
  var size = modules.length
  var bitIndex = 0
  var upward = true
  for (var x = size - 1; x > 0; x -= 2) {
    if (x === 6) x--
    for (var y0 = 0; y0 < size; y0++) {
      var y = upward ? size - 1 - y0 : y0
      for (var dx = 0; dx < 2; dx++) {
        var xx = x - dx
        if (reserved[y][xx]) continue
        var dark = bitIndex < bits.length ? bits[bitIndex++] === 1 : false
        modules[y][xx] = dark !== maskBit(mask, xx, y)
      }
    }
    upward = !upward
  }
}

function getFormatBits(mask) {
  var data = (1 << 3) | mask
  var rem = data << 10
  for (var i = 14; i >= 10; i--) {
    if (((rem >>> i) & 1) !== 0) rem ^= 0x537 << (i - 10)
  }
  return ((data << 10) | rem) ^ 0x5412
}

function drawFormat(modules, mask) {
  var size = modules.length
  var bits = getFormatBits(mask)
  function bit(i) { return ((bits >>> i) & 1) !== 0 }
  for (var i = 0; i <= 5; i++) modules[i][8] = bit(i)
  modules[7][8] = bit(6)
  modules[8][8] = bit(7)
  modules[8][7] = bit(8)
  for (var j = 9; j < 15; j++) modules[8][14 - j] = bit(j)
  for (var k = 0; k < 8; k++) modules[8][size - 1 - k] = bit(k)
  for (var n = 8; n < 15; n++) modules[size - 15 + n][8] = bit(n)
  modules[size - 8][8] = true
}

function penaltyLine(values) {
  var penalty = 0
  var runColor = values[0]
  var runLen = 1
  for (var i = 1; i < values.length; i++) {
    if (values[i] === runColor) runLen++
    else {
      if (runLen >= 5) penalty += 3 + runLen - 5
      runColor = values[i]
      runLen = 1
    }
  }
  if (runLen >= 5) penalty += 3 + runLen - 5
  return penalty
}

function hasFinderPattern(values, i) {
  var p1 = [true, false, true, true, true, false, true, false, false, false, false]
  var p2 = [false, false, false, false, true, false, true, true, true, false, true]
  var a = true
  var b = true
  for (var j = 0; j < 11; j++) {
    if (values[i + j] !== p1[j]) a = false
    if (values[i + j] !== p2[j]) b = false
  }
  return a || b
}

function getPenalty(modules) {
  var size = modules.length
  var penalty = 0
  var dark = 0
  for (var y = 0; y < size; y++) {
    penalty += penaltyLine(modules[y])
    for (var x = 0; x < size; x++) if (modules[y][x]) dark++
    for (var x2 = 0; x2 <= size - 11; x2++) {
      if (hasFinderPattern(modules[y], x2)) penalty += 40
    }
  }
  for (var x3 = 0; x3 < size; x3++) {
    var col = []
    for (var y3 = 0; y3 < size; y3++) col.push(modules[y3][x3])
    penalty += penaltyLine(col)
    for (var y4 = 0; y4 <= size - 11; y4++) {
      if (hasFinderPattern(col, y4)) penalty += 40
    }
  }
  for (var yy = 0; yy < size - 1; yy++) {
    for (var xx = 0; xx < size - 1; xx++) {
      var c = modules[yy][xx]
      if (c === modules[yy][xx + 1] && c === modules[yy + 1][xx] && c === modules[yy + 1][xx + 1]) penalty += 3
    }
  }
  var total = size * size
  penalty += Math.floor(Math.abs(dark * 20 - total * 10) / total) * 10
  return penalty
}

function createMatrix(text) {
  var bytes = utf8Bytes(text || '')
  var version = chooseVersion(bytes.length)
  var data = makeData(bytes, version.dataCodewords)
  var ecc = reedSolomon(data, version.eccCodewords)
  var codewords = data.concat(ecc)
  var base = buildBase(version)
  var best = null
  var bestPenalty = Infinity
  for (var mask = 0; mask < 8; mask++) {
    var modules = cloneMatrix(base.modules)
    placeData(modules, base.reserved, codewords, mask)
    drawFormat(modules, mask)
    var p = getPenalty(modules)
    if (p < bestPenalty) {
      bestPenalty = p
      best = modules
    }
  }
  return best
}

function drawCanvas(page, canvasId, text, options) {
  return new Promise(function(resolve, reject) {
    var matrix
    try {
      matrix = createMatrix(text)
    } catch (e) {
      reject(e)
      return
    }
    var query = page && typeof page.createSelectorQuery === 'function' ? page.createSelectorQuery() : wx.createSelectorQuery().in(page)
    query.select('#' + canvasId).fields({ node: true, size: true }).exec(function(res) {
      var rect = res && res[0]
      var canvas = rect && rect.node
      if (!canvas || !canvas.getContext) {
        reject(new Error('Canvas 2D 节点不可用'))
        return
      }
      var size = options && options.size ? options.size : (rect && rect.width ? rect.width : 180)
      var quiet = 4
      var count = matrix.length + quiet * 2
      var cell = Math.floor(size / count)
      if (cell < 1) cell = size / count
      var drawn = cell * count
      var offset = (size - drawn) / 2
      var bg = options && options.bg ? options.bg : '#ffffff'
      var fg = options && options.fg ? options.fg : '#000000'
      var dpr = system.pixelRatio()
      canvas.width = Math.round(size * dpr)
      canvas.height = Math.round(size * dpr)
      var ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, size, size)
      ctx.fillStyle = fg
      for (var y = 0; y < matrix.length; y++) {
        for (var x = 0; x < matrix.length; x++) {
          if (matrix[y][x]) ctx.fillRect(offset + (x + quiet) * cell, offset + (y + quiet) * cell, cell, cell)
        }
      }
      resolve(true)
    })
  })
}

module.exports = {
  createMatrix: createMatrix,
  drawCanvas: drawCanvas
}
