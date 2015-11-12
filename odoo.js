//https://github.com/amon-ra/odoo-client-JSON-RPC

//pragma

//------------------helper functions ------------------------
var idCounter = 0;
var uniqueId = function () {
    return function (prefix) {
      var id = ++idCounter + '';
      return prefix ? prefix + id : id;
    }
}();
function json_request(options, params,callback) {

    var url='';
    if(typeof options == 'string') {
        url=options;
    }
    else if ( options.hasOwnProperty('protocol')){
            url=options.protocol+'://';
        if (options.hasOwnProperty('host')){
            url=url+options.host;
            if (options.hasOwnProperty('port')){
                url=url+':'+options.port;
                if (options.hasOwnProperty('path'))
                    url=url+options.path;
            }
        }

    }

    var async = options.async || true;
    var method = options.method || 'POST';
    var json_data = options.json || JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'call',
                  params: params,
    });
//    console.log(json_data)
    var headers = options.headers || {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Content-Length": json_data.length,
            };

    headers["Content-Length"]=json_data.length;

    var request = new XMLHttpRequest()

    //request.open(method, url)

    request.open(method, url, async);

    //Send the proper header information along with the request
//    request.setRequestHeader("Content-type", "application/json");
//    request.setRequestHeader("Accept", "application/json");
//    request.setRequestHeader("Content-length", json_data.length);
//    request.setRequestHeader("Connection", "close");

    for (var h in headers){
        request.setRequestHeader(h,headers[h]);
    }

    request.onreadystatechange = function() {//Call a function when the state changes.
//        console.log(request.responseText);
        console.log(request.responseText);
        if(request.readyState == 4 && request.status == 200) {
            var data = JSON.parse(request.responseText);
            callback(null,data.result);
        }
        else if (request.readyState == 4){
            var err = new Error(request);
            err.code = request.status;
            //console.error(request.responseText);
            callback(err);
        }
    }

    //request.onreadystatechange = readyStateChange(request, callback)

    //ODOORPC.requestCounts += 1;
    request.send(json_data);
}

function http_request(url, params,callback) {
    var json_data = JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'call',
                  params: params,
    });

    var request = new XMLHttpRequest()

    //request.open(method, url)

    request.open("POST", url, true);

    //Send the proper header information along with the request
    request.setRequestHeader("Content-type", "application/json");
    request.setRequestHeader("Accept", "application/json");
    request.setRequestHeader("Content-length", json_data.length);
    request.setRequestHeader("Connection", "close");

    request.onreadystatechange = function() {//Call a function when the state changes.
        if(request.readyState == 4 && request.status == 200) {
            callback(null,request);
        }
        else if (request.readyState == 4){
            var err = new Error(request);
            err.code = request.status;
            //console.error(request.responseText);
            callback(err);
        }
    }

    //ODOORPC.requestCounts += 1;
    request.send(json_data)
}

//-------------------------Class code-----------------------

function Odoo(opts,password,db,base_location){
    this.session_id = '';
    this.context = '';
    this.sid = '';
    if (typeof(opts) === 'object'){
        this.opts = opts;
        if (opts && opts.port){
            this.opts.port = opts.port;
        } else {
            this.opts.port = '80';
        }

        if (opts && opts.host){
            this.opts.host = opts.host;
        } else {
            this.opts.host = 'localhost';
        }

        if (opts && opts.protocol){
            this.opts.protocol = opts.protocol;
        } else {
            this.opts.protocol = 'http';
        }

        if (typeof(this.opts.base_location) === 'undefined')
            this.opts.base_location = this.opts.protocol + '://' + this.opts.host + ':' + this.opts.port;
    }else{
        this.opts = {};
        if (opts){
            this.opts.login = opts;
        } else {
            this.opts.login = 'admin';
        }

        if (password){
            this.opts.password = password;
        } else {
            this.opts.password = 'admin';
        }

        if (db){
            this.opts.db = db;
        } else {
            this.opts.db = 'odoo';
        }
        if (base_location){
            this.opts.base_location = base_location;
        } else {
            this.opts.base_location = 'http://localhost:8069';
        }
    }

    this.paths = {
        'auth': this.opts.base_location + '/web/session/authenticate',
        'databases': this.opts.base_location + '/web/database/get_list',
        'dataset_call_kw': this.opts.base_location + '/web/dataset/call_kw',
    };

}

Odoo.prototype.database_getlist = function (cb) {

    var params = {'session_id': '', 'context':{}}

    json_request(this.paths.databases,params, cb);
    };

Odoo.prototype.auth = function (cb){

    var params = {
        'db': this.opts.db,
        'login': this.opts.login,
        'password': this.opts.password,
        'base_location': this.opts.base_location,
        //'session_id': '',
        'context': {}
    }

//    var json = JSON.stringify({
//        'jsonrpc': '2.0',
//        'method': 'call',
//        'params': params
//    });

//    var options = {
//        'host': this.opts.host,
//        'port': this.opts.port,
//        'path': '/web/session/authenticate',
//        'method': 'POST',
//        'headers': {
//        "Content-Type": "application/json",
//        "Accept": "application/json",
//        "Content-Length": json.length,
//        }
//    };

    //console.log(this.paths);
    http_request(this.paths.auth,params, function(err,res){
        var response = res.responseText;
        var err = null;

        //res.setEncoding('utf8');

        //var sid = res.headers['set-cookie'][0].split(';')[0];
        var sid = res.getResponseHeader('Set-Cookie');
        //console.log(sid);
        var data = JSON.parse(response);
        if (data['error']){
            err = new Error(JSON.stringify(data['error']));
            err.code = data['error']['code'];
            //console.error(request.responseText);
            //console.error(data['error']);
        }
        else {
            this.session_id = data.result.session_id;
            this.context = data.result.user_context;
            this.uid = data.result.uid;
            this.company_id = data.result.company_id;
            this.partner_id = data.result.partner_id;
            this.sid = sid;

        }

        return cb(err,data,sid);

    })


    };

Odoo.prototype.rpc = function(path, cb, params, options) {

    params = params || {};

    options = options || {
        protocol: this.opts.protocol,
        host: this.opts.host,
        port: this.opts.port,
        path: path || '/',
        headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        }
    };

    if (this.sid){
        var sid = this.sid + ';';
        options.headers.Cookie = this.sid + ';';
    }

//    _.defaults(params,{
//        context: this.context || {},
//        session_id: this.session_id || {},
//    });

    if(params.hasOwnProperty('context'))
        params.context = this.context || {};
    if(params.hasOwnProperty('session_id'))
        params.session_id = this.session_id || {};

    //var json_client = jayson.client.http(options);

    return json_request(options,params, cb);
};

Odoo.prototype._call = function (model, method, cb, args, kwargs){
    args = args || [
        false,
        "tree",
        {
        "uid": this.context.uid,
        "lang": this.context.lang,
        "tz": this.context.tz,
        },
        true
    ];

    kwargs = kwargs || {};

    params =  {
        "kwargs": kwargs,
        "args": args,
        "model": model,
        "method": method,
    }

    this.rpc('/web/dataset/call_kw', cb, params);
}
Odoo.prototype.call = Odoo.prototype._call;

Odoo.prototype._create = function (model, args, kwargs, cb) {
    this._call(model, "create", cb, args, kwargs);
}

Odoo.prototype.create  = Odoo.prototype._create;

Odoo.prototype.get_model = function (model,cb){
    this._call(model,"fields_view_get", cb);
}


/**
 * Basic Search
 *
 */
Odoo.prototype._search = function (model,cb,filter,fields,offset,limit,sort){

    // example of filter = ["code", "=", "1.1.2"]

    fields = fields || [];

//    var domain;

//    if (filter){

//        domain.push(filter);
//    }

    var params = {
        "model": model,
        "domain": filter ? filter : undefined,
        "sort": sort ? sort : undefined,
        "fields": fields ? fields : undefined,
        "limit": limit || 80,
        "offset": offset || 0
    };

    this.rpc('/web/dataset/search_read', cb, params);

}
Odoo.prototype.search =Odoo.prototype._search;

Odoo.prototype._read = function(model,cb,args,method){
    var params = {
        "model": model,
        "method" : method,
        "args": args
    };
    this.rpc('/web/dataset/call',cb,params);
}
Odoo.prototype._search_read = function(model,cb,args,method){
    var params = {
        "model": model,
        "method" : method,
        "args": args
    };
    this.rpc('/web/dataset/call',cb,params);
}
Odoo.prototype._delete = function(model,cb,method,args){

    var params = {
        "kwargs" : {},
        "model": model,
        "method" : method,
        "args": args
    };
    this.rpc('/web/dataset/call_kw',cb,params);
}

Odoo.prototype._write = function(model,cb,method,args){

    var params = {
        "kwargs" : {},
        "model": model,
        "method" : method,
        "args":args
    };
    this.rpc('/web/dataset/call_kw',cb,params);
}

Odoo.prototype.write = Odoo.prototype._write

if (typeof(module) !== "undefined"){
    module.exports = Odoo;
}













