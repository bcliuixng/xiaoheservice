/*
 *微信相关操作api
 */
var wechatApi = {};
var config = require('../pub/wxConfig');
var appID = config.AppID;
var appSecret = config.Secret;
var utils = require('../utils/utils');
var api = {
	accessToken : `${config.ACSPrefix}token?grant_type=client_credential`,
	upload : `${config.ACSPrefix}media/upload?`
}
 
//获取access_token
wechatApi.updateAccessToken = function(){
	var url = `${api.accessToken}&appid=${appID}&secret=${appSecret}`;
	//console.log(url);
	var option = {
		url : url,
		json : true
	};
	return utils.request(option).then(function(data){
 
		return Promise.resolve(data);
	})
}
 
module.exports = wechatApi;