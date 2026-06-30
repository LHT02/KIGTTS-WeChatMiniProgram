var theme = require('../../utils/theme')
var logoData = require('../../utils/logo-data')
var share = require('../../utils/share')

Page(share.attach({
  data: {
    themeClass: theme.themeClass(),
    logoSrc: logoData.getLogoSrc(theme.themeClass()),
    leaving: false
  },

  onLoad: function() {
    var themeClass = theme.themeClass()
    this.setData({
      themeClass: themeClass,
      logoSrc: logoData.getLogoSrc(themeClass)
    })
  },

  onReady: function() {
    var that = this
    setTimeout(function() {
      that.setData({ leaving: true })
      setTimeout(function() {
        wx.redirectTo({ url: '/pages/main/index' })
      }, 160)
    }, 520)
  }
}))
