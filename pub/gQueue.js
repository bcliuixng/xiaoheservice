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
        cb(null, 300);
    }, 2500)
}

function asyncFunc1(cb) {
    // 这个函数模拟一个异步操作，将在 1 秒后触发回调函数
    setTimeout(function () {
        cb(null, 300);
    }, 500)
}

function asyncFunc3000(cb) {
    // 这个函数模拟一个异步操作，将在 1 秒后触发回调函数
    setTimeout(function () {
        cb(null, 300);
    }, 3000)
}
module.exports = {
    asyncFunc1: asyncFunc1,
    asyncFunc: asyncFunc,
    gQueue: gQueue,
    gNext: gNext,
    asyncFunc3000:asyncFunc3000
}