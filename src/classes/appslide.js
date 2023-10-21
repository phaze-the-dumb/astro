// Holds the interface for slide templates

const { randomUUID } = require('crypto');
const { EventEmitter } = require('events');

class Slide extends EventEmitter{
  constructor(name, loaderEmitter){
    super();

    // Update class information to match slide
    this.name = name;
    this.parentEmitter = loaderEmitter;
    this.opts = {};
    this.id = randomUUID();
  }

  setID(id){
    this.id = id;
    return this;
  }

  addStringOption(name){
    // Create a string setting
    this.opts[name] = { type: 'String', value: null };

    return this;
  }

  build(){
    // Add slide to global list
    this.parentEmitter.emit('registerSlide', this);

    return this;
  }

  loadHTML(file){
    this.parentEmitter.emit('load-html', file);
  }

  loadURL(url){
    this.parentEmitter.emit('load-url', url);
  }
}

module.exports = { Slide };