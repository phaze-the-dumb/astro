const { randomUUID } = require('crypto');
const { EventEmitter } = require('events');

class Slide extends EventEmitter{
  constructor(name, loaderEmitter){
    super();

    this.name = name;
    this.parentEmitter = loaderEmitter;
    this.opts = {};
    this.id = randomUUID();
  }

  addStringOption(name){
    this.opts[name] = { type: 'String', value: null };
    return this;
  }

  build(){
    this.parentEmitter.emit('registerSlide', this);
    return this;
  }
}

module.exports = { Slide };