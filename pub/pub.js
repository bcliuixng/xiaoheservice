

function timeFormat(timestemp) {
    console.log(timestemp)
    var moment = require('moment');
    moment.locale('zh-cn');
    var newFormat = null;
    var oldformat = moment(timestemp);

    if (oldformat.format('YYYYMMDD') == moment(Date.now()).format('YYYYMMDD'))
        newFormat = oldformat.format('今天 HH:mm:ss');
    else
        if (oldformat.format('YYYYMMDD') == moment(Date.now()).subtract(1, 'days').format('YYYYMMDD'))
            newFormat = oldformat.format('昨天 HH:mm:ss');
        else
            newFormat = oldformat.format('MM月DD日 HH:mm:ss')
    return newFormat;
}

function getOpenID(message, wss) {
    var https = require('https');
    var DBHelper = require('../DBHelper/DBHelper');
    var pub = require('../pub/pub');
    var wxConfig = require('./wxConfig');
    var sql = JSON.parse(message)
    var code = sql['code'];
    var cltfrom = sql['clfrom'];
    var appid = ''
    var secret = ''
    switch (cltfrom) {
        case 'bbg':
            {
                appid = wxConfig.AppIDbbg
                secret = wxConfig.Secretbbg
            }
            break;
        default:
            {
                appid = wxConfig.AppID
                secret = wxConfig.Secret
            }
    }

    var moment = require('moment');
    var nowtime = new Date().getTime();
    var postData = require("querystring").stringify({
        'msg': 'Hello World!'
    });

    var options = {
        hostname: 'api.weixin.qq.com',
        path: '/sns/jscode2session?appid=' + appid + '&secret=' + secret + '&grant_type=authorization_code&js_code=' + code,
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Accept-Charset": "utf-8",
            'Content-Length': postData.length
        }
    };
    let url = 'https://' + options.hostname + options.path;
    console.log('post: ' + url);
    https.get(url, function (res) {
        //console.log('code: ' + response.code + ', body: ' + response.body);
        res.setEncoding('utf8');
        res.on('data', function (data) {
            console.log(data)
            var sth = JSON.parse(data)
            var tocken = sth.session_key
            DBHelper.GetOnService('UserCode', { 'openid': sth["openid"] }, sql.clfrom).then(function (val) {
                if (val && val[0] && val[0]["openid"]) {
                    DBHelper.EditOnService('UserCode', { 'openid': sth["openid"] }, { 'accessToken': tocken, 'time': nowtime }, sql.clfrom)
                }
                else
                    DBHelper.SaveOnService('UserCode', { 'openid': sth["openid"], 'accessToken': tocken, 'time': nowtime }, sql.clfrom)
            })
            wss.send(sth["openid"], (err) => {
                if (err) {
                    console.log(err);
                    wss.close();
                }
            });
        });
    });
};

function isEmptyObject(obj) {
    for (var key in obj) {
        return false;
    }
    return true;
}

function getJsapiTicket(openid, sql) {
    return new Promise(function (resolve, reject) {
        var DBHelper = require('../DBHelper/DBHelper');
        DBHelper.GetOnService('UserCode', { 'openid': openid }, sql).then(function (val) {

            var wxConfig = require('../pub/wxConfig');
            var DBHelper = require('../DBHelper/DBHelper');
            var session = JSON.parse(val);
            var nowtime = new Date().getTime();
            var ACSPrefix = '', AppID = '', Secret = ''
            switch (sql) {
                case 'bbg':
                    {
                        ACSPrefix = wxConfig.ACSPrefixbbg, AppID = wxConfig.AppIDbbg, Secret = wxConfig.Secretbbg
                    };break;
                case '':
                    {
                        ACSPrefix = wxConfig.ACSPrefix, AppID = wxConfig.AppID, Secret = wxConfig.Secret
                    };break;
            }
            if (session.length > 0) {
                console.log('sjk')
                var time = new Date(session[0]['time']).getTime()
                var timediffer = (nowtime - time) / 1000
                if (timediffer > 0 && timediffer < 7200) {
                    DBHelper.EditOnService('UserCode', { 'openid': openid }, { 'time': nowtime }, sql);
                    resolve(session[0]['accessToken']);
                }
                else {
                    console.log('获取')
                    var url = ACSPrefix + "token?grant_type=client_credential&appid=" + AppID + "&secret=" + Secret;
                    var request = require('request');
                    request.get(url, function (error, response, body) {
                        var tocken = JSON.parse(body).access_token;
                        DBHelper.EditOnService('UserCode', { 'openid': openid }, { 'accessToken': tocken, 'time': nowtime }, sql);
                        resolve(tocken);
                    })
                }
            }
            else {
                var url = ACSPrefix + "token?grant_type=client_credential&appid=" + AppID + "&secret=" + Secret;
                var request = require('request');
                request.get(url, function (error, response, body) {
                    var DBHelper = require('../DBHelper/DBHelper');
                    console.log(error)
                    var tocken = JSON.parse(body).access_token;
                    DBHelper.SaveOnService('UserCode', { 'openid': openid, 'accessToken': tocken, 'time': nowtime }, sql);
                    resolve(body);
                })
            }
        })

    })
}

var activeGenerator;

// 处理 g.next() 功能
function gNext() {
    return function (err, data) {
        if (err) {
            throw err;
        }
        // 前文中的 g.next()，并把回调函数的结果作为参数传递给 yield
        activeGenerator.next(data)
    }
}

// 控制工具
function gQueue(generatorFunc) {
    activeGenerator = generatorFunc(gNext());
    activeGenerator.next();
}

function asyncFunc(cb) {
    // 这个函数模拟一个异步操作，将在 1 秒后触发回调函数
    setTimeout(function () {
        cb(null, 100);
    }, 3200)
}

function asyncFuncindex(cb) {
    // 这个函数模拟一个异步操作，将在 1 秒后触发回调函数
    setTimeout(function () {
        cb(null, 50);
    }, 1000)
}

function asyncFunc200(cb) {
    // 这个函数模拟一个异步操作，将在 1 秒后触发回调函数
    setTimeout(function () {
        cb(null, 200);
    }, 200)
}

function asyncFunc1(cb) {
    // 这个函数模拟一个异步操作，将在 1 秒后触发回调函数
    setTimeout(function () {
        cb(null, 300);
    }, 300)
}

function getQrcode(message, wss) {
    var accessToken = ''
    var utils = require('../utils/utils')
    var config = require('../pub/wxConfig')
    var wechatApi = require('../pub/wechatAPI')
    //根据token从redis中获取access_token
    utils.get(config.token).then(function (data) {
        //获取到值--往下传递
        if (data) {
            return Promise.resolve(data);
        }
        //没获取到值--从微信服务器端获取,并往下传递
        else {
            return wechatApi.updateAccessToken();
        }
    }).then(function (data) {
        console.log(data);
        //没有expire_in值--此data是redis中获取到的
        if (!data.expires_in) {
            console.log('redis获取到值');
            accessToken = data;
            getwxcode(accessToken)
        }
        //有expire_in值--此data是微信端获取到的
        else {
            console.log('redis中无值');
			/**
			 * 保存到redis中,由于微信的access_token是7200秒过期,
			 * 存到redis中的数据减少20秒,设置为7180秒过期
			 */
            utils.set(config.token, `${data.access_token}`, 7180).then(function (result) {
                if (result == 'OK') {
                    accessToken = data.access_token;
                    getwxcode(accessToken)
                }
            })
        }

    })
}

function getwxcode(access_token) {	//通过access_token获取小程序二维码
    //方法1：利用http请求

    var postData = require("querystring").stringify({
        'msg': 'Hello World!'
    });
    var options = {
        hostname: "api.weixin.qq.com",
        path: "/wxa/getwxacodeunlimit?access_token=" + access_token,
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept-Charset": "utf-8",
            'Content-Length': postData.length
        }
    };
    var https = require('https');
    let url = 'https://' + options.hostname + options.path;
    https.request(url, res => {
        //res.setEncoding("binary");
        var imgData = "";
        if (err)
            console.log('problem with request: ' + e.message);
        console.log(res);
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            imgData += chunk;
            console.log('im‘gData')
        });
        res.on("end", function () {
            console.log(imgData)
            //   fs.writeFile("./wx_qcode3.jpg", imgData, "binary", function (err) {
            //         if (err) {
            //             console.log("down fail");
            //         }
            //         console.log("down success");
            //     });
        });
    });
}

function getAccessToken(message, wss) {
    var https = require('https');
    var code = JSON.parse(message)['code'];
    var postData = require("querystring").stringify({
        'msg': 'Hello World!'
    });
    var options = {
        hostname: 'api.weixin.qq.com',
        path: '/sns/jscode2session?grant_type=client_credential&appid=wx656e20e7d21db7a5&secret=9b405582a8cbc0e718043a7ee8a168df&js_code=' + code,
        method: 'GET',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept-Charset": "utf-8",
            'Content-Length': postData.length
        }
    };

    let url = 'https://' + options.hostname + options.path;
    console.log('post: ' + url);
    https.get(url, function (res, err) {
        //console.log('code: ' + response.code + ', body: ' + response.body);
        if (err)
            console.log('problem with request: ' + e.message);
        console.log(res);
        res.setEncoding('utf8');
        res.on('data', function (data) {
            wss.send(JSON.parse(data)['session_key'], (err) => {
                if (err) {
                    console.log(err);
                    wss.close();
                }
            });
        });
        res.on('error', function (e) {
            console.log('problem with request: ' + e.message);
        });

    });
}

function getAccessTokenOnServer() {

}

async function sendMsgToUser(message, wss) {
    var wechatAPI = require('wechat-api');
    var appid = 'wx656e20e7d21db7a5';
    var appsercret = '9b405582a8cbc0e718043a7ee8a168df';
    var api = new wechatAPI(appid, appsercret);
    var openid = JSON.parse(message)['openid'];
    var templateId = '9TOh2mUqzgmI2Tt6Ei1DN2OF0_sUxR1OtwUDT4Gg8ZI';
    var accesstocken = null;
    var code = JSON.parse(message)['code'];
    var formid = JSON.parse(message)['formid'];
    try {
        var promise = new Promise(function (resolve, reject) {
            var https = require('https');
            var postData = require("querystring").stringify({
                'msg': 'Hello World!'
            });
            var options = {
                hostname: 'api.weixin.qq.com',
                path: '/api.weixin.qq.com/cgi-bin/component/api_component_token?scope=snsapi_userinfo&grant_type=client_credential&appid=wx656e20e7d21db7a5&secret=9b405582a8cbc0e718043a7ee8a168df&js_code=' + code,
                method: 'GET',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept-Charset": "utf-8",
                    'Content-Length': postData.length
                }
            };

            let url = 'https://' + options.hostname + options.path;
            console.log('post: ' + url);
            https.get(url, function (res, err) {
                //console.log('code: ' + response.code + ', body: ' + response.body);
                if (err)
                    console.log('problem with request: ' + e.message);
                console.log(res);
                res.setEncoding('utf8');
                res.on('data', function (data) {
                    //console.log('令牌'+JSON.parse(data)['access_token']);
                    resolve(JSON.parse(data)['access_token'])
                });
                res.on('error', function (e) {
                    reject('problem with request: ' + e.message);
                });

            });
            return promise;
        }, function (error) {
            reject(error);
        })
        promise.then(function (val) {
            accesstocken = val;
            console.log('1111' + accesstocken);
            let redis_conf = {
                host: 'localhost',
                port: 6379,
                password: ''
            }
            let wechat_param = {
                appid: 'wx656e20e7d21db7a5',
                appsecret: '9b405582a8cbc0e718043a7ee8a168df',
                touser: JSON.parse(message)['openid'],
                template_id: templateId,
                url: 'https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?scope=snsapi_userinfo&access_token=' + accesstocken,
                data: {
                    "first": {
                        "value": "恭喜你购买成功！",
                        "color": "颜色#173177"
                    },
                    "keyword1": {
                        "value": "产品名称",
                        "color": "颜色#173177"
                    },
                    "keyword2": {
                        "value": "订单号",
                        "color": "颜色#173177"
                    }

                }
            }
            const wechat_template = require('wechat-template')

            wechat_template(redis_conf, wechat_param, function (err) {
                console.log('发生错误' + err);
            })
                .then(function (body) {
                    console.log(body)
                    console.log('啊哈');
                    // { errcode: 0, errmsg: 'ok', msgid: 413823689 }
                })

            // success
        }, function (error) {
            console.log(error);
        });
    }
    catch (err) {
        console.log(err);
    }
}

function setSession(sessionID, val, settime) {
    var redis = require("redis"),
        client = redis.createClient();
    settime = new Date().getTime();
    //写入JavaScript(JSON)对象
    client.hmset(sessionID, { name: val, time: settime }, function (err) {
        console.log(err)
    })
}

function getSession(sessionID) {
    return new Promise(function (resolve, reject) {
        var redis = require("redis"),
            client = redis.createClient();

        //读取JavaScript(JSON)对象
        client.hgetall(sessionID, function (err, object) {
            resolve(object);
        })
    })
}

//功能：计算两个时间戳之间相差的日时分秒
//$begin_time  开始时间戳
//$end_time 结束时间戳
function timediff(begin_time, end_time) {
    if (begin_time < end_time) {
        starttime = begin_time;
        endtime = end_time;
    } else {
        starttime = end_time;
        endtime = begin_time;
    }

    //计算天数
    var timediff = endtime - starttime;
    var days = parseInt(timediff / 86400);
    //计算小时数
    var remain = timediff % 86400;
    var hours = parseInt(remain / 3600);
    //计算分钟数
    var remain = remain % 3600;
    var mins = parseInt(remain / 60);
    //计算秒数
    var secs = remain % 60;
    var res = { "day": days, "hour": hours, "min": mins, "sec": secs };
    return res;
}

module.exports = {
    getOpenID: getOpenID,
    timeFormat: timeFormat,
    getAccessToken: getAccessToken,
    sendMsgToUser: sendMsgToUser,
    setSession: setSession,
    getSession: getSession,
    timediff: timediff,
    getQrcode: getQrcode,
    getJsapiTicket: getJsapiTicket
}