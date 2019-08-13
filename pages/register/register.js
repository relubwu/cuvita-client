import { request, METHOD, requestPayment } from '../../utils/promisfy';
import * as API from '../../config/api.config';
import * as LocalePackage from 'locale-package';
import * as Toasts from '../../utils/toasts';
import Sanitizer from '../../utils/sanitizer';
import Palette from '../../config/palette.config';

const { Store, GlobalActions, GlobalLocalePackages } = getApp();

Page({
  data: {
    LocalePackage,
    pending: false,
    popup: {},
    options: {
      gender: [['男', '女', '其他'], ['Male', 'Female', 'Non-Binary']],
      minDate: new Date(1990, 0, 1).getTime(),
      maxDate: new Date().getTime()
    }
  },
  onLoad: function () {
    let { locale } = Store.getState().global;
    // Synchronous storage hook
    this.setData({
      locale
    });
    wx.setNavigationBarTitle({
      title: LocalePackage.title[Store.getState().global.locale]
    });
  },
  mapStateToPage: function () {
    let newState = Store.getState();
    if (this.data.locale !== newState.global.locale)
      this.setData({
        locale: newState.global.locale
      });
  },
  onShow: function () {
    this.unsubscribe = Store.subscribe(() => {
      this.mapStateToPage();
    });
  },
  onUnload: function () {
    this.unsubscribe();
  },
  onSubmit: function ({ detail: { value } }) {
    let { clearance, failedItems } = Sanitizer(value, {
      name: 'avail',
      tel: 'avail',
      gender: 'avail',
      birthday: 'avail'
    });
    for (let key in value) {
      if (!!failedItems[key]) {
        if (LocalePackage[key].err)
          this.setData({
            [`err.${key}`]: LocalePackage[key].err[failedItems[key]][this.data.locale]
          });
      } else {
        if (LocalePackage[key].err)
          this.setData({
            [`err.${key}`]: ''
          });
      }
    }
    if (!clearance) { 
      Toasts.incompleteForm(this.data.locale);
      return;
    }
    let { name, gender, tel, birthday } = value;
    gender = parseInt(gender);
    birthday = parseInt(birthday);
    this.setData({
      pending: true
    });
    request(API.MEMBER.REGISTER, METHOD.GET, { name, gender, tel, birthday, openid: Store.getState().global.user.openid })
      .then(bundle => requestPayment(bundle))
      .then(() => {
        this.setData({
          pending: false
        });
        wx.showModal({
          title: LocalePackage.modal.success.title[this.data.locale],
          content: LocalePackage.modal.success.content[this.data.locale],
          confirmColor: Palette.primary,
          showCancel: false,
          success: function () {
            wx.reLaunch({
              url: '/pages/vitae/vitae'
            });
          }
        });
      })
      .catch(e => {
        this.setData({
          pending: false
        })
        Toasts.requestFailed(this.data.locale)
      });
  },
  toggle: function ({ target: { dataset: { name } } }) {
    this.setData({
      [`popup.${name}`]: !this.data.popup[name]
    })
  },
  setGender: function ({ detail: { index, value } }) {
    this.setData({
      gender: { label: value, value: index }
    });
    this.toggle({ target: { dataset: { name: 'gender' } } });
  },
  setBirthday: function ({ detail }) {
    this.setData({
      birthday: { label: new Date(detail).toLocaleDateString(), value: detail }
    });
    this.toggle({ target: { dataset: { name: 'birthday' } } });
  }
})