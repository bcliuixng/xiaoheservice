/* 微信参数AppID 和 Secret */
var wxConfig = {
    AppID: "wx656e20e7d21db7a5",  // 小程序ID  
    Secret: "e9fc48d7771184f8857119a084f788e4",  // 小程序Secret
    Mch_id: "1504466981", // 商户号
    pay_api_key: 'bcliuxingbcliuxingbcliuxingbcliu', // 商户key
    ACSPrefix:'https://api.weixin.qq.com/cgi-bin/',
    templateid:"VOBNQItoz7YU3G3TJSmfL_N9fHgYOWlUg8RQnMrdfMM",
    ApiRoot:'https://api.mch.weixin.qq.com',

    AppIDbbg: "wx5faa1a71ac16ae29",  // 小程序ID  
    Secretbbg: "049a8de3570549539a0f699cccff34d3",  // 小程序Secret
    Mch_idbbg: "1493211202", // 商户号
    pay_api_keybbg: 'babaogongjiudian1234567891234567', // 商户key
    ACSPrefixbbg:'https://api.weixin.qq.com/cgi-bin/',
    token:null,
    // 生成商户订单号
    getWxPayOrdrID: function () {
      var myDate = new Date();
      var year = myDate.getFullYear();
      var mouth = myDate.getMonth() + 1;
      var day = myDate.getDate();
      var hour = myDate.getHours();
      var minute = myDate.getMinutes();
      var second = myDate.getSeconds();
      var msecond = myDate.getMilliseconds(); //获取当前毫秒数(0-999)
      if (mouth < 10) { /*月份小于10  就在前面加个0*/
        mouth = String(String(0) + String(mouth));
      }
      if (day < 10) { /*日期小于10  就在前面加个0*/
        day = String(String(0) + String(day));
      }
      if (hour < 10) { /*时小于10  就在前面加个0*/
        hour = String(String(0) + String(hour));
      }
      if (minute < 10) { /*分小于10  就在前面加个0*/
        minute = String(String(0) + String(minute));
      }
      if (second < 10) { /*秒小于10  就在前面加个0*/
        second = String(String(0) + String(second));
      }
      if (msecond < 10) {
        msecond = String(String(00) + String(second));
      } else if (msecond >= 10 && msecond < 100) {
        msecond = String(String(0) + String(second));
      }
  
      var currentDate = String(year) + String(mouth) + String(day) + String(hour) + String(minute) + String(second) + String(msecond);
      return currentDate;
    }
  };
  module.exports = wxConfig;