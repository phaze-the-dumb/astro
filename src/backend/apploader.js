// Loads the application files

const fs = require('fs');
const path = require('path');
const os = require('os');
const { Application } = require('../classes/app');
const { Slide } = require('../classes/appslide');

// Checks if the application directory exists
if(!fs.existsSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.cache/astroapps')))
  fs.mkdirSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.cache/astroapps'), { recursive: true });

// Init empty values
let apps = [];
let configData = null;
let emitter;

// Create an interface for the applications to hook into
let itrfc = {
  registerSlide: ( name ) => {
    // When the application wants to create a new slide template, create a new appslide class (../classes/appslide.js)
    let slide = new Slide(name, emitter);

    return slide;
  }
}

let loadApps = () => {
  // Read all the dirs in the folders
  let folders = fs.readdirSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.cache/astroapps'));

  for(let folder of folders) {
    // For every folder, create a new app instance (../classes/app.js)
    let app = new Application(itrfc);

    let registerAppEvents = () => {
      app.on('load-html', ( htmlPath ) => {
        emitter.emit('load-html', htmlPath);
      })

      app.on('load-url', ( urlPath ) => {
        emitter.emit('load-url', urlPath);
      })
    }

    // Hook load event and hook the err event, but only once
    app.on('load', () => {
      apps.push(app);
      console.log('Loaded App: '+app.name)

      app.removeAllListeners();
      registerAppEvents();
    })

    app.on('err', ( err ) => {
      console.error('Failed to load: '+app.name, err);

      app.removeAllListeners();
      registerAppEvents();
    })

    // Tell the app class to load a specific folder
    app.load(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.cache/astroapps/', folder));
  }
}

let config = ( c, e ) => {
  // Called when the config is loaded

  configData = c;
  emitter = e;
}

module.exports = { loadApps, getApps: () => apps, config };