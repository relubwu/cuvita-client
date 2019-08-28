import * as LocalePackage from 'locale-package';

const { Store } = getApp();

Page({
  onLoad: function () {
    let { locale } = Store.getState().global;
    wx.setNavigationBarTitle({
      title: LocalePackage.title[locale]
    });
    this.setData({
      src: options.src
    });
  }
})