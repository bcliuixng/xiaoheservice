var MongoDB = require('MongoDB');
var dbname = require('../global/global');
// 当前的 Generator
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

function SaveOnService(collectionname, infoData, sql) {
    var moment = require('moment');
    var str = infoData
    var sth = new Array(str);
    sth.refreshtime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    var MongoClient = require("mongodb").MongoClient;
    var url = dbname.dbUrl;
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        //client参数就是连接成功之后的mongoclient(个人理解为数据库客户端)
        if (err) {
            console.log("数据库连接失败");
            return;
        }
        console.log("数据库连接成功");
        //3.0新写法
        var clientdb = client.db(dbname.dbName + sql);
        var collection = clientdb.collection(collectionname);
        console.log(sth)
        collection.insertMany(sth, (err, r) => {
            if (r.insertedCount > 0) {
                console.log('服务器数据库保存成功！')
                MongoClient.close;
            }
            else {
                console.log('保存数据失败' + err)
                MongoClient.close;
            }
        });
    });
    console.log('2');
}

function SaveInfo(message, wss) {
    var moment = require('moment');
    var curwss = wss;
    var msgrec = JSON.parse(message);
    var str = msgrec['infoData']
    str.refreshtime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    str.publishtime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    if (msgrec["collection"] == 'MyCollection')
        str.collectiontime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    var sth = new Array(str);

    var MongoClient = require("mongodb").MongoClient;
    var url = dbname.dbUrl;
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        //client参数就是连接成功之后的mongoclient(个人理解为数据库客户端)
        if (err) {
            console.log("数据库连接失败");
            return;
        }
        console.log("数据库连接成功");
        //3.0新写法
        var clientdb = client.db(dbname.dbName + msgrec["clfrom"]);
        var collection = clientdb.collection(msgrec["collection"]);

        collection.insertMany(sth, (err, r) => {
            if (r.insertedCount > 0) {
                console.log(r)
                curwss.send(JSON.stringify({ 'result': '成功', 'data': r }), (err) => {
                    if (err) {
                        console.log(err);
                        MongoClient.close;
                    }
                });
                MongoClient.close;
            }
            else {
                curwss.send(JSON.stringify('失败'), (err) => {
                    if (err) {
                        console.log(err);
                        curwss.close();
                    }
                });
                MongoClient.close;
            }
        });
    });
    console.log('2');
}

function SaveOrder(message, wss) {
    var moment = require('moment');
    var curwss = wss;
    var msgrec = JSON.parse(message);
    var str = msgrec['infoData']
    str.refreshtime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    str.publishtime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    if (msgrec["collection"] == 'MyCollection')
        str.collectiontime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    var ObjectId = require('mongodb').ObjectID;

    if (msgrec["ids"]) {
        str.orderid = ObjectId(msgrec["ids"])
    }
    var sth = new Array(str);

    var MongoClient = require("mongodb").MongoClient;
    var url = dbname.dbUrl;
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        //client参数就是连接成功之后的mongoclient(个人理解为数据库客户端)
        if (err) {
            console.log("数据库连接失败");
            return;
        }
        console.log("数据库连接成功");
        //3.0新写法
        var clientdb = client.db(dbname.dbName + msgrec["clfrom"]);
        var collection = clientdb.collection(msgrec["collection"]);
        var orders = []
        collection.insertMany(sth, (err, r) => {
            if (r.insertedCount > 0) {
                var ObjectId = require('mongodb').ObjectID;
                console.log(r.insertedIds)
                curwss.send(JSON.stringify({ 'result': '成功', 'id': r.insertedIds }), (err) => {
                    if (err) {
                        console.log(err);
                        MongoClient.close;
                    }
                })
                MongoClient.close
            }
            else {
                curwss.send(JSON.stringify('失败'), (err) => {
                    if (err) {
                        console.log(err);
                        curwss.close();
                    }
                });
                MongoClient.close;
            }
        });

    });
    console.log('2');
}

function getSearchCount(message, wss) {
    var sql = JSON.parse(message);
    var resultStr = null;
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        console.log('client need:' + sql);
        var clientdb = client.db(dbname.dbName + sql["clfrom"]);
        var collection = clientdb.collection(sql["collection"]);
        var sqlArr = sql['infoData'];
        collection.find(sqlArr).toArray(function (err, docs) {
            if (err) {
                console.log(err);
                MongoClient.close;
            }
            resultStr = docs;
            console.log('service get:' + docs);
            if (docs) {
                curwss.send(JSON.stringify(docs.Count), (err) => {
                    if (err) {
                        console.log(err);
                        curwss.close();
                    }
                    MongoClient.close;
                });
                MongoClient.close;
            }
        });
    });

};

function DeleteOnService(name, id, sql) {
    //var cursql = message.substring(message.indexOf('\"infoData\"') + 11, message.length - 1);
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        var clientdb = client.db(dbname.dbName + sql);
        var collection = clientdb.collection(name);
        var ids = id.split(',');
        var objids = [];
        for (var item = 0; item < ids.length; item++) {
            var ObjectId = require('mongodb').ObjectID;
            let _id = ObjectId(ids[item]);
            objids.push(_id);
        }
        var idsarray = { _id: { $in: objids } };
        collection.deleteMany(idsarray, function (err, docs) {
            if (err) {
                console.log(err);
                MongoClient.close;
            }

            if (docs.deletedCount > 0) {
                MongoClient.close;
                console.log('删除记录');
            }
        });
    });

};

function deleteInfo(message, wss) {
    //var cursql = message.substring(message.indexOf('\"infoData\"') + 11, message.length - 1);
    var sql = JSON.parse(message);
    var resultStr = null;
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        console.log('client need:' + sql);
        var clientdb = client.db(dbname.dbName + sql["clfrom"]);
        var collection = clientdb.collection(sql["collection"]);
        var ids = sql["ids"].split(',');
        var objids = [];
        for (var item = 0; item < ids.length; item++) {
            var ObjectId = require('mongodb').ObjectID;
            let _id = ObjectId(ids[item]);
            objids.push(_id);
        }
        var idsarray = { _id: { $in: objids } };
        collection.deleteMany(idsarray, function (err, docs) {
            if (err) {
                console.log(err);
                MongoClient.close;
            }
            console.log('service get:' + docs);
            if (docs.deletedCount > 0) {
                curwss.send(JSON.stringify('成功'), (err) => {
                    if (err) {
                        console.log(err);
                        curwss.close();
                    }
                    MongoClient.close;
                });
                MongoClient.close;
            }
        });
    });

};

function selectOneCommen(message, wss) {
    //var cursql = message.substring(message.indexOf('\"infoData\"') + 11, message.length - 1);
    var sql = JSON.parse(message);
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        console.log('client need:' + sql);
        var clientdb = client.db(dbname.dbName + sql["clfrom"]);
        var collection = clientdb.collection(sql["collection"]);
        var ObjectId = require('mongodb').ObjectID;
        let _id = ObjectId(sql["_id"]);
        var array = { _id: _id };
        console.log(_id);
        collection.find(array).limit(1).toArray(function (err, docs) {
            if (err)
                console.log(err);

            if (docs) {
                console.log(docs)
                curwss.send(JSON.stringify(docs), (err) => {
                    if (err) {
                        console.log(err);
                        curwss.close();
                    }
                    MongoClient.close;
                });
            }
        })
    });

};

function selectOne(message, wss) {
    //var cursql = message.substring(message.indexOf('\"infoData\"') + 11, message.length - 1);
    var sql = JSON.parse(message);
    var resultStr = null;
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;
    var timeFormat = require('../pub/pub.js');
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        console.log('client need:' + sql);
        var clientdb = client.db(dbname.dbName + sql["clfrom"]);
        var collection = clientdb.collection(sql["collection"]);
        var ObjectId = require('mongodb').ObjectID;
        let _id = ObjectId(sql["_id"]);
        var array = { _id: _id };
        console.log(_id);
        var query = collection.aggregate([
            { $match: sql["infoData"] },
            { $match: array },
            { $lookup: { from: 'User', localField: 'openid', foreignField: 'openid', as: 'User' } },
            {
                $project: {
                    _id: 1,
                    "allFileName": 1,
                    "contactor": 1,
                    "contactmethod": 1,
                    "address": 1,
                    "street_number": 1,
                    "latitude": 1,
                    "longitude": 1,
                    "OutOfLine": 1,
                    "openid": 1,
                    "infotype": 1,
                    "audited": 1,
                    "viewed": 1,
                    "praised": 1,
                    "istoped": 1,
                    content: titleFormat("$content"),
                    "refreshtime": 1,
                    "publishtime": 1,
                    nickName: "$User.nickName",
                    avatarUrl: "$User.avatarUrl"
                }
            }
        ])
        query.toArray(function (error, docs) {
            if (error)
                console.log(error);

            if (docs) {
                console.log(docs)
                curwss.send(JSON.stringify(docs), (err) => {
                    if (err) {
                        console.log(err);
                        curwss.close();
                    }
                    MongoClient.close;
                });
            }
        })
    });

};

function GetOnService(collectionname, infoData, sql) {
    return new Promise(function (resolve, reject) {
        var MongoClient = require('mongodb').MongoClient;
        var url = dbname.dbUrl;
        MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
            if (err) {
                console.log("数据库连接失败" + err);
                MongoClient.close;
                resolve('');
            }

            var clientdb = client.db(dbname.dbName + sql);
            var collection = clientdb.collection(collectionname);
            var query = collection.aggregate([
                { $match: infoData }
            ])
            query.sort({ "refreshtime": -1 }).toArray(function (error, docs) {
                if (error)
                    console.log(error);

                if (docs) {
                    MongoClient.close;
                    resolve(JSON.stringify(docs))
                }
            })
        });
    })
};

function selectInfoComments(message, wss) {

    var sql = JSON.parse(message);
    var resultStr = null;
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        console.log('client need:' + sql);
        var clientdb = client.db(dbname.dbName + sql["clfrom"]);
        var InfoComments = clientdb.collection(sql["collection"]);
        var User = clientdb.collection('User');
        var id = sql['id'];
        InfoComments.find({ infoid: id }).toArray(function (error, comments) {
            if (comments) {
                gQueue(function* flow(next) {
                    comments.forEach(element => {
                        User.find({ openid: element['openid'] }).toArray(function (error, curuser) {

                            if (curuser[0]) {
                                element['nickName'] = curuser[0].nickName;
                                element['avatarUrl'] = curuser[0].avatarUrl;
                            }
                        });

                    });
                    var z = yield asyncFunc(next);
                    console.log('service get:' + comments);
                    curwss.send(JSON.stringify(comments), (err) => {
                        if (err) {
                            console.log(err);
                            curwss.close();
                        }
                        MongoClient.close;
                    });
                    MongoClient.close;

                });
            }
        });

    });

}

function selectInfoShop(message, wss) {
    //var cursql = message.substring(message.indexOf('\"infoData\"') + 11, message.length - 1);
    var sql = JSON.parse(message);
    var resultStr = [];
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        console.log('client need:' + sql);
        var clientdb = client.db(dbname.dbName + sql["clfrom"]);
        var collection = clientdb.collection(sql["collection"]);
        var sqlArr = { "infotype": "好吃的" };
        var sqlArrPlay = { "infotype": "好玩的" };
        var sqlArrSee = { "infotype": "好看的" };
        var sqlArrUse = { "infotype": "家用的" };
        collection.find(sqlArr).limit(4).toArray(function (err, docs) {
            if (err) {
                console.log(err);
                MongoClient.close;
            }
            resultStr.push(docs);
            console.log(resultStr);
            if (docs) {
                collection.find(sqlArrPlay).limit(4).toArray(function (err, docs) {
                    if (err) {
                        console.log(err);
                        MongoClient.close;
                    }
                    if (docs) {
                        resultStr.push(docs);
                        console.log(resultStr);
                        collection.find(sqlArrSee).limit(4).toArray(function (err, docs) {
                            if (err) {
                                console.log(err);
                                MongoClient.close;
                            }
                            if (docs) {
                                resultStr.push(docs);
                                collection.find(sqlArrUse).limit(4).toArray(function (err, docs) {
                                    if (err) {
                                        console.log(err);
                                        MongoClient.close;
                                    }
                                    if (docs) {
                                        resultStr.push(docs);
                                        curwss.send(JSON.stringify(resultStr), (err) => {
                                            if (err) {
                                                console.log(err);
                                                curwss.close();
                                            }
                                            MongoClient.close;
                                        });
                                        MongoClient.close;
                                    }
                                })
                            }
                        })
                    }
                })
            }
        });


    });

};

function selectInfoGoods(message, wss) {
    //var cursql = message.substring(message.indexOf('\"infoData\"') + 11, message.length - 1);
    var sql = JSON.parse(message);
    var resultStr = [];
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        console.log('client need:' + sql);
        var clientdb = client.db(dbname.dbName + sql["clfrom"]);
        var collection = clientdb.collection(sql["collection"]);
        var sqlArr = { "infotype": "好吃的" };
        var sqlArrPlay = { "infotype": "好玩的" };
        var sqlArrSee = { "infotype": "好看的" };
        var sqlArrUse = { "infotype": "家用的" };
        collection.find(sqlArr).limit(4).toArray(function (err, docs) {
            if (err) {
                console.log(err);
                MongoClient.close;
            }
            resultStr.push(docs);
            console.log(resultStr);
            if (docs) {
                collection.find(sqlArrPlay).limit(4).toArray(function (err, docs) {
                    if (err) {
                        console.log(err);
                        MongoClient.close;
                    }
                    if (docs) {
                        resultStr.push(docs);
                        console.log(resultStr);
                        collection.find(sqlArrSee).limit(4).toArray(function (err, docs) {
                            if (err) {
                                console.log(err);
                                MongoClient.close;
                            }
                            if (docs) {
                                resultStr.push(docs);
                                collection.find(sqlArrUse).limit(4).toArray(function (err, docs) {
                                    if (err) {
                                        console.log(err);
                                        MongoClient.close;
                                    }
                                    if (docs) {
                                        resultStr.push(docs);
                                        console.log(docs);
                                        curwss.send(JSON.stringify(resultStr), (err) => {
                                            if (err) {
                                                console.log(err);
                                                curwss.close();
                                            }
                                            MongoClient.close;
                                        });
                                        MongoClient.close;
                                    }
                                })
                            }
                        })
                    }
                })
            }
        });


    });

};

function selectInfoBook(message, wss) {
    //var cursql = message.substring(message.indexOf('\"infoData\"') + 11, message.length - 1);
    var sql = JSON.parse(message);
    var resultStr = [];
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        console.log('client need:' + sql);
        var clientdb = client.db(dbname.dbName + sql["clfrom"]);
        var collection = clientdb.collection(sql["collection"]);
        var sqlArr = { "infotype": "酒店宾馆" };
        var sqlArSendFood = { "infotype": "外卖服务" };
        var sqlArrPlay = { "infotype": "到点维修" };
        var sqlArrSee = { "infotype": "外送服务" };
        var sqlArrUse = { "infotype": "搬家服务" };
        var sqlArrOther = { "infotype": "其它服务" };
        collection.find(sqlArr).limit(2).toArray(function (err, docs) {
            if (err) {
                console.log(err);
                MongoClient.close;
            }
            resultStr.push(docs);
            console.log(resultStr);
            if (docs) {
                collection.find(sqlArSendFood).limit(2).toArray(function (err, docs) {
                    if (err) {
                        console.log(err);
                        MongoClient.close;
                    }
                    if (docs) {
                        resultStr.push(docs);
                        console.log(resultStr);
                        collection.find(sqlArrPlay).limit(2).toArray(function (err, docs) {
                            if (err) {
                                console.log(err);
                                MongoClient.close;
                            }
                            if (docs) {
                                resultStr.push(docs);
                                collection.find(sqlArrSee).limit(2).toArray(function (err, docs) {
                                    if (err) {
                                        console.log(err);
                                        MongoClient.close;
                                    }
                                    if (docs) {
                                        resultStr.push(docs);
                                        collection.find(sqlArrUse).limit(2).toArray(function (err, docs) {
                                            if (err) {
                                                console.log(err);
                                                MongoClient.close;
                                            }
                                            if (docs) {
                                                resultStr.push(docs);
                                                collection.find(sqlArrOther).limit(2).toArray(function (err, docs) {
                                                    if (err) {
                                                        console.log(err);
                                                        MongoClient.close;
                                                    }
                                                    if (docs) {

                                                        resultStr.push(docs);
                                                        curwss.send(JSON.stringify(resultStr), (err) => {
                                                            if (err) {
                                                                console.log(err);
                                                                curwss.close();
                                                            }
                                                            MongoClient.close;
                                                        });
                                                        MongoClient.close;
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        });


    });

};

function selectInfoBookonServer(res, req, data) {
    var resultStr = [];
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        var db = dbname.dbName
        if (data.clfrom)
            db += data.clfrom
        var clientdb = client.db(db);
        var collection = clientdb.collection(data.collection);
        var sqlArr = { "infotype": "酒店宾馆" };
        var sqlArSendFood = { "infotype": "外卖服务" };
        var sqlArrPlay = { "infotype": "到点维修" };
        var sqlArrSee = { "infotype": "外送服务" };
        var sqlArrUse = { "infotype": "搬家服务" };
        var sqlArrOther = { "infotype": "其它服务" };
        collection.find(sqlArr).limit(2).toArray(function (err, docs) {
            if (err) {
                console.log(err);
                MongoClient.close;
            }
            resultStr.push(docs);
            console.log(resultStr);
            if (docs) {
                collection.find(sqlArSendFood).limit(2).toArray(function (err, docs) {
                    if (err) {
                        console.log(err);
                        MongoClient.close;
                    }
                    if (docs) {
                        resultStr.push(docs);
                        console.log(resultStr);
                        collection.find(sqlArrPlay).limit(2).toArray(function (err, docs) {
                            if (err) {
                                console.log(err);
                                MongoClient.close;
                            }
                            if (docs) {
                                resultStr.push(docs);
                                collection.find(sqlArrSee).limit(2).toArray(function (err, docs) {
                                    if (err) {
                                        console.log(err);
                                        MongoClient.close;
                                    }
                                    if (docs) {
                                        resultStr.push(docs);
                                        collection.find(sqlArrUse).limit(2).toArray(function (err, docs) {
                                            if (err) {
                                                console.log(err);
                                                MongoClient.close;
                                            }
                                            if (docs) {
                                                resultStr.push(docs);
                                                collection.find(sqlArrOther).limit(2).toArray(function (err, docs) {
                                                    if (err) {
                                                        console.log(err);
                                                        MongoClient.close;
                                                    }
                                                    if (docs) {

                                                        resultStr.push(docs);
                                                        res.send(resultStr)
                                                        MongoClient.close;
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        });


    });

};

function selectInfo(message, wss) {
    //var cursql = message.substring(message.indexOf('\"infoData\"') + 11, message.length - 1);
    var sql = JSON.parse(message);
    var resultStr = null;
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        console.log('client need:' + sql);
        var clientdb = client.db(dbname.dbName + sql["clfrom"]);
        var collection = clientdb.collection(sql["collection"]);
        var sqlArr = sql['infoData'];
        collection.find(sqlArr).toArray(function (err, docs) {
            if (err) {
                console.log(err);
                MongoClient.close;
            }
            resultStr = docs;
            console.log('service get:' + docs);
            if (docs) {
                curwss.send(JSON.stringify(resultStr), (err) => {
                    if (err) {
                        console.log(err);
                        curwss.close();
                    }
                    MongoClient.close;
                });
                MongoClient.close;
            }
        });
    });

};

function selectInfoByObjID(message, wss) {
    //var cursql = message.substring(message.indexOf('\"infoData\"') + 11, message.length - 1);
    var sql = JSON.parse(message);
    var resultStr = null;
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;
    var objids = [], ids = sql['ids'].split(',')
    console.log(ids)
    var ObjectId = require('mongodb').ObjectID;
    for (var item = 0; item < ids.length; item++) {
        let _id = ObjectId(ids[item]);
        objids.push(_id);
    }
    var idsarray = { _id: { $in: objids } };
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        console.log('client need:' + sql);
        var clientdb = client.db(dbname.dbName + sql["clfrom"]);
        var collection = clientdb.collection(sql["collection"]);
        collection.find(idsarray).toArray(function (err, docs) {
            if (err) {
                console.log(err);
                MongoClient.close;
            }
            resultStr = docs;
            console.log('service get:' + docs);
            if (docs) {
                curwss.send(JSON.stringify(resultStr), (err) => {
                    if (err) {
                        console.log(err);
                        curwss.close();
                    }
                    MongoClient.close;
                });
                MongoClient.close;
            }
        });
    });

};

function selectCount(message, wss) {
    //var cursql = message.substring(message.indexOf('\"infoData\"') + 11, message.length - 1);
    var sql = JSON.parse(message);
    var resultStr = null;
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        console.log('client need:' + sql);
        var clientdb = client.db(dbname.dbName + sql["clfrom"]);
        var collection = clientdb.collection(sql["collection"]);
        var sqlArr = sql['infoData'];
        var count = collection.find(sqlArr).count(function (err, docs) {
            if (err) {
                console.log(err);
                MongoClient.close;
            }
            curwss.send(JSON.stringify(docs), (err) => {
                if (err) {
                    console.log(err);
                    curwss.close();
                }
                MongoClient.close;
            });
        })
    });

};

function selectInfo(message, wss) {
    //var cursql = message.substring(message.indexOf('\"infoData\"') + 11, message.length - 1);
    var sql = JSON.parse(message);
    var resultStr = null;
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        console.log('client need:' + sql);
        var clientdb = client.db(dbname.dbName + sql["clfrom"]);
        var collection = clientdb.collection(sql["collection"]);
        var sqlArr = sql['infoData'];
        collection.find(sqlArr).toArray(function (err, docs) {
            if (err) {
                console.log(err);
                MongoClient.close;
            }
            resultStr = docs;
            console.log('service get:' + docs);
            if (docs) {
                curwss.send(JSON.stringify(resultStr), (err) => {
                    if (err) {
                        console.log(err);
                        curwss.close();
                    }
                    MongoClient.close;
                });
                MongoClient.close;
            }
        });
    });

}; function selectInfoTop(message, wss) {
    //var cursql = message.substring(message.indexOf('\"infoData\"') + 11, message.length - 1);
    var sql = JSON.parse(message);
    var resultStr = null;
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        console.log('client need:' + sql);
        var clientdb = client.db(dbname.dbName + sql["clfrom"]);
        var collection = clientdb.collection(sql["collection"]);
        var sqlArr = sql['infoData'];
        var top = sql['top'];
        collection.find(sqlArr).limit(top).toArray(function (err, docs) {
            if (err) {
                console.log(err);
                MongoClient.close;
            }
            resultStr = docs;
            console.log('service get:' + docs);
            if (docs) {
                curwss.send(JSON.stringify(resultStr), (err) => {
                    if (err) {
                        console.log(err);
                        curwss.close();
                    }
                    MongoClient.close;
                });
                MongoClient.close;
            }
        });
    });

};

function UpdateInfo(message, wss) {
    //var cursql = message.substring(message.indexOf('\"infoData\"') + 11, message.length - 1);
    var sql = JSON.parse(message);
    var resultStr = null;
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        console.log('client need:' + sql);
        var clientdb = client.db(dbname.dbName + sql["clfrom"]);
        var collection = clientdb.collection(sql["collection"]);
        var ids = sql["ids"].split(',');
        var objids = [];
        for (var item = 0; item < ids.length; item++) {
            var ObjectId = require('mongodb').ObjectID;
            let _id = ObjectId(ids[item]);
            objids.push(_id);
        }
        var idsarray = { _id: { $in: objids } };
        var set = { $set: sql["setdata"] };
        collection.updateMany(idsarray, set, function (err, r) {
            if (r) {
                console.log(r.modifiedCount)
                if (r.modifiedCount > 0) {
                    console.log(r);
                    curwss.send(JSON.stringify('成功'), (err) => {
                        if (err) {
                            console.log(err);
                            MongoClient.close;
                        }
                    });
                    MongoClient.close;
                }
            }
            else {
                curwss.send(JSON.stringify('失败'), (err) => {
                    if (err) {
                        console.log(err);
                        curwss.close();
                    }
                });
                MongoClient.close;
            }
        });
    });

};

function EditOnService(collectioname, infoData, editData, sql) {
    var MongoClient = require('mongodb').MongoClient;
    var moment = require('moment');
    var url = dbname.dbUrl;
    infoData.refreshtime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        var clientdb = client.db(dbname.dbName + sql);
        var collection = clientdb.collection(collectioname);
        var set = { $set: editData };
        collection.updateMany(infoData, set, function (err, r) {
            if (r) {
                console.log(r.modifiedCount)
                if (r.modifiedCount > 0) {
                    console.log('修改成功');
                    MongoClient.close;
                }
            }
            else {
                console.log('修改失败');
                MongoClient.close;
            }
        });
    });

};

function IncFildsMany(message, wss) {
    //var cursql = message.substring(message.indexOf('\"infoData\"') + 11, message.length - 1);
    var sql = JSON.parse(message);
    var resultStr = null;
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        console.log('client need:' + sql);
        var clientdb = client.db(dbname.dbName + sql["clfrom"]);
        var collection = clientdb.collection(sql["collection"]);
        var ids = sql["ids"].split(',');
        var objids = [];
        for (var item = 0; item < ids.length; item++) {
            var ObjectId = require('mongodb').ObjectID;
            let _id = ObjectId(ids[item]);
            objids.push(_id);
        }
        var idsarray = { _id: { $in: objids } };
        var set = { $inc: sql["setdata"] };
        collection.updateMany(idsarray, set, function (err, r) {
            if (r) {
                if (r.modifiedCount > 0) {
                    console.log('浏览sehzhi成功个')
                    console.log(r);
                    curwss.send(JSON.stringify('成功'), (err) => {
                        if (err) {
                            console.log(err);
                            MongoClient.close;
                        }
                    });
                    MongoClient.close;
                }
            }
            else {
                curwss.send(JSON.stringify('失败'), (err) => {
                    if (err) {
                        console.log(err);
                        curwss.close();
                    }
                });
                MongoClient.close;
            }
        });
    });

};

function selectGetSum(message, wss) {
    var curmsg = JSON.parse(message);
    var curwss = wss;
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        var clientdb = client.db(dbname.dbName + curmsg["clfrom"]);
        var Info = clientdb.collection(curmsg.collection);
        var viewed = 0;
        var sql = curmsg["infoData"]
        var index = 0
        var query = Info.find(sql);
        gQueue(function* flow(next) {

            query.sort({ "refreshtime": -1 }).toArray(function (error, docs) {

                if (docs) {
                    docs.forEach(function (doc) {
                        if (doc) {
                            viewed += parseInt(doc['viewed'])
                        }

                    })
                }
            })
            var x = yield asyncFunc200(next);
            curwss.send(JSON.stringify({ 'sumTotal': viewed }), (err) => {
                if (err) {
                    console.log(err);
                    curwss.close();
                }
            });
        });
    });

};

function selectSthCountOnService(collectionName, data, res, clfrom) {
    console.log('2')
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        var clientdb = client.db(dbname.dbName + clfrom);
        var collection = clientdb.collection(collectionName);
        var array = data;
        console.log(data)
        var count = collection.find(array).count(function (err, result) {
            console.log('信息条数' + result)
            res.send(JSON.stringify({ 'msgcount': result }))
            MongoClient.close;
        })


    })
}
function selectGetSumonServer(res, req, curmsg) {
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        var db = dbname.dbName
        if (curmsg["clfrom"])
            db += curmsg["clfrom"]
        var clientdb = client.db(db);
        var Info = clientdb.collection(curmsg.collection);
        var viewed = 0;
        var ids = curmsg['_id']
        // console.log(ids)
        var ObjectId = require('mongodb').ObjectID;
        let _id = ObjectId(ids);
        gQueue(function* flow(next) {
            Info.find({ "_id": _id }).toArray(function (error, docs) {
                if (error) {
                    console.log(error)
                    return
                }

                if (docs && docs.length > 0) {
                    viewed = docs[0].viewed
                }
            })
            var x = yield asyncFunc200(next);
            res.send(JSON.stringify({ 'sumTotal': viewed }))
        });
    });

};

function titleFormat(val) {
    if (val.indexOf('\n') > 0) {
        var str = val.substring(val.indexOf('\n') + 16, val.length)
        console.log(str.indexOf('\n'));
        if (str.indexOf('\n') > 0) {
            var strsth = str.substring(0, val.indexOf('\n') + 16 + str.indexOf('\n'));
            if (strsth.indexOf('\n') > 0)
                val = val.substring(0, val.indexOf('\n') + 4 + str.indexOf('\n') + strsth.indexOf('\n')) + '……';
            return val;
        }
    }
    return val;
}

function selectInSth(message, wss) {
    var curmsg = JSON.parse(message);
    var resultStr = null;
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;

    var that = this;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        var db = dbname.dbName
        if (curmsg["clfrom"])
            db += curmsg["clfrom"]
        var clientdb = client.db(db);
        var Info = clientdb.collection("Info");
        var User = clientdb.collection("User");
        var currentPage = parseInt(curmsg["PageNum"]);
        var limit = parseInt(curmsg["Count"]);
        var viewed = 0;
        var Format = require('../pub/pub.js');
        gQueue(function* flow(next) {
            Info.find(curmsg["infoData"]).count(function (err, result) {
                totalcount = result;
            });
            var x = yield asyncFunc1(next);
            var query = Info.aggregate([
                { $match: curmsg["infoData"] },
                { $lookup: { from: 'User', localField: 'openid', foreignField: 'openid', as: 'User' } },
                {
                    $project: {
                        _id: 1,
                        "allFileName": 1,
                        "contactor": 1,
                        "contactmethod": 1,
                        "address": 1,
                        "street_number": 1,
                        "latitude": 1,
                        "longitude": 1,
                        "OutOfLine": 1,
                        "openid": 1,
                        "infotype": 1,
                        "audited": 1,
                        "viewed": 1,
                        "praised": 1,
                        "istoped": 1,
                        content: titleFormat("$content"),
                        "refreshtime": 1,
                        "publishtime": 1,
                        nickName: "$User.nickName",
                        avatarUrl: "$User.avatarUrl"
                    }
                }
            ]).sort({"istoped": -1,"refreshtime": -1 }).skip((currentPage - 1) * limit).limit(limit)

            query.toArray(function (error, docs) {
                if (error)
                    console.log(error);

                if (docs) {
                    console.log('服务器端：');
                    console.log(docs)
                    curwss.send(JSON.stringify({ 'totalcount': totalcount, 'list': docs }), (err) => {
                        if (err) {
                            console.log(err);
                            curwss.close();
                        }
                        MongoClient.close;
                    });
                }
            })
        })
    });

};

function selectOrder(message, wss) {
    var curmsg = JSON.parse(message);
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        var clientdb = client.db(dbname.dbName + curmsg["clfrom"]);
        var OrderMain = clientdb.collection(curmsg["collection"]);
        var currentPage = parseInt(curmsg["PageNum"]);
        var limit = parseInt(curmsg["Count"]);

        var ObjectId = require('mongodb').ObjectID;
        var objids = [];
        var isall = curmsg["infoData"]["orderstate"]
        var sql = { $or: [{ "ownerid": curmsg["ownerid"] }, { "buyeropenid": curmsg["buyeropenid"] }] }
        var insql = ''
        if (isall && isall == '全部') {
            objids.push('待付款');
            objids.push('待发货');
            objids.push('待收货');
            objids.push('待评价');
            objids.push('已完结');
            insql = { 'orderstate': { $in: objids } };
        }
        else
            insql = { 'orderstate': curmsg["infoData"]["orderstate"] }
        sql = { $and: [sql, insql] }
        var array = {}
        if (curmsg["_id"]) {
            let _id = ObjectId(curmsg["_id"]);
            array = { _id: _id };
        }
        sql = { $and: [sql, array] }
        console.log('订单');
        console.log(sql);
        gQueue(function* flow(next) {
            OrderMain.find(sql).count(function (err, result) {
                totalcount = result;
            });
            var x = yield asyncFunc1(next);
            var query = OrderMain.aggregate([
                { $match: sql },
                { $lookup: { from: 'Order', localField: '_id', foreignField: 'orderid', as: 'Order' } },
                { $lookup: { from: 'User', localField: 'buyeropenid', foreignField: 'openid', as: 'User' } },
                {
                    $project: {
                        _id: 1,
                        "proID": 1,
                        "price": 1,
                        "orderno": 1,
                        "num": 1,
                        "name": 1,
                        "openid": 1,
                        "img": 1,
                        "buyeropenid": 1,
                        "curopenid": 1,
                        "ownerid": 1,
                        "orderstate": 1,
                        "totalprice": 1,
                        "refreshtime": 1,
                        "publishtime": 1,
                        "selectreson": 1,
                        "reson": 1,
                        "backprice": 1,
                        Order: "$Order",
                        User: "$User",
                    }
                }
            ]).sort({ "refreshtime": -1 }).skip((currentPage - 1) * limit).limit(limit)

            query.toArray(function (error, docs) {
                if (error)
                    console.log(error);

                if (docs) {
                    console.log('服务器端：');
                    console.log(docs)
                    curwss.send(JSON.stringify({ 'totalcount': totalcount, 'list': docs }), (err) => {
                        if (err) {
                            console.log(err);
                            curwss.close();
                        }
                        MongoClient.close;
                    });
                }
            })
        })
    });

};

function selectOrderMain(message, wss) {
    var curmsg = JSON.parse(message);
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        var clientdb = client.db(dbname.dbName + curmsg["clfrom"]);
        var OrderMain = clientdb.collection(curmsg["collection"]);
        var currentPage = parseInt(curmsg["PageNum"]);
        var limit = parseInt(curmsg["Count"]);
        var objids = [], ids = curmsg['ids'].split(',')
        // console.log(ids)
        var ObjectId = require('mongodb').ObjectID;
        for (var item = 0; item < ids.length; item++) {
            let _id = ObjectId(ids[item]);
            objids.push(_id);
        }
        var idsarray = { _id: { $in: objids } };
        var query = OrderMain.aggregate([
            { $match: idsarray },
            { $lookup: { from: 'Order', localField: '_id', foreignField: 'orderid', as: 'Order' } },
            {
                $project: {
                    _id: 1,
                    "price": 1,
                    "num": 1,
                    "name": 1,
                    "openid": 1,
                    "img": 1,
                    "buyeropenid": 1,
                    "curopenid": 1,
                    "ownerid": 1,
                    "orderstate": 1,
                    "totalprice": 1,
                    "refreshtime": 1,
                    "publishtime": 1,
                    "backprice": 1,
                    Order: "$Order"
                }
            }
        ]).sort({ "refreshtime": -1 })

        query.toArray(function (error, docs) {
            if (error)
                console.log(error);

            if (docs) {
                console.log('服务器端：');
                console.log(docs)
                curwss.send(JSON.stringify(docs), (err) => {
                    if (err) {
                        console.log(err);
                        curwss.close();
                    }
                    MongoClient.close;
                });
            }
        })
    })

};

function selectSthWithSkip(message, wss) {
    var curmsg = JSON.parse(message);
    var resultStr = null;
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;

    var that = this;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        var clientdb = client.db(dbname.dbName + curmsg["clfrom"]);
        var collection = clientdb.collection(curmsg["collection"]);
        var User = clientdb.collection("User");
        var currentPage = parseInt(curmsg["PageNum"]);
        var limit = parseInt(curmsg["Count"]);
        var viewed = 0;
        var Format = require('../pub/pub.js');
        gQueue(function* flow(next) {
            collection.find(curmsg["infoData"]).count(function (err, result) {
                totalcount = result;
            });
            var x = yield asyncFunc1(next);
            var query = collection.aggregate([
                { $match: curmsg["infoData"] }
            ]).sort({ "refreshtime": -1 }).sort({ "istoped": -1 }).skip((currentPage - 1) * limit).limit(limit)

            query.toArray(function (error, docs) {
                if (error)
                    console.log(error);

                if (docs) {
                    console.log(docs)
                    curwss.send(JSON.stringify({ 'totalcount': totalcount, 'list': docs }), (err) => {
                        if (err) {
                            console.log(err);
                            curwss.close();
                        }
                        MongoClient.close;
                    });
                }
            })
        })
    });

};

function selectCollection(message, wss) {
    var curmsg = JSON.parse(message);
    var resultStr = null;
    var MongoClient = require('mongodb').MongoClient;
    var url = dbname.dbUrl;
    var curwss = wss;

    var that = this;

    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
        if (err) {
            console.log("数据库连接失败");
            MongoClient.close;
            return;
        }
        var clientdb = client.db(dbname.dbName + curmsg["clfrom"]);
        var Info = clientdb.collection("Info");
        var MyCollection = clientdb.collection("MyCollection");
        var currentPage = parseInt(curmsg["PageNum"]);
        var limit = parseInt(curmsg["Count"]);
        var query = MyCollection.find(curmsg["infoData"]);
        var totalcount = 0;
        var timeFormat = require('../pub/pub.js');
        // try {
        gQueue(function* flow(next) {
            var totalcount = 0;
            query.count(function (err, result) {
                totalcount = result;
            });
            var x = yield asyncFunc1(next);
            query.sort({ "refreshtime": -1 }).skip((currentPage - 1) * limit).limit(limit).toArray(function (error, docs) {
                if (error)
                    console.log(error);

                if (docs) {
                    // 声明一个 Generator 并传给 gQueue
                    gQueue(function* flow(next) {
                        docs.forEach(function (doc) {
                            if (doc) {

                                var ObjectId = require('mongodb').ObjectID;
                                let curinfoID = ObjectId(doc.infoid);
                                Info.find({ _id: curinfoID }).toArray(function (error, info) {
                                    if (info.length > 0) {

                                        if (info[0].content.indexOf('\n') > 0) {
                                            var str = info[0].content.substring(info[0].content.indexOf('\n') + 2, info[0].content.length)
                                            console.log(str.indexOf('\n'));
                                            if (str.indexOf('\n') > 0) {
                                                var strsth = str.substring(0, info[0].content.indexOf('\n') + 2 + str.indexOf('\n'));
                                                if (strsth.indexOf('\n') > 0)
                                                    info[0].content = info[0].content.substring(0, info[0].content.indexOf('\n') + 4 + str.indexOf('\n') + strsth.indexOf('\n')) + '……';
                                            }
                                        }
                                        if (info[0].content.length > 64)
                                            info[0].content = info[0].content.substring(0, 64) + '……';
                                        doc['content'] = info[0].content;
                                    }
                                });
                            };
                        });
                        var z = yield asyncFunc(next);
                        console.log('service get:' + docs);
                        curwss.send(JSON.stringify({ 'totalcount': totalcount, 'list': docs }), (err) => {
                            if (err) {
                                console.log(err);
                                curwss.close();
                            }
                            MongoClient.close;
                        });
                    });
                };
            })



        });
    });

};

module.exports = {
    SaveInfo: SaveInfo,
    selectInSth: selectInSth,
    selectOrder: selectOrder,
    UpdateInfo: UpdateInfo,
    selectInfo: selectInfo,
    selectOne: selectOne,
    deleteInfo: deleteInfo,
    getSearchCount: getSearchCount,
    IncFildsMany: IncFildsMany,
    selectInfoComments: selectInfoComments,
    selectCollection: selectCollection,
    selectInfoShop: selectInfoShop,
    selectInfoBook: selectInfoBook,
    selectInfoTop: selectInfoTop,
    selectCount: selectCount,
    selectInfoGoods: selectInfoGoods,
    selectOneCommen: selectOneCommen,
    SaveOnService: SaveOnService,
    GetOnService: GetOnService,
    EditOnService: EditOnService,
    DeleteOnService: DeleteOnService,
    selectInfoBookonServer: selectInfoBookonServer,
    selectGetSumonServer: selectGetSumonServer,
    selectGetSum: selectGetSum,
    selectSthWithSkip: selectSthWithSkip,
    selectSthCountOnService: selectSthCountOnService,
    SaveOrder: SaveOrder,
    selectOrderMain: selectOrderMain
}