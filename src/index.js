const { app, BrowserWindow, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { Config } = require('./classes/config');
const server = require('./backend/server');

app.commandLine.appendSwitch('ignore-certificate-errors');

if(!fs.existsSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.config/')))
  fs.mkdirSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.config/'), { recursive: true });

if(!fs.existsSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.config/astro.json')))
  fs.writeFileSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.config/astro.json'), JSON.stringify(Config.DefaultConfig));

let config = new Config(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.config/astro.json'));
server.config(config);

let slideTimeout = null;
let currentSlideIndex = 0;

app.on('ready', () => {
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
