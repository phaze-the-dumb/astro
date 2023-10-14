const fs = require('fs');
const path = require('path');
const os = require('os');
const { Application } = require('../classes/app');
const { Slide } = require('../classes/appslide');

if(!fs.existsSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.cache/astroapps')))
  fs.mkdirSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.cache/astroapps'), { recursive: true });

let apps = [];
let configData = null;
let emitter;

let itrfc = {
  registerSlide: ( name ) => {
    let slide = new Slide(name, emitter);
    return slide;
  }
}

let loadApps = () => {
  let folders = fs.readdirSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.cache/astroapps'));

  for(let folder of folders) {
    let app = new Application(itrfc);

    app.on('load', () => {
      apps.push(app);
      console.log('Loaded App: '+app.name)

      app.removeAllListeners();
    })

    app.on('err', ( err ) => {
      console.error('Failed to load: '+app.name, err);

      app.removeAllListeners();
    })

    app.load(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.cache/astroapps/', folder));
  }
}

let config = ( c, e ) => {
  configData = c;
  emitter = e;
}

module.exports = { loadApps, getApps: () => apps, config };