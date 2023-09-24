const fastify = require('fastify')();
const { EventEmitter } = require('events');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { Slide } = require('../classes/slide');

let emitter = new EventEmitter();
let code = null;
let tokens = [];
let isStarted = false;
let configData = null;
let currentSlide = 0;
let lastTime = Date.now();

emitter.on('slide-change', ( index ) => {
  currentSlide = index;
  lastTime = Date.now();
})

fastify.get('/', ( req, reply ) => {
  reply.header('Content-Type', 'text/html');
  reply.send(fs.readFileSync(path.join(__dirname, '../../ui/panel/index.html'), 'utf8'));
})

fastify.get('/assets/:file', ( req, reply ) => {
  if(req.params.file.endsWith('.js'))
    reply.header('Content-Type', 'application/javascript');
  else if(req.params.file.endsWith('.css'))
    reply.header('Content-Type', 'text/css');

  reply.send(fs.readFileSync(path.join(__dirname, '../../ui/panel/assets/'+req.params.file), 'utf8'));
})

fastify.get('/api/v1/auth/link', ( req, reply ) => {
  if(isStarted){
    emitter.emit('stop');
    isStarted = false;

    setTimeout(() => {
      code = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      emitter.emit('link-code', code);

      setTimeout(() => code = null, 30000);
      reply.send({ ok: true });
    }, 1000)
  } else{
    code = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    emitter.emit('link-code', code);

    setTimeout(() => code = null, 30000);
    reply.send({ ok: true });
  }
})

fastify.post('/api/v1/auth', ( req, reply ) => {
  if(isStarted)return reply.send({ ok: false, err: 'STARTED' });

  if(code == null)return reply.send({ ok: false, err: 'CODE_INVALID' });
  if(req.body.code !== code)return reply.send({ ok: false, err: 'CODE_INVALID' });

  let token = crypto.randomBytes(32).toString('hex');
  tokens.push(token);

  emitter.emit('linked');
  reply.send({ ok: true, token: token });
})

fastify.get('/api/v1/slides', ( req, reply ) => {
  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });
  reply.send({ ok: true, slides: configData.slides });
})

fastify.get('/api/v1', ( req, reply ) => {
  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });
  reply.send({ ok: true, running: isStarted, index: currentSlide, lastChange: lastTime });
})

fastify.put('/api/v1/slides', ( req, reply ) => {
  if(isStarted)return reply.send({ ok: false, err: 'STARTED' });

  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });
  if(!req.body || !req.body.time || !req.body.type || !req.body.time)return reply.send({ ok: false, err: 'BODY_INVALID' });

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
  reply.send({ ok: true, slides: configData.slides });
})

fastify.put('/api/v1/slides/:id', ( req, reply ) => {
  if(isStarted)return reply.send({ ok: false, err: 'STARTED' });

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
  if(isStarted)return reply.send({ ok: false, err: 'STARTED' });

  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });
  if(!req.params.id)return reply.send({ ok: false, err: 'ID_INVALID' });

  emitter.emit('slides-update', 1, configData.slides.find(x => x.id === req.params.id));

  configData.removeSlide(req.params.id);
  reply.send({ ok: true, slides: configData.slides });
})

fastify.get('/api/v1/start', ( req, reply ) => {
  if(isStarted)return reply.send({ ok: false, err: 'STARTED' });
  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });

  if(configData.slides.length == 0)return reply.send({ ok: false, err: 'SLIDES_EMPTY' });
  emitter.emit('start');

  isStarted = true;
  reply.send({ ok: true });
})

fastify.get('/api/v1/stop', ( req, reply ) => {
  if(!isStarted)return reply.send({ ok: false, err: 'STOPPED' });
  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });

  emitter.emit('stop');

  isStarted = false;
  reply.send({ ok: true });
})

fastify.put('/api/v1/settings/autoStart', ( req, reply ) => {
  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });
  if(!req.body || !req.body.value)return reply.send({ ok: false, err: 'VALUE_INVALID' });

  configData.autoStart = req.body.value;
  configData.save();

  reply.send({ ok: true });
})

fastify.put('/api/v1/settings/showAddr', ( req, reply ) => {
  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });
  if(!req.body || !req.body.value)return reply.send({ ok: false, err: 'VALUE_INVALID' });

  configData.showAddr = req.body.value;
  configData.save();

  reply.send({ ok: true });
})

fastify.get('/api/v1/slide/next', ( req, reply ) => {
  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });

  emitter.emit('next-slide', () => {
    reply.send({ ok: true, index: currentSlide });
  });
})

fastify.get('/api/v1/slide/prev', ( req, reply ) => {
  if(!tokens.find(x => x == req.headers.token))return reply.send({ ok: false, err: 'TOKEN_INVALID' });

  emitter.emit('prev-slide', () => {
    reply.send({ ok: true, index: currentSlide });
  });
})

fastify.listen({ host: '0.0.0.0', port: 3000 });

let config = ( c ) => {
  configData = c

  if(configData.autoStart && configData.slides.length > 0)
    isStarted = true;
};
module.exports = { getEmitter: () => emitter, config, getActive: () => isStarted };