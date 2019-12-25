function preparepay(req, res, code, openid, goodsData, price, clfrom) {
    var param = req.query || req.params;
    var openid = param.openid;
    var AppID = '', Mch_id = ''
    var wxConfig = require('../pub/wxConfig');
    var notify_url = 'https://gnxiaohe.club/pay'// 支付成功的回调地址  可访问 不带参数
    switch (clfrom) {
        case 'bbg':
            {
                AppID = wxConfig.AppIDbbg
                Mch_id = wxConfig.Mch_idbbg
                pay_api_key = wxConfig.pay_api_keybbg
                notify_url = 'https://gnxiaohe.club/'+clfrom+'pay'
            } break;
        default: {
            AppID = wxConfig.AppID
            Mch_id = wxConfig.Mch_id
            pay_api_key = wxConfig.pay_api_key
            notify_url = 'https://gnxiaohe.club/pay'
        }
            break;
    }
    const attach = 'GJS-ORG'
    
    var nonce_str = getNonceStr(); // 随机字符串
    var total_fee = price; // 订单价格 单位是 分
    var body = '支付测试'
    // 生成商家内部自定义的订单号, 商家内部的系统用的, 不用 attach 加入也是可以的
    const out_trade_no = getTradeId(attach)
    var spbill_create_ip = req.connection.remoteAddress.replace(/::ffff:/, '');
    // 生成签名


    var sign = paysignjsapi(AppID, body, Mch_id, nonce_str, notify_url, openid, out_trade_no, spbill_create_ip, total_fee, pay_api_key)

    //将微信需要的数据拼成 xml 发送出去
    const sendData = wxSendData(AppID, body, Mch_id, nonce_str, notify_url, openid, out_trade_no, spbill_create_ip, total_fee, sign, pay_api_key)
    // 使用 axios 发送数据带微信支付服务器, 没错, 后端也可以使用 axios
    var request = require('request');
    request({
        url: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(sendData)
    }, function (err, wxResponse, body) {
        // 微信返回的数据也是 xml, 使用 xmlParser 将它转换成 js 的对象
        if (!err && wxResponse.statusCode == 200) {
            var prepay_id = getXMLNodeValue('prepay_id', body.toString("utf-8"));
            if (prepay_id == '')
                return;
            var tmp = prepay_id.split('[');
            var tmp1 = tmp[2].split(']');
            var timestamp = parseInt(new Date().getTime() / 1000);
            //签名
            var _paySignjs = paysignjs(AppID, nonce_str, 'prepay_id=' + tmp1[0], 'MD5', timestamp,pay_api_key);
            var o = {
                paySign: _paySignjs,
                timeStamp: '' + timestamp + '',
                nonceStr: nonce_str,
                package: 'prepay_id=' + tmp1[0],
                signType: 'MD5',
                out_trade_no: out_trade_no
            }
            res.send(o);
        }
    }
    )
}

function moneyback(req, res, openid, goodsData, price, orderno,clfrom) {
    var wxConfig = require('../pub/wxConfig');
    var param = req.query || req.params;
    var AppID = wxConfig.AppID;
    var openid = param.openid;
    var Mch_id = wxConfig.Mch_id;
    
    const attach = 'GJS-ORG'
    var notify_url = 'https://gnxiaohe.club/moneyback' // 支付成功的回调地址  可访问 不带参数
    var nonce_str = getNonceStr(); // 随机字符串
    var total_fee = price; // 订单价格 单位是 分
    var body = '支付测试'
    // 生成商家内部自定义的订单号, 商家内部的系统用的, 不用 attach 加入也是可以的
    const out_trade_no = orderno
    const out_refund_no = getBackmoneyNo(attach)
    const refund_fee = param.backprice;
    var spbill_create_ip = req.connection.remoteAddress.replace(/::ffff:/, '');
    switch (clfrom) {
        case 'bbg':
            {
                AppID = wxConfig.AppIDbbg
                Mch_id = wxConfig.Mch_idbbg
                pay_api_key = wxConfig.pay_api_keybbg
                notify_url = 'https://gnxiaohe.club/'+clfrom+'pay'
            } break;
        default: {
            AppID = wxConfig.AppID
            Mch_id = wxConfig.Mch_id
            pay_api_key = wxConfig.pay_api_key
            notify_url = 'https://gnxiaohe.club/pay'
        }
            break;
    }
    // 生成签名


    var sign = paysignjsapiMB(AppID, Mch_id, nonce_str, notify_url, out_trade_no, total_fee, out_refund_no, refund_fee,pay_api_key)

    //将微信需要的数据拼成 xml 发送出去
    const sendData = wxSendDataMB(AppID, Mch_id, nonce_str, notify_url, out_trade_no, total_fee, sign, out_refund_no, refund_fee)
    // 使用 axios 发送数据带微信支付服务器, 没错, 后端也可以使用 axios
    var path = require('path');
    const fs = require('fs');
    var request = require('request');
    request({
        url: wxConfig.ApiRoot + '/secapi/pay/refund',
        agentOptions: {
            cert: fs.readFileSync('./ssl/'+clfrom+'apiclient_cert.pem', 'utf8'),
            key: fs.readFileSync('./ssl/'+clfrom+'apiclient_key.pem', 'utf8'),
        },
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(sendData)
    }, function (err, wxResponse, body) {
        // 微信返回的数据也是 xml, 使用 xmlParser 将它转换成 js 的对象
        if (!err && wxResponse.statusCode == 200) {
            console.log('退款成功')
            console.log(body)
            res.send(JSON.stringify(body));
        }
    }
    )
}

function getXMLNodeValue(node_name, xml) {
    var tmp = xml.split("<" + node_name + ">");
    if (!tmp[1])
        return ''
    var _tmp = tmp[1].split("</" + node_name + ">");
    return _tmp[0];
}
// 预定义的一些工具函数
function getNonceStr() {
    var text = ""
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    for (var i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}

function getTradeId(attach) {
    var date = new Date().getTime().toString()
    var text = ""
    var possible = "0123456789"
    for (var i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    var tradeId = 'bbg_' + attach + '_' + date + text
    return tradeId
}

function getBackmoneyNo(attach) {
    var date = new Date().getTime().toString()
    var text = ""
    var possible = "0123456789"
    for (var i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    var tradeId = 'bbg_' + attach + '_' + date + text
    return tradeId
}

function wxSendData(appid, body, mch_id, nonce_str, notify_url, openid, out_trade_no, spbill_create_ip, total_fee, sign, pay_api_key) {
    var wxConfig = require('../pub/wxConfig');
    const sendData = '<xml>' +
        '<appid>' + appid + '</appid>' +
        '<body>' + body + '</body>' +
        '<mch_id>' + mch_id + '</mch_id>' +
        '<nonce_str>' + nonce_str + '</nonce_str>' +
        '<notify_url>' + notify_url + '</notify_url>' +
        '<openid>' + openid + '</openid>' +
        '<out_trade_no>' + out_trade_no + '</out_trade_no>' +
        '<spbill_create_ip>' + spbill_create_ip + '</spbill_create_ip>' +
        '<total_fee>' + total_fee + '</total_fee>' +
        '<trade_type>JSAPI</trade_type>' +
        '<sign>' + sign + '</sign>' +
        '</xml>'
    return sendData
}

function wxSendDataMB(appid, mch_id, nonce_str, notify_url, out_trade_no, total_fee, sign, out_refund_no, refund_fee) {
    var wxConfig = require('../pub/wxConfig');
    const sendData = '<xml>' +
        '<appid>' + appid + '</appid>' +
        '<mch_id>' + mch_id + '</mch_id>' +
        '<nonce_str>' + nonce_str + '</nonce_str>' +
        '<out_refund_no>' + out_refund_no + '</out_refund_no>' +
        '<out_trade_no>' + out_trade_no + '</out_trade_no>' +
        '<refund_fee>' + refund_fee + '</refund_fee>' +
        '<total_fee>' + total_fee + '</total_fee>' +
        '<notify_url>' + notify_url + '</notify_url>' +
        '<sign>' + sign + '</sign>' +
        '</xml>'
    return sendData
}

function paysignjsapiMB(appid, mch_id, nonce_str, notify_url, out_trade_no, total_fee, out_refund_no, refund_fee,pay_api_key) {
    var ret = {
        appid: appid,
        mch_id: mch_id,
        nonce_str: nonce_str,
        out_refund_no: out_refund_no,
        out_trade_no: out_trade_no,
        refund_fee: refund_fee,
        total_fee: total_fee,
        notify_url: notify_url,
    };
    var wxConfig = require('../pub/wxConfig');
    var stringA = raw(ret);
    const md5 = require('blueimp-md5')
    let stringSignTemp = stringA + '&key=' + pay_api_key;
    stringSignTemp = md5(stringSignTemp);
    let signValue = stringSignTemp.toUpperCase();
    return signValue
};

function paysignjsapi(appid, body, mch_id, nonce_str, notify_url, openid, out_trade_no, spbill_create_ip, total_fee, pay_api_key) {
    var ret = {
        appid: appid,
        body: body,
        mch_id: mch_id,
        nonce_str: nonce_str,
        notify_url: notify_url,
        openid: openid,
        out_trade_no: out_trade_no,
        spbill_create_ip: spbill_create_ip,
        total_fee: total_fee,
        trade_type: 'JSAPI'
    };
    var wxConfig = require('../pub/wxConfig');
    var stringA = raw(ret);
    const md5 = require('blueimp-md5')
    let stringSignTemp = stringA + '&key=' + pay_api_key;
    stringSignTemp = md5(stringSignTemp);
    let signValue = stringSignTemp.toUpperCase();
    return signValue
};

function raw(args) {
    var keys = Object.keys(args);
    keys = keys.sort();
    var newArgs = {};
    keys.forEach(function (key) {
        newArgs[key.toLowerCase()] = args[key];
    });

    var str = '';
    for (var k in newArgs) {
        str += '&' + k + '=' + newArgs[k];
    }
    str = str.substr(1);
    return str;
};

function paysignjs(appid, nonceStr, package, signType, timeStamp,pay_api_key) {
    var ret = {
        appId: appid,
        nonceStr: nonceStr,
        package: package,
        signType: signType,
        timeStamp: timeStamp
    };
    var str = raw1(ret);
    const md5 = require('blueimp-md5')
    var wxConfig = require('../pub/wxConfig');
    str = str + '&key=' + pay_api_key;
    var stringSignTemp = md5(str);
    let signValue = stringSignTemp.toUpperCase();
    return signValue
};

function raw1(args) {
    var keys = Object.keys(args);
    keys = keys.sort()
    var newArgs = {};
    keys.forEach(function (key) {
        newArgs[key] = args[key];
    });

    var str = '';
    for (var k in newArgs) {
        str += '&' + k + '=' + newArgs[k];
    }
    str = str.substr(1);
    return str;
};

module.exports = {
    preparepay: preparepay,
    moneyback: moneyback
}