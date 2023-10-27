// Imports
const { app, BrowserWindow, ipcMain, nativeImage, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { Config } = require('./classes/config');
const server = require('./backend/server');
const adblockRust = require('adblock-rs');

// Debugging
const unhandled = require('electron-unhandled');
const { openNewGitHubIssue, debugInfo } = require('electron-util');

unhandled({
	reportButton: error => {
		openNewGitHubIssue({
			user: 'phaze-the-dumb',
			repo: 'astro',
			body: `\`\`\`\n${error.stack}\n\`\`\`\n\n---\n\n${debugInfo()}`
		});
	}
});

// Usually this would be a very bad idea, but this app is needed to be able to open websites with self signed certs.
app.commandLine.appendSwitch('ignore-certificate-errors');

// Check if config files exist, if not create them
if(!fs.existsSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.config/')))
  fs.mkdirSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.config/'), { recursive: true });

if(!fs.existsSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.config/astro.json')))
  fs.writeFileSync(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.config/astro.json'), JSON.stringify(Config.DefaultConfig));

// Load the config into the config class (./classes/config.js)
let config = new Config(path.join(os.homedir(), './AppData/Roaming/PhazeDev/.config/astro.json'));

// Init empty values
let slideTimeout = null;
let currentSlideIndex = 0;
let currentUrl = 'http://localhost';
let onSlideLoaded = () => {};
let onSlideLoadFail = () => {};

// Create a new adblocking filter
const filterSet = new adblockRust.FilterSet(false);

// Load the easylist.txt filter
let easylistFilters = fs.readFileSync(__dirname + '/data/easylist.txt', { encoding: 'utf-8' }).split('\n');
filterSet.addFilters(easylistFilters);

// Load the unbreak.txt filter
let uboUnbreakFilters = fs.readFileSync(__dirname + '/data/unbreak.txt', { encoding: 'utf-8' }).split('\n');
filterSet.addFilters(uboUnbreakFilters);

// Load the uBlock Origin files
const resources = adblockRust.uBlockResources(
  __dirname + '/data/fake-uBO-files/web_accessible_resources',
  __dirname + '/data/fake-uBO-files/redirect-resources.js',
  __dirname + '/data/fake-uBO-files/scriptlets.js'
);

// Create an adblocking engine
const engine = new adblockRust.Engine(filterSet, false);
engine.useResources(resources);

app.on('ready', () => {
  // When the app is ready, hook into electrons webrequest module
  session.defaultSession.webRequest.onBeforeRequest({ urls: [ '*://*/*' ] }, ( details, callback ) => {
    // Filter the urls so ads do not load
    if(engine.check(details.url, currentUrl, 'script')){
      callback({ cancel: true });
    } else{
      callback({ cancel: false });
    }
  })

  // Create the main window
  const mainWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: true
    }
  });

  // Hide the windows menu bar
  mainWindow.setMenuBarVisibility(false);

  // Load the applications icon
  let icon = nativeImage.createFromPath(path.join(__dirname, '../build/icon.ico'));
  mainWindow.setIcon(icon);

  // Hook slide load and slide load fail events
  mainWindow.webContents.on('did-finish-load', () => {
    onSlideLoaded();
  })

  mainWindow.webContents.on('did-fail-load', () => {
    onSlideLoadFail();
  })

  // Hook the link code event, and relay it to the window contents
  server.getEmitter().on('link-code', ( code ) => {
    mainWindow.webContents.send('link-code', code);
  })

  // Hook the linked event, and relay it to the window contents
  server.getEmitter().on('linked', () => {
    mainWindow.webContents.send('linked');
  })

  // Hook the slides update event, and relay it to the window contents
  server.getEmitter().on('slides-update', ( type, slide ) => {
    mainWindow.webContents.send('slides-update', type, slide);
  })

  server.getEmitter().on('load-url', ( urlPath ) => {
    onSlideLoaded = () => {
      server.getEmitter().emit('slide-loaded', true);

      onSlideLoaded = () => {};
      onSlideLoadFail = () => {};
    }

    onSlideLoadFail = () => {
      server.getEmitter().emit('slide-loaded', false);

      onSlideLoaded = () => {};
      onSlideLoadFail = () => {};
    }

    mainWindow.loadURL(urlPath);
  })

  server.getEmitter().on('load-html', ( filePath ) => {
    onSlideLoaded = () => {
      server.getEmitter().emit('slide-loaded', true);

      onSlideLoaded = () => {};
      onSlideLoadFail = () => {};
    }

    onSlideLoadFail = () => {
      server.getEmitter().emit('slide-loaded', false);

      onSlideLoaded = () => {};
      onSlideLoadFail = () => {};
    }

    mainWindow.loadFile(filePath);
  })

  // Hook the start event, and start the slideshow
  server.getEmitter().on('start', () => {
    mainWindow.webContents.send('unload');
    currentSlideIndex = 0;

    setTimeout(() => {
      displaySlide(mainWindow);
    }, 100);
  })

  // Hook the stop event, and stop the slideshow
  server.getEmitter().on('stop', () => {
    clearTimeout(slideTimeout);
    currentUrl = 'http://localhost';

    // Load the landing page
    if(isDev = process.env.APP_DEV ? (process.env.APP_DEV.trim() == "true") : false)
      mainWindow.loadURL('http://localhost:5173/');
    else
      mainWindow.loadFile(path.join(__dirname, '../ui/index.html'));
  })

  // Hook the next slide evemt and go to the next slide
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

  // Hook the prev slide event and go to the previous slide
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

  // When the window contents requests the config file, send the config file
  ipcMain.on('getConfig', () => {
    mainWindow.webContents.send('getConfig', config);
  });

  // After hooking everything, start the server
  server.config(config);

  // If autostart is enabled and we have slides, start the slideshow
  if(config.autoStart && config.slides.length > 0){
    displaySlide(mainWindow);
  } else{
    // If not load the landing page

    if(isDev = process.env.APP_DEV ? (process.env.APP_DEV.trim() == "true") : false)
      mainWindow.loadURL('http://localhost:5173/');
    else
      mainWindow.loadFile(path.join(__dirname, '../ui/index.html'));
  }
});

let displaySlide = ( win ) => {
  // Call the slide change event
  server.getEmitter().emit('slide-change', currentSlideIndex);
  let currentSlide = config.slides[currentSlideIndex];

  // Check what type of slide it is, if it's a website, load the website
  switch(currentSlide.type) {
    case 0:
      let app = server.getAppSlides().find(x => x.id === currentSlide.appId);
      app.emit('load');

      break;
    case 1:
      currentUrl = currentSlide.url;
      win.loadURL(currentSlide.url);
      break;
  }

  // Wait for the time to run out
  slideTimeout = setTimeout(() => {
    if(!server.getActive())return;

    // Go to the next slide
    if(config.slides[currentSlideIndex + 1]){
      currentSlideIndex += 1;
      displaySlide(win);
    } else{
      currentSlideIndex = 0;
      displaySlide(win);
    }
  }, currentSlide.time);
}