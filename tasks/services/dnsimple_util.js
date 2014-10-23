var AWS = require("aws-sdk"),
    async = require("async"),
    _ = require("lodash"),
    https = require("https");

module.exports = function(grunt) {

  grunt.registerMultiTask("dnsimple_util", "wrangle dnsimple records", function(confirm_bucket_name) {

    var DEFAULTS = {
      dot_s3_url: ".s3-website-us-east-1.amazonaws.com"
    };

    var done = this.async();
    var options = this.options(DEFAULTS);
    var email = options.email;
    var key = options.key;
    var token = email + ":" + key;

/*
http://developer.dnsimple.com/domains/records/
http://stackoverflow.com/questions/5643321/how-to-make-remote-rest-call-inside-node-js-any-curl/5643366#5643366
http://isolasoftware.it/2012/05/28/call-rest-api-with-node-js/
*/

if (this.target === 'get_records') {
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
var domain = this.data.domain;
// options for GET
var optionsget = {
    host: 'api.dnsimple.com', // here only the domain name
    port : 443, // (no http/https !)
    headers: {
      'X-DNSimple-Token': token,
      'Accept': 'application/json'
    },
    path: '/v1/domains/' + domain + '/records', // the rest of the url with parameters if needed
    method : 'GET' // do GET
};

console.info('Options prepared:');
console.info(optionsget);
console.info('Do the GET call');

// do the GET request
var reqGet = https.request(optionsget, function(res) {
    console.log("statusCode: ", res.statusCode);
    // uncomment it for header details
//  console.log("headers: ", res.headers);

    var chunk = "";

    res.on('data', function(d) {
        console.info('GET result:\n');
        // process.stdout.write(d);
        // console.info('\n\nCall completed');
        chunk += d;
    });
    res.on('end', function(d) {
      var ddd = JSON.parse(chunk);
      var dd = JSON.stringify(ddd, null, 2);
      // console.log(ddd);
      console.log(dd);
      return done();
    });

});    
reqGet.end();
reqGet.on('error', function(e) {
    console.error(e);
    return done(false);
});
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
} //if



if (this.target === 'add_record_cname_for_s3') {
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
/*
curl 
-H 'X-DNSimple-Token: XXXXXXXXXXXXXXX'
-H 'Accept: application/json'
https://api.dnsimple.com/v1/domains/nuga.com/records/3257793
| ruby -r json -ne 'puts JSON.pretty_generate(JSON.parse($_))'
*/
var cname = this.data.cname;
var domain = this.data.domain;
var bucket = [cname, domain].join(".");
var record = {
  "record": {
    "name": cname,
    "record_type": "CNAME",
    "content": bucket + options.dot_s3_url
  }
};
var jsonObject = JSON.stringify(record);
// options for POST
var optionspost = {
    host: 'api.dnsimple.com', // here only the domain name
    port : 443, // (no http/https !)
    headers: {
      'X-DNSimple-Token': token,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    path: '/v1/domains/' + domain + '/records', // the rest of the url with parameters if needed
    method: 'POST'
};

console.info('Options prepared:');
console.info(optionspost);
console.info(jsonObject);
console.info('Do the POST call');

// do the POST request
var reqPost = https.request(optionspost, function(res) {
    console.log("statusCode: ", res.statusCode);
    // uncomment it for header details
//  console.log("headers: ", res.headers);

    var chunk = "";

    res.on('data', function(d) {
        console.info('POST result:\n');
        // process.stdout.write(d);
        // console.info('\n\nCall completed');
        chunk += d;
    });
    res.on('end', function(d) {
      var ddd = JSON.parse(chunk);
      var dd = JSON.stringify(ddd, null, 2);
      // console.log(ddd);
      console.log(dd);
      return done();
    });

});    
reqPost.write(jsonObject);
reqPost.end();
reqPost.on('error', function(e) {
    console.error(e);
    return done(false);
});
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
}


if (this.target === 'delete_record_cname') {
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
var cname = this.data.cname;
var domain = this.data.domain;
// options for GET
var optionsget = {
    host: 'api.dnsimple.com', // here only the domain name
    port : 443, // (no http/https !)
    headers: {
      'X-DNSimple-Token': token,
      'Accept': 'application/json'
    },
    path: '/v1/domains/' + domain + '/records', // the rest of the url with parameters if needed
    method : 'GET' // do GET
};

console.info('Options prepared:');
console.info(optionsget);
console.info('Do the DELETE call');

// do the GET request
var reqGet = https.request(optionsget, function(res) {
    console.log("statusCode: ", res.statusCode);
    // uncomment it for header details
//  console.log("headers: ", res.headers);

    var chunk = "";

    res.on('data', function(d) {
        console.info('DELETE result:\n');
        // process.stdout.write(d);
        // console.info('\n\nCall completed');
        chunk += d;
    });
    res.on('end', function(d) {
      var records = JSON.parse(chunk);
      console.log("num records:" + records.length);

      var i = _.findIndex(records, function(item){
        // console.log(record);
        if ((item.record.record_type === "CNAME") && (item.record.name===cname)) {
          return true;
        }
        return false;
      });
      if (i>-1) {
        console.log(i);
        var cname_record = records[i];
        var cname_record_id = records[i].record.id;
        console.log(cname_record);
        // var dd = JSON.stringify(ddd, null, 2);
        // console.log(ddd);
        // console.log(dd);
        var optionsdelete = _.extend(optionsget, {method:'DELETE', path:optionsget.path+"/"+cname_record_id});
console.info('Options prepared:');
console.info(optionsdelete);
console.info('Do the DELETE call for real');
        var reqDelete = https.request(optionsdelete, function(res) {
          console.log("statusCode: ", res.statusCode);
          return done();
        }); //reqDelete
        reqDelete.end();
        reqDelete.on('error', function(e) {
            console.error(e);
            return done(false);
        });

      } else {
        console.log("not found");
        return done();
      }
    });

});    
reqGet.end();
reqGet.on('error', function(e) {
    console.error(e);
    return done(false);
});
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
}



  }); // registerMultiTask

};
