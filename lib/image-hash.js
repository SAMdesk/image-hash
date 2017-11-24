'use strict';

const fs = require('fs');
const PNG = require('png-js');
const jpeg = require('jpeg-js');
const blockhash = require('./block-hash');
const request = require('request');

module.exports = (src, bits, method, cb) => {

  const checkFileType = (name, data) => {
    //what is the image type
    if (name.lastIndexOf('.') > 0) {
      let ext = name.substr(name.lastIndexOf('.') + 1);
      if (ext === 'png') {
        let png = new PNG(data);
        data = {
          width: png.width,
          height: png.height,
          data: new Uint8Array(png.width * png.height * 4)
        };
        png.decodePixels((pixels) => {
          png.copyToImageData(data, pixels);
          data = blockhash(data, bits, method?2:1);
          cb(null, data);
        });
      } else if (ext === 'jpg' || ext === 'jpeg') {
        try {
          data = jpeg.decode(data);
        } catch(e) {
          return cb('Exception thrown decoding jpeg data');
        }

        data = blockhash(data, bits, method?2:1);
        cb(null, data);
      } else {
        cb(new Error('File extension no reconised'));
      }
    } else {
      cb(new Error('Cannot find file extension'));
    }
  };

  const handleRequest = (err, res, body) => {
    if (err) {
      cb(err);
    } else {
      checkFileType(res.request.uri.href, res.body);
    }
  };

  const handleReadFile = (err, res) => {
    if (err) {
      cb(err);
    } else {
      checkFileType(src, res);
    }
  };

  //check source
  //is source assigned
  if (src === undefined || src === undefined) {
    cb(new Error('No image source provided'));
  }

  //is src url or file
  if (typeof(src) === 'string' && src.indexOf('http') === 0) {
    //url
    let req = {
      url: src,
      encoding: null
    };

    request(req, handleRequest);

  } else if (typeof(src) === 'object') {
    //Request Object
    src.encoding = null;
    request(src, handleRequest);
  } else {
    //file
    fs.readFile(src, handleReadFile);
  }

};
