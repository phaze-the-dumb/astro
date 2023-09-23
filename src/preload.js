const { contextBridge, ipcRenderer } = require('electron');
const ip = require('ip');

contextBridge.exposeInMainWorld('electronAPI', {
  on: ( event, cb ) => ipcRenderer.on(event, cb)
})

window.addEventListener('load', () => {
  ipcRenderer.send('getConfig');

  ipcRenderer.on('getConfig', ( event, config ) => {
    console.log(config);
    if(config.showAddr){
      let webUrl = document.createElement('div');
      webUrl.innerHTML = ip.address() + ':3000';

      webUrl.style.position = 'fixed';
      webUrl.style.bottom = '10px';
      webUrl.style.right = '10px';
      webUrl.style.color = '#aaa';
      webUrl.style.fontFamily = '\'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif';

      document.body.appendChild(webUrl);
    }
  })
});