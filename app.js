var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var URL = require('url')
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const fs = require('fs');
var busboy = require('connect-busboy');
var app = express();
var https = require('https');
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
var dbname = require('./global/global');
var DBHelper = require('./DBHelper/DBHelper');
var pub = require('./pub/pub');
var wxConfig = require('./pub/wxConfig');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/uploadimg', express.static(path.join(__dirname, 'uploadimg')));
app.use('/previewimg', express.static(path.join(__dirname, 'previewimg')));
app.use('/previewimgbigger', express.static(path.join(__dirname, 'previewimgbigger')));
app.use('/qrcode', express.static(path.join(__dirname, 'qrcode')));
app.use('/WechatAPI', express.static(path.join(__dirname, 'WechatAPI')));
app.use('/utils', express.static(path.join(__dirname, 'utils')));
app.use('/test', express.static(path.join(__dirname, 'test/xiaoheNodeJs')));
app.use('/.well-known/pki-validation', express.static(path.join(__dirname, '/.well-known/pki-validation')));
app.set('view engine', 'pug');
app.use(busboy());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
// app.use('/', indexRouter);
app.use('/users', usersRouter);
app.get('/', (req, res) => {
  res.write('这是八宝贡')
});
app.get('/checkUser', (req, res) => {
  var utils = require('./utils/utils.js')
  utils.sign(req, res);
});

app.get('/api/wxpay', function (req, res) {
  res.send('Hello World');
})

app.use('/pay', function (req, res) {
  var u = URL.parse(req.url, true, true)
  var code = u.query.usercode
  var openid = u.query.openid
  var goodsData = u.query.goodsData
  var price = u.query.price
  var clfrom = u.query.clfrom
  var pay = require('./pub/pay');
  pay.preparepay(req, res, code, openid, goodsData, price, clfrom)
});

app.use('/bbgpay', function (req, res) {
  var u = URL.parse(req.url, true, true)
  var code = u.query.usercode
  var openid = u.query.openid
  var goodsData = u.query.goodsData
  var price = u.query.price
  var clfrom = u.query.clfrom
  var pay = require('./pub/pay');
  pay.preparepay(req, res, code, openid, goodsData, price, clfrom)
});

app.use('/sendwxmsgtoadmin', function (req, res) {
  var u = URL.parse(req.url, true, true)
  var openid = u.query.openid
  var touser = u.query.touser
  var formid = u.query.formid
  var data = JSON.parse(u.query.data)
  DBHelper.GetOnService('formid', { 'openid': touser }, u.query.clfrom).then(function (value) {
    console.log(value[0])
    var formids = JSON.parse(value)[0]
    var sendData = {
      touser: touser,	//要通知的用户的openID
      form_id: formids['formid'],	//保存的form_id,因为编辑器无法获取到，只能真机测试才可以，所以只能从真机测试后拿过来写死
      template_id: wxConfig.templateid,	//模板id
      data: data
    };
    pub.getJsapiTicket(touser, u.query.clfrom).then(function (val) {
      console.log(val)
      var url = "https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=" + val
      var request = require('request');
      request({
        url: url,
        method: 'POST',
        json: true,
        headers: {
          "content-type": "application/json",
        },
        body: sendData,
      }, function (err, wxResponse, body) {
        // 微信返回的数据也是 xml, 使用 xmlParser 将它转换成 js 的对象
        if (!err && wxResponse.statusCode == 200) {
          if (formids[0] && formids[0]._id != '')
            DBHelper.DeleteOnService('formid', formids[0]._id, u.query.clfrom)
          res.send('成功');
        }
      })
    })
  })
});

function qrfilecreate(name) {
  return fs.createWriteStream(__dirname + '/' + name);
}

app.use('/qrcodeset', function (req, res) {
  var u = URL.parse(req.url, true, true)
  var openid = u.query.openid
  var clfrom = 'bbg'
  console.log(openid)
  var page = u.query.page
  DBHelper.GetOnService('User', { 'openid': openid }, u.query.clfrom).then(function (value) {
    var text = JSON.parse(value)
    var filename = text[0]._id
    var sendData = {
      scene: filename,	//要通知的用户的openID
      page: page,
      width: 280
    };
    pub.getJsapiTicket(openid, u.query.clfrom).then(function (val) {
      var url = "https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=" + val
      var request = require('request');
      var path = __dirname + '/qrcode/' + clfrom + '/' + filename + '.jpg'
      var writeStream = fs.createWriteStream(path, { autoClose: true })
      request({
        url: url,
        method: 'POST',
        json: true,
        headers: {
          "content-type": "application/json",
        },
        body: sendData,
      }, function (err, response, body) {
        console.log(err)
      }).pipe(writeStream)
      writeStream.on('error', function (e) {
        console.log(e)
        console.log('文件写入失败')
      })
      writeStream.on('finish', function () {
        console.log('文件写入成功')
      })
      res.send(JSON.stringify(filename));
    })
  })
})

app.use('/checkimg', function (req, res) {

  var u = URL.parse(req.url, true, true)
  var openid = u.query.openid
  var img = u.query.img
  console.log(img)
  var sendData = {
    media: img,
  };
  pub.getJsapiTicket(openid, u.query.clfrom).then(function (val) {
    var url = "https://api.weixin.qq.com/wxa/img_sec_check?access_token=" + val
    var request = require('request');
    request({
      url: url,
      method: 'POST',
      json: true,
      headers: {
        "content-type": "application/octet-stream",
      },
      body: sendData,
    }, function (err, wxResponse, body) {
      // 微信返回的数据也是 xml, 使用 xmlParser 将它转换成 js 的对象
      if (!err && wxResponse.statusCode == 200) {
        console.log(wxResponse.errCode)
        console.log(body)
        res.send(JSON.stringify(body));
      }
    })
  })
});

app.use('/sendwxmsg', function (req, res) {

  var u = URL.parse(req.url, true, true)
  var openid = u.query.openid
  var touser = u.query.touser
  var formid = u.query.formid
  var data = JSON.parse(u.query.data)
  var sendData = {
    touser: openid,	//要通知的用户的openID
    form_id: formid,	//保存的form_id,因为编辑器无法获取到，只能真机测试才可以，所以只能从真机测试后拿过来写死
    template_id: wxConfig.templateid,	//模板id
    data: data
  };
  pub.getJsapiTicket(openid, u.query.clfrom).then(function (val) {
    console.log(val)
    var url = "https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=" + val
    var request = require('request');
    request({
      url: url,
      method: 'POST',
      json: true,
      headers: {
        "content-type": "application/json",
      },
      body: sendData,
    }, function (err, wxResponse, body) {
      // 微信返回的数据也是 xml, 使用 xmlParser 将它转换成 js 的对象
      if (!err && wxResponse.statusCode == 200) {
        console.log(wxResponse.errCode)
        console.log(body)
        res.send('成功');
      }
    })
  })
});


app.use('/moneyback', function (req, res) {
  var u = URL.parse(req.url, true, true)
  var code = u.query.usercode
  var openid = u.query.openid
  var goodsData = u.query.goodsData
  var price = u.query.price
  var orderno = u.query.orderno
  var pay = require('./pub/pay');
  pay.moneyback(req, res, openid, goodsData, price, orderno)
});

app.use('/bbgmoneyback', function (req, res) {
  var u = URL.parse(req.url, true, true)
  var code = u.query.usercode
  var openid = u.query.openid
  var goodsData = u.query.goodsData
  var price = u.query.price
  var orderno = u.query.orderno
  var clfrom = 'bbg'
  var pay = require('./pub/pay');
  pay.moneyback(req, res, openid, goodsData, price, orderno, clfrom)
});

app.use('/saveMsg', function (req, res) {
  var moment = require('moment');
  var u = URL.parse(req.url, true, true)
  console.log(u)
  var title = u.query.title
  var content = u.query.content
  var openid = u.query.openid
  var read = false
  var refreshtime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
  var data = { 'title': title, 'content': content, 'openid': openid, 'refreshtime': refreshtime, 'read': read }
  var DBHelper = require('./DBHelper/DBHelper');
  DBHelper.SaveOnService('Msg', data, u.query.clform)
});

app.use('/getMsgCount', function (req, res) {
  console.log('信息条数')
  var u = URL.parse(req.url, true, true)
  var openid = u.query.openid
  var clfrom = ''
  if (u.query.clform)
    clfrom = u.query.clform
  var data = { 'openid': openid, 'read': false }
  var DBHelper = require('./DBHelper/DBHelper');
  var result = DBHelper.selectSthCountOnService('Msg', data, res, clfrom)
});

app.use('/modifyMsgRead', function (req, res) {
  console.log('信息条数')
  var u = URL.parse(req.url, true, true)
  var id = u.query.id
  var ObjectId = require('mongodb').ObjectID;
  let _id = ObjectId(id);
  var eidtdata = { '_id': _id }
  var setdata = { 'read': true }
  var result = DBHelper.EditOnService('Msg', eidtdata, setdata, u.query.clform)
});

app.use('/getIndexServices', function (req, res) {
  var u = URL.parse(req.url, true, true)
  var data = u.query
  DBHelper.selectInfoBookonServer(res, req, data)
});

app.use('/selectGetSumonServer', function (req, res) {
  var u = URL.parse(req.url, true, true)
  var data = u.query
  DBHelper.selectGetSumonServer(res, req, data)
});

app.get('/registerUser', function (req, res) {
  var msgrec = JSON.parse(req.data);
  var sth = new Array(msgrec['infoData']);

  var MongoClient = require("mongodb").MongoClient;
  var url = "mongodb://localhost:27017/bbg";
  MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    //client参数就是连接成功之后的mongoclient(个人理解为数据库客户端)
    if (err) {
      console.log("数据库连接失败");
      MongoClient.close;
      return;
    }
    console.log("数据库连接成功");
    //3.0新写法
    var clientdb = client.db(dbname.dbname);
    var collection = clientdb.collection('XiaoHe');
    collection.insertMany(sth);
  });
});
app.post('/profile', function (req, res) {
  var fstream;
  var u = URL.parse(req.url, true, true)
  var clfrom = u.query.clfrom

  req.pipe(req.busboy);
  req.busboy.on('formData', function (data) {
    console.log("dd: " + data);
  });
  req.busboy.on('file', function (fieldname, file, filename) {
    var fstream;
    if (clfrom && (clfrom != ''))
      filename = clfrom + '\\' + filename
    var filepath = __dirname + '\\uploadimg\\' + filename;
    fstream = fs.createWriteStream(filepath);
    fstream.on('error', function (err) {
      console.log(String(err));
      file.unpipe();
      fstream.end();
      res.send(filename + ' uploadding failed.');
    });

    file.pipe(fstream);
    fstream.on('close', function () {
      res.send(filename + ' uploadding success.');
      var gm = require('gm');
      gm(filepath)
        .resize(360, 400)     //设置压缩后的w/h
        .setFormat('JPEG')
        .quality(80)       //设置压缩质量: 0-100
        .write(__dirname + "\\previewimgbigger\\" + filename,
          function (err) { console.log("err: " + err); });
      gm(filepath)
        .resize(80, 80)     //设置压缩后的w/h
        .setFormat('JPEG')
        .quality(70)       //设置压缩质量: 0-100
        .write(__dirname + "\\previewimg\\" + filename,
          function (err) { console.log("err: " + err); });
    });
  });

});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  console.log('请求');
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;

