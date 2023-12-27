// This is the backend of the web panel

const fastify = require('fastify')();
const { EventEmitter } = require('events');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { Slide } = require('../classes/slide');
const apps = require('./apploader');

let emitter = new EventEmitter();
let code = null;
let tokens = [];
let isStarted = false;
let configData = null;
let currentSlide = 0;
let lastTime = Date.now();
let appSlides = [];

// Hook slide change event
emitter.on('slide-change', ( index ) => {
  currentSlide = index;
  lastTime = Date.now();
})

// Hook register slide event
emitter.on('registerSlide', ( slide ) => {
  appSlides.push(slide);
})

// When user opens the webpage, send the html file
fastify.get('/', ( req, reply ) => {
  reply.header('Content-Type', 'text/html');
  reply.send(fs.readFileSync(path.join(__dirname, '../../ui/panel/index.html'), 'utf8'));
})

// When user requests a file in the assets folder, send that file
fastify.get('/assets/:file', ( req, reply ) => {
  if(req.params.file.endsWith('.js'))
    reply.header('Content-Type', 'application/javascript');
  else if(req.params.file.endsWith('.css'))
    reply.header('Content-Type', 'text/css');

  reply.send(fs.readFileSync(path.join(__dirname, '../../ui/panel/assets/'+req.params.file), 'utf8'));
})

fastify.get('/api/v1/auth/type', ( req, reply ) => {
  if(configData.passcode)
    reply.send({ ok: true, type: 0 });
  else
    reply.send({ ok: true, type: 1 });
})

fastify.get('/api/v1/auth/link', ( req, reply ) => {
  if(configData.passcode)
    return reply.send({ ok: false, err: 'USE_PASSCODE' });

  if(isStarted){
    // If we are already playing slides, stop the slideshow and open the link code
    emitter.emit('stop');
    isStarted = false;

    setTimeout(() => {
      code = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      emitter.emit('link-code', code);

      setTimeout(() => code = null, 30000);
      reply.send({ ok: true });
    }, 1000)
  } else{
    // We're not showing slides so just show the link code
    code = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    emitter.emit('link-code', code);

    setTimeout(() => code = null, 30000);
    reply.send({ ok: true });
  }
})

fastify.post('/api/v1/auth', async ( req, reply ) => {
  if(isStarted)return reply.send({ ok: false, err: 'STARTED' });

  if(configData.passcode){
    if(req.body.code == null || typeof req.body.code !== 'string')return reply.send({ ok: false, err: 'CODE_INVALID' });
    if(!await configData.checkCode(req.body.code))return reply.send({ ok: false, err: 'CODE_INVALID' });
  } else{
    if(code == null)return reply.send({ ok: false, err: 'CODE_INVALID' });
    if(req.body.code !== code)return reply.send({ ok: false, err: 'CODE_INVALID' });
  }

  // Generate a token and send it to the client
  let token = crypto.randomBytes(32).toString('hex');
  tokens.push(token);

  emitter.emit('linked');
  reply.send({ ok: true, token: token });
})

fastify.get('/api/v1/slides', ( req, reply ) => {
  // Returns a list of all the slides

  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });
  reply.send({ ok: true, slides: configData.slides });
})

fastify.get('/api/v1/apps/slides', ( req, reply ) => {
  // Returns a list of all the available application slides

  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });
  reply.send({ ok: true, slides: appSlides.map(x => { return { name: x.name, id: x.id } }) });
})

fastify.get('/api/v1/apps/slides/:slide', ( req, reply ) => {
  // Returns a more detailed object about a specific application slide

  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });

  let slide = appSlides.find(x => x.id === req.params.slide);
  if(!slide)return reply.send({ ok: false, err: 'SLIDE_INVALID' });

  reply.send({ ok: true, options: slide.opts, id: slide.id, name: slide.name });
})

fastify.get('/api/v1', ( req, reply ) => {
  // Returns the current status of the app, also used as a heartbeat

  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });
  reply.send({ ok: true, running: isStarted, index: currentSlide, lastChange: lastTime });
})

fastify.put('/api/v1/slides', ( req, reply ) => {
  // Creates a new slide

  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });
  if(!req.body || !req.body.time || req.body.type == undefined || !req.body.time)return reply.send({ ok: false, err: 'BODY_INVALID' });

  if(req.body.type == 0 && !req.body.appId)return reply.send({ ok: false, err: 'APPID_INVALID' });
  else if(req.body.type == 1 && !req.body.url)return reply.send({ ok: false, err: 'URL_INVALID' });

  let slide = new Slide({
    type: req.body.type,
    time: req.body.time,
    appId: req.body.appId,
    url: req.body.url
  });

  emitter.emit('slides-update', 0, slide);

  configData.addSlide(slide);
  reply.send({ ok: true, slide });
})

fastify.put('/api/v1/slides/:id', ( req, reply ) => {
  // Update a specific slide

  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });
  if(!req.params.id)return reply.send({ ok: false, err: 'ID_INVALID' });

  if(!req.body || !req.body.time || !req.body.type || !req.body.time)return reply.send({ ok: false, err: 'BODY_INVALID' });

  if(req.body.type == 0 && !req.body.appId)return reply.send({ ok: false, err: 'APPID_INVALID' });
  else if(req.body.type == 1 && !req.body.url)return reply.send({ ok: false, err: 'URL_INVALID' });

  emitter.emit('slides-update', 2, configData.slides.find(x => x.id === req.params.id));

  configData.updateSlide(req.params.id, req.body);
  reply.send({ ok: true, slides: configData.slides });
})

fastify.delete('/api/v1/slides/:id', ( req, reply ) => {
  // Delete a specific slide

  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });
  if(!req.params.id)return reply.send({ ok: false, err: 'ID_INVALID' });

  emitter.emit('slides-update', 1, configData.slides.find(x => x.id === req.params.id));

  configData.removeSlide(req.params.id);
  reply.send({ ok: true, slides: configData.slides });
})

fastify.get('/api/v1/start', ( req, reply ) => {
  // Start the slideshow

  if(isStarted)return reply.send({ ok: false, err: 'STARTED' });
  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });

  if(configData.slides.length == 0)return reply.send({ ok: false, err: 'SLIDES_EMPTY' });
  emitter.emit('start');

  isStarted = true;
  reply.send({ ok: true });
})

fastify.get('/api/v1/stop', ( req, reply ) => {
  // Stop the slideshow

  if(!isStarted)return reply.send({ ok: false, err: 'STOPPED' });
  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });

  emitter.emit('stop');

  isStarted = false;
  reply.send({ ok: true });
})

fastify.put('/api/v1/apps/option', ( req, reply ) => {
  // Updates options for an app
  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });

  let app = appSlides.find(x => x.id == req.query.slideId);
  if(!app)return reply.send({ ok: false, err: 'ID_INVALID' });

  app.emit('options', req.body.key, req.body.value);
  reply.send({ ok: true });
})

fastify.get('/api/v1/settings', ( req, reply ) => {
  // Returns the current settings

  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });
  reply.send({ ok: true, autoStart: configData.autoStart, showAddr: configData.showAddr });
})

fastify.put('/api/v1/settings/passcode', async ( req, reply ) => {
  // Updates the "passcode" config value

  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });
  if(!req.body || req.body.value === undefined)return reply.send({ ok: false, err: 'VALUE_INVALID' });

  await configData.setPasscode(req.body.value);
  configData.save();

  reply.send({ ok: true });
})

fastify.put('/api/v1/settings/autoStart', ( req, reply ) => {
  // Updates the "autoStart" config value

  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });
  if(!req.body || req.body.value === undefined)return reply.send({ ok: false, err: 'VALUE_INVALID' });

  configData.autoStart = req.body.value;
  configData.save();

  reply.send({ ok: true });
})

fastify.put('/api/v1/settings/showAddr', ( req, reply ) => {
  // Updates the "showAddr" config value

  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });
  if(!req.body || req.body.value === undefined)return reply.send({ ok: false, err: 'VALUE_INVALID' });

  configData.showAddr = req.body.value;
  configData.save();

  reply.send({ ok: true });
})

fastify.get('/api/v1/slide/next', ( req, reply ) => {
  // Goes forwards to the next slide

  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });

  emitter.emit('next-slide', () => {
    reply.send({ ok: true, index: currentSlide });
  });
})

fastify.get('/api/v1/slide/prev', ( req, reply ) => {
  // Goes backwards to the previous slide

  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });

  emitter.emit('prev-slide', () => {
    reply.send({ ok: true, index: currentSlide });
  });
})

// Listens on port 3000
fastify.listen({ host: '0.0.0.0', port: 3000 });

let config = ( c ) => {
  // Called when the config is loaded
  configData = c

  if(configData.autoStart && configData.slides.length > 0)
    isStarted = true;

  // Loads external apps (./apploader.js)
  apps.config(configData, emitter);
  apps.loadApps();
};

module.exports = { getEmitter: () => emitter, config, getActive: () => isStarted, getAppSlides: () => appSlides };