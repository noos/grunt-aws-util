"use strict"

module.exports = (grunt) ->
  
  grunt.loadNpmTasks "grunt-aws-util"
  
  grunt.initConfig

    # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
    # settings: grunt.file.readJSON("src/__settings.json")
    settings:
      accessKeyId: "AAAAAAAAAAAAAAAAAAAA"
      secretAccessKey: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      cname: "test001"
      domain: "example.com"
      dnsimpleEmail: "admin@example.com"
      dnsimpleKey: "KKKKKKKKK"
      # bucket: "<%= settings.cname %>.<%= settings.domain %>"

    s3_util:
      options:
        accessKeyId: "<%= settings.accessKeyId %>"
        secretAccessKey: "<%= settings.secretAccessKey %>"
      create_bucket:
        name: "<%= settings.cname %>.<%= settings.domain %>"

    dnsimple_util:
      options:
        email: "<%= settings.dnsimpleEmail %>"
        key: "<%= settings.dnsimpleKey %>"
      add_record_cname_for_s3:
        cname: "<%= settings.cname %>"
        domain: "<%= settings.domain %>"
    
