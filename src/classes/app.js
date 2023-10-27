// The main runner of the application

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const { Slide } = require('../classes/appslide');

class Application extends EventEmitter{
  constructor(loaderEmitter){
    super();

    // Create an interface for the applications to hook into
    this.interface = {
      registerSlide: ( name ) => {
        // When the application wants to create a new slide template, create a new appslide class (../classes/appslide.js)
        let slide = new Slide(name, loaderEmitter, this);

        return slide;
      }
    }

    this.pageInterface = {
      querySelector: ( selector ) => {
        
      }
    }
  }

  load( p ){
    // Make sure the app is a directory
    let stat = fs.statSync(p);

    if(stat.isFile())
      return this.emit('err', 'Not a directory');

    // Make sure the main app file exists
    if(!fs.existsSync(p + '/app.json'))
      return this.emit('err', '"app.json" Not found');

    // Parse the app config as JSON
    this.json = JSON.parse(fs.readFileSync(p + '/app.json'));

    // Update application information to match the config file
    this.name = this.json.name;
    this.version = this.json.version;
    this.author = this.json.author;
    this.enabled = this.json.enabled;
    this.main = this.json.main;

    // If app is disabled do not load it
    if(!this.enabled)
      return this.emit('err', 'App is not enabled');

    // Check that the main js file exists
    if(!fs.existsSync(path.join(p, this.main)))
      return this.emit('err', '"'+this.main+'" Not found');

    // Run the application code
    this.app = new (require(path.join(p, this.main)))(this.interface);
    this.emit('load');
  }
}

module.exports = { Application };