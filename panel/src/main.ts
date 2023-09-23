import './style.css';
import { Alert } from './notifications';
import { Input } from './input';
import { Slide } from './slide';

let getCodeButton = document.querySelector<HTMLElement>('#get-code')!;
let startButton = document.querySelector<HTMLElement>('#start-button')!;
let stopButton = document.querySelector<HTMLElement>('#stop-button')!;
let prevButton = document.querySelector<HTMLElement>('#prev-button')!;
let nextButton = document.querySelector<HTMLElement>('#next-button')!;
let playerInfo = document.querySelector<HTMLElement>('.player-info')!;
let codeInput = document.querySelector<HTMLElement>('.code-input')!;
let mainContainer = document.querySelector<HTMLElement>('.main')!;
let player = document.querySelector<HTMLElement>('.player')!;
let loader = document.querySelector<HTMLElement>('.loading-indicator')!;
let linkCode = new Input('submit-code');

let errorCodes: any = {
  'STARTED': 'App is currently running through slides. Please stop it first.',
  'CODE_INVALID': 'Incorrect Code.',
  'TOKEN_INVALID': 'Token has expired. Or is incorrect.',
  'SLIDES_EMPTY': 'There are no slides to display.'
}

let slides: Slide[] = [];

window.onload = () => {
  if(!localStorage.getItem('token'))return;

  fetch('/api/v1', {
    headers: {
      token: localStorage.getItem('token')!
    }
  })
    .then(data => data.json())
    .then(data => {
      if(data.ok){
        getCodeButton.style.display = 'none';
        main();
      }
    })
}

getCodeButton.onclick = () => {
  loader.style.display = 'block';

  fetch('/api/v1/auth/link')
    .then(data => data.json())
    .then(data => {
      if(data.ok){
        loader.style.display = 'none';
        codeInput.style.display = 'block';
        getCodeButton.style.display = 'none';
      } else{
        new Alert('Error', errorCodes[data.err], 5000);
      }
    })
    .catch(e => {
      new Alert('Error', e, 5000);
    })
}

linkCode.clicked = () => {
  loader.style.display = 'block';

  fetch('/api/v1/auth', {
    method: 'POST',
    body: JSON.stringify({
      code: linkCode.input.value
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(data => data.json())
    .then(data => {
      if(data.ok){
        loader.style.display = 'none';
        codeInput.style.display = 'none';
        localStorage.setItem('token', data.token);

        main()
      } else{
        new Alert('Error', errorCodes[data.err], 5000);
      }
    })
    .catch(e => {
      new Alert('Error', e, 5000);
    })
}

let main = async () => {
  let infoReq = await fetch('/api/v1', { headers: { token: localStorage.getItem('token')! }});
  let info = await infoReq.json();

  let slidesReq = await fetch('/api/v1/slides', { headers: { token: localStorage.getItem('token')! }});
  slides = (await slidesReq.json()).slides;

  console.log(slides);

  if(info.running){
    let currentSlide = slides[info.index];

    if(currentSlide.type == 1 && currentSlide.url)
      playerInfo.innerHTML = currentSlide.url;
  }

  if(info.running){
    startButton.style.display = 'none';
    stopButton.style.display = 'inline-block';
    player.style.display = 'inline-flex';
  } else{
    startButton.style.display = 'inline-block';
    stopButton.style.display = 'none';
    player.style.display = 'none';
  }

  mainContainer.style.display = 'block';

  setInterval(async () => {
    let infoReq = await fetch('/api/v1', { headers: { token: localStorage.getItem('token')! }});
    info = await infoReq.json();

    let currentSlide = slides[info.index];

    if(currentSlide.type == 1 && currentSlide.url)
      playerInfo.innerHTML = currentSlide.url;
  }, 1000);
}

startButton.onclick = async () => {
  loader.style.display = 'block';

  let req = await fetch('/api/v1/start', { headers: { token: localStorage.getItem('token')! }});
  let res = await req.json();

  loader.style.display = 'none';

  if(!res.ok){
    new Alert('Error', errorCodes[res.err], 5000);
    return;
  }

  let currentSlide = slides[res.index];

  if(currentSlide.type == 1 && currentSlide.url)
    playerInfo.innerHTML = currentSlide.url;

  startButton.style.display = 'none';
  stopButton.style.display = 'inline-block';
  player.style.display = 'inline-flex';
}

stopButton.onclick = async () => {
  loader.style.display = 'block';

  let req = await fetch('/api/v1/stop', { headers: { token: localStorage.getItem('token')! }});
  let res = await req.json();

  loader.style.display = 'none';

  if(!res.ok){
    new Alert('Error', errorCodes[res.err], 5000);
    return;
  }

  let currentSlide = slides[res.index];

  if(currentSlide.type == 1 && currentSlide.url)
    playerInfo.innerHTML = currentSlide.url;

  startButton.style.display = 'inline-block';
  stopButton.style.display = 'none';
  player.style.display = 'none';
}

nextButton.onclick = async () => {
  loader.style.display = 'block';

  let req = await fetch('/api/v1/slide/next', { headers: { token: localStorage.getItem('token')! }});
  let res = await req.json();

  loader.style.display = 'none';

  if(!res.ok){
    new Alert('Error', errorCodes[res.err], 5000);
    return;
  }
}

prevButton.onclick = async () => {
  loader.style.display = 'block';

  let req = await fetch('/api/v1/slide/prev', { headers: { token: localStorage.getItem('token')! }});
  let res = await req.json();

  loader.style.display = 'none';

  if(!res.ok){
    new Alert('Error', errorCodes[res.err], 5000);
    return;
  }
}