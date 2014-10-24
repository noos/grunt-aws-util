var AWS = require("aws-sdk"),
    async = require("async"),
    _ = require("lodash");
    // path = require("path"),
    // fs = require("fs"),
    // crypto = require("crypto"),
    // zlib = require("zlib"),
    // CacheMgr = require("../cache-mgr"),
    // mime = require("mime");

module.exports = function(grunt) {

  //s3 defaults
  var DEFAULTS = {
    access: 'public-read',
    concurrent: 20,
    cacheTTL: 60*60*1000,
    // deleteFirst: true,
    // deleteMatched: true,
    dryRun: false,
    gzip: true,
    cache: true,
    // createBucket: false,
    // enableWeb: false
    createBucket: true,
    enableWeb: true
  };

  grunt.registerMultiTask("s3_util", "wrangle s3 bucket", function(confirm_bucket_name) {

    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
    // console.log(this.data);
    // console.log(this.target);
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
    //mark as async
    var done = this.async();
    //get options
    var opts = this.options(DEFAULTS);

    var bucket_name = this.data.name;

    //checks
    if(!bucket_name)
      grunt.fail.warn("No 'bucket' has been specified");

    //whitelist allowed keys
    AWS.config.update(_.pick(opts,
      'accessKeyId',
      'secretAccessKey',
      'region',
      'sslEnabled',
      'maxRetries',
      'httpOptions'
    ), true);

    //s3 client
    var S3 = new AWS.S3();

    var subtasks = [];

    if (this.target === "create_bucket") {
      subtasks.push(createBucket);
      subtasks.push(enableWebHosting);
    }

    if (this.target === "delete_bucket") {
      subtasks.push(deleteBucket);
    }

    //start!
    async.series(subtasks, taskComplete);


    function createBucket(callback) {
      //check the bucket doesn't exist first
      S3.listBuckets(function(err, data){
        var params;
        if(err) return callback(err);
        var existingBucket = _.detect(data.Buckets, function(bucket){
          // return opts.bucket === bucket.Name;
          return bucket_name === bucket.Name;
        });
        if(existingBucket){
          grunt.log.writeln('Existing bucket found.');
          callback();
        }else{
          // grunt.log.writeln('Creating bucket ' + opts.bucket + '...');
          grunt.log.writeln('Creating bucket ' + bucket_name + '...');
          //create the bucket using the bucket, access and region options
          if (opts.dryRun) return callback();
          params = {
            // Bucket: opts.bucket,
            Bucket: bucket_name,
            ACL: opts.access
          };
          if (!!opts.region && opts.region!=="us-east-1") {
            params['CreateBucketConfiguration'] = { LocationConstraint: opts.region };
          }

          S3.createBucket(params, function(err, data){
            if(err) return callback(err);
            grunt.log.writeln('New bucket\'s location is: ' + data.Location);
            // Disable caching if bucket is newly created
            callback();
          });
        }
      });
    }

    function enableWebHosting(callback) {
      // S3.getBucketWebsite({ Bucket:opts.bucket }, function(err){
      S3.getBucketWebsite({ Bucket:bucket_name }, function(err){
        if (err && err.name === 'NoSuchWebsiteConfiguration'){
          //opts.enableWeb can be the params for WebsiteRedirectLocation.
          //Otherwise, just set the index.html as default suffix
          // grunt.log.writeln('Enabling website configuration on ' + opts.bucket + '...');
          grunt.log.writeln('Enabling website configuration on ' + bucket_name + '...');
          var webOptions = _.isObject(opts.enableWeb) ? opts.enableWeb : { IndexDocument: { Suffix : 'index.html' }};
          if (opts.dryRun) return callback();
          S3.putBucketWebsite({
            // Bucket: opts.bucket,
            Bucket: bucket_name,
            WebsiteConfiguration: webOptions
          }, callback);
        }else{
          callback(err);
        }
      });
    }


    function deleteBucket(callback) {
      var params = {
            Bucket: bucket_name,
          };

      grunt.log.writeln('Deleting bucket ' + bucket_name + '...');
      S3.deleteBucket(params, function(err, data){
        if(err) return callback(err);
        console.log(data);
        callback();
      });

      // prompt based safe version
      /*
      if (!confirm_bucket_name || confirm_bucket_name !== bucket_name) {
        grunt.log.warn('Bucket name must be specified, like s3_util:delete_bucket:BucketNameGoesHere.');
        callback();
      } else {
        grunt.log.writeln('Deleting bucket ' + bucket_name + '...');
        S3.deleteBucket(params, function(err, data){
          if(err) return callback(err);
          console.log(data);
          // grunt.log.writeln(data);
          callback();
        });
      } //else
      */
    } //deleteBucket


    function taskComplete(err) {
      if(err) {
        grunt.fail.warn(err);
        return done(false);
      }
      
      grunt.log.ok("done test_util");
      //all done
      // grunt.log.ok("Put " + stats.puts + " files");
      // if(stats.puts || stats.dels || stats.refreshed || stats.newOptions)
      //   CacheMgr.put(cache);
      done(err);
    }

  });
};
