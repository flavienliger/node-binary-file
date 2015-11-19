'use strict';

const BINARY_LENGTH = {
  'Int8': 1,
  'UInt8': 1,
  'Int16': 2,
  'UInt16': 2,
  'Int32': 4,
  'UInt32': 4,
  'Float': 4,
  'Double': 8
};

let denodeify = require('denodeify');
let fsOpen = denodeify(require('fs').open);
let fsRead = denodeify(require('fs').read);
let fsFstat = denodeify(require('fs').fstat);
let fsClose = denodeify(require('fs').close);
let fsWrite = denodeify(require('fs').write);

class BinaryFile {
  constructor (path, mode, littleEndian) {
    var that = this;
    
    littleEndian = littleEndian || false;
    this.endianness = littleEndian ? 'LE' : 'BE';
    this.cursor = 0;
    return new Promise(function(resolve, reject){
      fsOpen(path, mode).then(function(fd){
        that.fd = fd;
        resolve(that);
      }).catch(reject);
    });
  }

  // Misc

  size () {
    var that = this;
    
    return new Promise(function(resolve){
      fsFstat(that.fd).then(function(stat){
        resolve(stat.size);
      });
    });
  }

  seek (position) {
    this.cursor = position;
    return position;
  }

  tell () {
    return this.cursor;
  }

  close () {
    var that = this;
    
    return new Promise(function(resolve){
      fsClose(that.fd, function(){
        resolve(true);
      });
    });
  }

  // Read

  read (length, position) {
    var that = this;
    
    return new Promise(function(resolve){
      let buffer = new Buffer(length);
      
      fsRead(that.fd, buffer, 0, buffer.length, position || that.cursor).then(function(bytesRead){
        if (!position) that.cursor += bytesRead;
        resolve(buffer);
      });
    });
  }

  _readNumericType (type, position) {
    var that = this;
    
    return new Promise(function(resolve){
      let length = BINARY_LENGTH[type];
      that.read(length, position).then(function(buffer){
        let value = buffer['read' + type + (length > 1 ? that.endianness : '')](0);
        resolve(value);
      });
    });
  }

  readInt8 (position) {
    return this._readNumericType('Int8', position);
  }

  readUInt8 (position) {
    return this._readNumericType('UInt8', position);
  }

  readInt16 (position) {
    return this._readNumericType('Int16', position);
  }

  readUInt16 (position) {
    return this._readNumericType('UInt16', position);
  }

  readInt32 (position) {
    return this._readNumericType('Int32', position);
  }

  readUInt32 (position) {
    return this._readNumericType('UInt32', position);
  }

  readFloat (position) {
    return this._readNumericType('Float', position);
  }

  readDouble (position) {
    return this._readNumericType('Double', position);
  }

  readString (length, position) {
    var that = this;
    
    return new Promise(function(resolve){
      that.read(length, position).then(function(buffer){
        let value = buffer.toString();
        resolve(value);
      });
    });
  }

  // Write

  write (buffer, position) {
    var that = this;
    
    return new Promise(function(resolve){
      fsWrite(that.fd, buffer, 0, buffer.length, position || that.cursor).then(function(bytesWritten){
        if (!position) that.cursor += bytesWritten;
        resolve(bytesWritten);
      });
    });
  }

  _writeNumericType (value, type, position) {
    var that = this;
    
    return new Promise(function(resolve){
      let length = BINARY_LENGTH[type];
      let buffer = new Buffer(length);
      buffer['write' + type + (length > 1 ? that.endianness : '')](value, 0);
      that.write(buffer, position).then(function(bytesWritten){
        resolve(bytesWritten);
      });
    });
  }

  writeInt8 (value, position) {
    return this._writeNumericType(value, 'Int8', position);
  }

  writeUInt8 (value, position) {
    return this._writeNumericType(value, 'UInt8', position);
  }

  writeInt16 (value, position) {
    return this._writeNumericType(value, 'Int16', position);
  }

  writeUInt16 (value, position) {
    return this._writeNumericType(value, 'UInt16', position);
  }

  writeInt32 (value, position) {
    return this._writeNumericType(value, 'Int32', position);
  }

  writeUInt32 (value, position) {
    return this._writeNumericType(value, 'UInt32', position);
  }

  writeFloat (value, position) {
    return this._writeNumericType(value, 'Float', position);
  }

  writeDouble (value, position) {
    return this._writeNumericType(value, 'Double', position);
  }

  writeString (value, position) {
    let buffer = new Buffer(value);
    return this.write(buffer, position);
  }
}

module.exports = BinaryFile;
