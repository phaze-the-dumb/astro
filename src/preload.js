// This script is run on all pages the app loads
let blackout = document.createElement('div');

blackout.style.background = '#000';
blackout.style.position = 'fixed';
blackout.style.top = '0';
blackout.style.left = '0';
blackout.style.width = '100%';
blackout.style.height = '100%';
blackout.style.zIndex = '100000000000000';
blackout.style.transition = '0.5s';

let i = setInterval(() => {
  if(document.body){
    document.body.appendChild(blackout);
    window.clearInterval(i);
  }
}, 1)

const { contextBridge, ipcRenderer } = require('electron');
const ip = require('ip');
let alerts = [];

// Inject our custom styles into the web page
let styles = document.createElement('style');
styles.innerHTML = `
.alert{z-index: 100000000000;position: fixed;top: 50px;left: -430px;width: 400px;background: rgba(68, 68, 68, 0.568);backdrop-filter: blur(10px);min-height: 70px;border-bottom: #00ccff 10px solid;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;padding: 10px;color: white;transition: 0.5s;box-shadow: #0005 0 0 10px;opacity: 0;}
.alert-title{font-size: 25px;}
.alert-body{display: flex;justify-content: left;align-items: center;height: 40px;color: #ccc;font-size: 15px;}`

// Define "Alert" class
class Alert{
  constructor( title, body, time ){
    alerts.forEach(a => a.moveDown());
    alerts.push(this);

    this.title = title;
    this.top = 50;

    if(body.length > 50)
      this.body = body.slice(0, 50) + '...';
    else
      this.body = body;

    this.div = document.createElement('div');
    this.div.className = 'alert';

    let tt = document.createElement('div');
    tt.className = 'alert-title';

    let bd = document.createElement('div');
    bd.className = 'alert-body';

    tt.innerHTML = title;
    bd.innerHTML = this.body;

    this.div.appendChild(tt);
    this.div.appendChild(bd);

    this.div.style.top = this.top + 'px';
    document.body.appendChild(this.div);

    this.timeout = setTimeout(() => {
      this.div.style.left = '0';
      this.div.style.opacity = '1';

      setTimeout(() => {
        this.remove();
      }, time);
    }, 10)
  }

  remove(){
    alerts = alerts.filter(x => x !== this);

    this.div.style.left = '-430px';
    this.div.style.opacity = '0';

    setTimeout(() => {
      this.div.remove();
    }, 100);
  }

  moveDown(){
    this.top += 120;
    this.div.style.top = this.top + 'px';

    if(this.top > window.innerHeight - 200) {
      this.remove();
      window.clearTimeout(this.timeout);
    }
  }
}

// Make events accessible by external site
contextBridge.exposeInMainWorld('electronAPI', {
  on: ( event, cb ) => ipcRenderer.on(event, cb)
})

// Hook load event
window.addEventListener('load', () => {
  setTimeout(() => {
    blackout.style.opacity = '0';
  }, 10)

  ipcRenderer.send('getConfig');

  // If we have show address option enabled load the address in the bottom right corner
  ipcRenderer.on('getConfig', ( event, config ) => {
    console.log(config);
    if(config.showAddr){
      let webUrl = document.createElement('div');
      webUrl.innerHTML = ip.address() + ':3000';

      webUrl.style.position = 'fixed';
      webUrl.style.bottom = '10px';
      webUrl.style.right = '10px';
      webUrl.style.color = '#aaa';
      webUrl.style.fontSize = '15px';
      webUrl.style.fontFamily = '\'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif';

      document.body.appendChild(webUrl);
    }
  })

  // Add our custom styles to the page
  document.body.appendChild(styles);
});

// Hook slide update event so we can show alerts for that
ipcRenderer.on('slides-update', ( _event, type, slide ) => {
  let title = '';
  let body = '';

  title = type == 0 ? 'Slide Added' : type == 1 ? 'Slide Removed' : 'Slide Updated';
  body = slide.type == 1 ? slide.url : slide.appId;

  new Alert(title, body, 5000);
});

ipcRenderer.on('query-selector', ( _event, selector ) => {
  ipcRenderer.send('query-selector', document.querySelectorAll(selector));
})

ipcRenderer.on('unload', () => {
  blackout.style.opacity = '1';
})