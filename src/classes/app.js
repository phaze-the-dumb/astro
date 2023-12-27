// The main runner of the application

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const { AstroElement } = require('../classes/element');

class Application extends EventEmitter{
  constructor(loaderEmitter){
    super();

    // Create an interface for the applications to hook into
    this.interface = {
      registerSlide: ( SlideClass, options ) => {
        if(!options.name)
          throw new Error("Cannot create a new slide without a valid name.");

        if(!options.options)options.options = [];

        // Tell the webserver that there is another available slide
        loaderEmitter.emit('availableSlide', options, SlideClass, this);
      }
    }

    this.slideInterface = {
      loadHTML: (file) => {
        return new Promise((res, rej) => {
          loaderEmitter.once('slide-loaded', ( ok ) => {
            if(ok)
              res(this.pageInterface);
            else
              rej();
          })
    
          loaderEmitter.emit('load-html', file);
        })
      },
  
      loadURL: (url) => {
        return new Promise((res, rej) => {
          loaderEmitter.once('slide-loaded', ( ok ) => {
            if(ok)
              res(this.pageInterface);
            else
              rej();
          })
    
          loaderEmitter.emit('load-url', url);
        })
      }
    }

    this.pageInterface = {
      querySelector: ( selector ) => {
        return new Promise(( res ) => {
          loaderEmitter.emit('query-selector', selector);

          let timeout = setTimeout(() => {
            console.warn('No query selector response in 5 seconds, has the frontend crashed?');
            loaderEmitter.removeListener('query-selector', cb);
          }, 5000);
  
          let cb = ( element, query ) => {
            if(query === selector){
              loaderEmitter.removeListener('query-selector', cb);
              clearTimeout(timeout);
  
              let elData = JSON.parse(element)[0];
              let el = new AstroElement();
              
              el.class = elData.class;
              el.id = elData.id;
              el.innerHTML = elData.innerHTML;
  
              el.setClass = ( cls ) => {
                el.class = cls;
                loaderEmitter.emit('selector-command', '#' + el.id, 'set-class', cls);
              }
  
              el.setInnerHTML = ( html ) => {
                el.innerHTML = html;
                loaderEmitter.emit('selector-command', '#' + el.id, 'set-innerhtml', html);
              }

              el.setProperty = ( key, value ) => {
                loaderEmitter.emit('selector-command', '#' + el.id, 'set-property', key + ',|,|,' + value);
              }

              res(el);
            }
          }
  
          loaderEmitter.on('query-selector', cb);
        })
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
    this.emit('load');
    this.app = new (require(path.join(p, this.main)))(this.interface);
  }

  createSlide(SlideClass, options){
    return new SlideClass(this.slideInterface, options);
  }
}

module.exports = { Application };