// Imports
const { app, BrowserWindow, ipcMain, nativeImage, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { Config } = require('./classes/config');
const server = require('./backend/server');
const adblockRust = require('adblock-rs');

// Usually this would be a very bad idea, but this app is needed to be able to open websites with self signed certs.
app.commandLine.appendSwitch('ignore-certificate-errors');

// Check if config files exist, if not create them
if(!fs.existsSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.config/')))
  fs.mkdirSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.config/'), { recursive: true });

if(!fs.existsSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.config/astro.json')))
  fs.writeFileSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.config/astro.json'), JSON.stringify(Config.DefaultConfig));

// Load the config into the config class (./classes/config.js)
let config = new Config(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.config/astro.json'));
server.config(config);

let slideTimeout = null;
let currentSlideIndex = 0;
let currentUrl = 'http://localhost';

const filterSet = new adblockRust.FilterSet(false);

let easylistFilters = fs.readFileSync(__dirname + '/data/easylist.txt', { encoding: 'utf-8' }).split('\n');
filterSet.addFilters(easylistFilters);

let uboUnbreakFilters = fs.readFileSync(__dirname + '/data/unbreak.txt', { encoding: 'utf-8' }).split('\n');
filterSet.addFilters(uboUnbreakFilters);

const resources = adblockRust.uBlockResources(
  __dirname + '/data/fake-uBO-files/web_accessible_resources',
  __dirname + '/data/fake-uBO-files/redirect-resources.js',
  __dirname + '/data/fake-uBO-files/scriptlets.js'
);

const engine = new adblockRust.Engine(filterSet, false);
engine.useResources(resources);

app.on('ready', () => {
  session.defaultSession.webRequest.onBeforeRequest({ urls: [ '*://*/*' ] }, ( details, callback ) => {
    if(engine.check(details.url, currentUrl, 'script')){
      callback({ cancel: true });
    } else{
      callback({ cancel: false });
    }
  })

  const mainWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: true
    }
  });

  mainWindow.setMenuBarVisibility(false);

  if(config.autoStart && config.slides.length > 0){
    displaySlide(mainWindow);
  } else{
    if(isDev = process.env.APP_DEV ? (process.env.APP_DEV.trim() == "true") : false)
      mainWindow.loadURL('http://localhost:5173/');
    else
      mainWindow.loadFile(path.join(__dirname, '../ui/index.html'));
  }

  let icon = nativeImage.createFromPath(path.join(__dirname, '../build/icon.ico'));
  mainWindow.setIcon(icon);

  server.getEmitter().on('link-code', ( code ) => {
    mainWindow.webContents.send('link-code', code);
  })

  server.getEmitter().on('linked', () => {
    mainWindow.webContents.send('linked');
  })

  server.getEmitter().on('slides-update', ( type, slide ) => {
    mainWindow.webContents.send('slides-update', type, slide);
  })

  server.getEmitter().on('start', () => {
    mainWindow.webContents.send('unload');
    currentSlideIndex = 0;

    setTimeout(() => {
      displaySlide(mainWindow);
    }, 100);
  })

  server.getEmitter().on('stop', () => {
    clearTimeout(slideTimeout);
    currentUrl = 'http://localhost';

    if(isDev = process.env.APP_DEV ? (process.env.APP_DEV.trim() == "true") : false)
      mainWindow.loadURL('http://localhost:5173/');
    else
      mainWindow.loadFile(path.join(__dirname, '../ui/index.html'));
  })

  server.getEmitter().on('next-slide', ( cb ) => {
    clearTimeout(slideTimeout);

    if(config.slides[currentSlideIndex + 1]){
      currentSlideIndex += 1;
      displaySlide(mainWindow);
    } else{
      currentSlideIndex = 0;
      displaySlide(mainWindow);
    }

    cb();
  });

  server.getEmitter().on('prev-slide', ( cb ) => {
    clearTimeout(slideTimeout);

    if(config.slides[currentSlideIndex - 1]){
      currentSlideIndex -= 1;
      displaySlide(mainWindow);
    } else{
      currentSlideIndex = config.slides.length - 1;
      displaySlide(mainWindow);
    }

    cb();
  });

  ipcMain.on('getConfig', () => {
    mainWindow.webContents.send('getConfig', config);
  });
});

let displaySlide = ( win ) => {
  server.getEmitter().emit('slide-change', currentSlideIndex);
  let currentSlide = config.slides[currentSlideIndex];

  switch(currentSlide.type) {
    case 1:
      currentUrl = currentSlide.url;
      win.loadURL(currentSlide.url);
      break;
  }

  slideTimeout = setTimeout(() => {
    if(!server.getActive())return;

    if(config.slides[currentSlideIndex + 1]){
      currentSlideIndex += 1;
      displaySlide(win);
    } else{
      currentSlideIndex = 0;
      displaySlide(win);
    }
  }, currentSlide.time);
}
