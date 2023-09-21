const { app, BrowserWindow } = require('electron');
const path = require('path');

app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    fullscreen: true
  });

  if(isDev = process.env.APP_DEV ? (process.env.APP_DEV.trim() == "true") : false)
    mainWindow.loadURL('http://localhost:5173/');
  else
    mainWindow.loadFile(path.join(__dirname, '../ui/index.html'));
});
