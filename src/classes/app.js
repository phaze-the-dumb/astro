const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

class Application extends EventEmitter{
  constructor( itrfc ){
    super();
    this.interface = itrfc;
  }

  load( p ){
    let stat = fs.statSync(p);

    if(stat.isFile())
      return this.emit('err', 'Not a directory');

    if(!fs.existsSync(p + '/app.json'))
      return this.emit('err', '"app.json" Not found');

    this.json = JSON.parse(fs.readFileSync(p + '/app.json'));

    this.name = this.json.name;
    this.version = this.json.version;
    this.author = this.json.author;
    this.enabled = this.json.enabled;
    this.main = this.json.main;

    if(!this.enabled)
      return this.emit('err', 'App is not enabled');

    if(!fs.existsSync(path.join(p, this.main)))
      return this.emit('err', '"'+this.main+'" Not found');

    this.app = new (require(path.join(p, this.main)))(this.interface);
    this.emit('load');
  }
}

module.exports = { Application };