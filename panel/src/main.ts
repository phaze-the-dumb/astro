import './style.css';
import './settings.ts';
import { Alert } from './notifications';
import { Input } from './input';
import { Slide } from './slide';
import { formatTime } from './util';

let getCodeButton = document.querySelector<HTMLElement>('#get-code')!;
let startButton = document.querySelector<HTMLElement>('#start-button')!;
let stopButton = document.querySelector<HTMLElement>('#stop-button')!;
let prevButton = document.querySelector<HTMLElement>('#prev-button')!;
let nextButton = document.querySelector<HTMLElement>('#next-button')!;
let editorTime = document.querySelector<HTMLElement>('#editor-time')!;
let editorTimeInput = document.querySelector<HTMLInputElement>('#editor-time-input')!;
let creatorTime = document.querySelector<HTMLElement>('#creator-time')!;
let creatorTimeInput = document.querySelector<HTMLInputElement>('#creator-time-input')!;
let playerInfo = document.querySelector<HTMLElement>('.player-info')!;
let codeInput = document.querySelector<HTMLElement>('.code-input')!;
let newSlideButton = document.querySelector<HTMLElement>('#new-slide')!;
let slideDeleteButton = document.querySelector<HTMLElement>('#slide-delete')!;
let exitEditorButton = document.querySelector<HTMLElement>('#editor-button')!;
let mainContainer = document.querySelector<HTMLElement>('.main')!;
let player = document.querySelector<HTMLElement>('.player')!;
let loader = document.querySelector<HTMLElement>('.loading-indicator')!;
let slideScroller = document.querySelector<HTMLElement>('.slide-scroller')!;
let creatorChooseTime = document.querySelector<HTMLElement>('.creator-choose-time')!;
let creatorChooseTimeBackBtn = document.querySelector<HTMLElement>('#creator-choose-time-back')!;
let creatorChooseUrl = document.querySelector<HTMLElement>('.creator-choose-url')!;
let creatorChooseUrlBackBtn = document.querySelector<HTMLElement>('#creator-choose-url-back')!;
let creatorChooseApp = document.querySelector<HTMLElement>('.creator-choose-app')!;
let creatorChooseAppBackBtn = document.querySelector<HTMLElement>('#creator-choose-app-back')!;
let creatorChooseType = document.querySelector<HTMLElement>('.creator-choose-type')!;
let creatorChooseTypeApp = document.querySelector<HTMLElement>('#creator-choose-type-app')!;
let creatorChooseTypeWeb = document.querySelector<HTMLElement>('#creator-choose-type-web')!;
let creatorChooseUrlError = document.querySelector<HTMLElement>('#creator-choose-url-error')!;
let creatorCancel = document.querySelectorAll<HTMLElement>('.creator-cancel')!;
let slideCreator = document.querySelector<HTMLElement>('.slide-creator')!;
let creatorCreate = document.querySelector<HTMLElement>('#creator-create')!;
let slidesContainer = document.querySelector<HTMLElement>('.slides')!;
let slideEditorContainer = document.querySelector<HTMLElement>('.slide-editor')!;
let appListContainer = document.querySelector<HTMLElement>('.app-list-container')!;
let linkCode = new Input('submit-code');
let slideUrl = new Input('slide-url');
let creatorSlideUrl = new Input('creator-slide-url');

let errorCodes: any = {
  'STARTED': 'App is currently running through slides. Please stop it first.',
  'CODE_INVALID': 'Incorrect Code.',
  'TOKEN_INVALID': 'Token has expired. Or is incorrect.',
  'SLIDES_EMPTY': 'There are no slides to display.',
  'ID_INVALID': 'ID Invaild.',
  'APPID_INVALID': 'App id is invalid.',
  'URL_INVALID': 'URL is invalid.',
  'BODY_INVALID': 'Body is invalid.',
}

let slides: Slide[] = [];
let slidesScrolled: HTMLElement[] = [];
let playerTime = Date.now();
let playerActive = false;
let currentSlide: Slide | null = null;
let currentSlideId: string | null = null;
let creatorType: number | null = null;
let creatorAppSlide: any = null;

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

  for(let s of slides){
    if(s.type == 1 && s.url){
      let slide = document.createElement('div');
      slide.className = 'slide';

      let text = document.createElement('div');
      text.className = 'text';

      if(s.url.length > 20)
        text.innerHTML = s.url.replace('https://', '').replace('http://', '').slice(0, 20) + '...'
      else
        text.innerHTML = s.url.replace('https://', '').replace('http://', '').slice(0, 20);

      let edit = document.createElement('div');
      edit.className = 'edit-button';
      edit.innerHTML = '<i class="fa-solid fa-pen"></i>';

      slide.appendChild(text);
      slide.appendChild(edit);

      slide.onclick = () => {
        slideEditor(s);
      }

      slidesScrolled.push(slide);
      slideScroller.insertBefore(slide, newSlideButton);
    }
  }

  if(info.running){
    currentSlide = slides[info.index];
    playerTime = info.lastChange + currentSlide.time;

    if(currentSlide.type == 1 && currentSlide.url){
      if(currentSlide.url.length > 20)
        playerInfo.innerHTML = currentSlide.url.replace('https://', '').replace('http://', '').slice(0, 20) + '...'
      else
        playerInfo.innerHTML = currentSlide.url.replace('https://', '').replace('http://', '')
    }
  }

  requestAnimationFrame(update);

  if(info.running){
    playerActive = true;
    startButton.style.display = 'none';
    stopButton.style.display = 'inline-block';
    player.style.display = 'inline-flex';
    slidesContainer.style.display = 'inline-block';
  } else{
    playerActive = false;
    startButton.style.display = 'inline-block';
    stopButton.style.display = 'none';
    player.style.display = 'none';
    slidesContainer.style.display = 'inline-block';
  }

  mainContainer.style.display = 'block';

  setInterval(async () => {
    let infoReq = await fetch('/api/v1', { headers: { token: localStorage.getItem('token')! }});
    info = await infoReq.json();

    if(info.err === 'TOKEN_INVALID')
      return window.location.reload();

    if(info.running){
      currentSlide = slides[info.index];
      playerTime = info.lastChange + currentSlide.time;

      if(currentSlide.type == 1 && currentSlide.url){
        if(currentSlide.url.length > 20)
          playerInfo.innerHTML = currentSlide.url.replace('https://', '').replace('http://', '').slice(0, 20) + '...'
        else
          playerInfo.innerHTML = currentSlide.url.replace('https://', '').replace('http://', '')
      }
    }
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

  let infoReq = await fetch('/api/v1', { headers: { token: localStorage.getItem('token')! }});
  let info = await infoReq.json();

  if(info.running){
    currentSlide = slides[info.index];
    playerTime = info.lastChange + currentSlide.time;
  }

  playerActive = true;
  startButton.style.display = 'none';
  stopButton.style.display = 'inline-block';
  player.style.display = 'inline-flex';
  slidesContainer.style.display = 'inline-block';
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

  currentSlide = null;

  playerActive = false;
  startButton.style.display = 'inline-block';
  stopButton.style.display = 'none';
  player.style.display = 'none';
  slidesContainer.style.display = 'inline-block';
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

  currentSlide = slides[res.index];

  if(currentSlide.type == 1 && currentSlide.url)
    playerInfo.innerHTML = currentSlide.url.replace('https://', '').replace('http://', '');

  
  let infoReq = await fetch('/api/v1', { headers: { token: localStorage.getItem('token')! }});
  let info = await infoReq.json();

  if(info.running){
    currentSlide = slides[info.index];
    playerTime = info.lastChange + currentSlide.time;
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

  currentSlide = slides[res.index];

  if(currentSlide.type == 1 && currentSlide.url)
    playerInfo.innerHTML = currentSlide.url.replace('https://', '').replace('http://', '');

  let infoReq = await fetch('/api/v1', { headers: { token: localStorage.getItem('token')! }});
  let info = await infoReq.json();

  if(info.running){
    currentSlide = slides[info.index];
    playerTime = info.lastChange + currentSlide.time;
  }
}

let update = () => {
  requestAnimationFrame(update);

  if(playerActive && currentSlide){
    let x = 100 - (((playerTime - Date.now()) / currentSlide.time) * 100);
    player.style.background = 'linear-gradient(to right, #006c86 ' + x + '%, #111 ' + x + '%)'
  }
}

newSlideButton.onclick = () => {
  slideScroller.style.opacity = '0';
  slidesContainer.style.width = '500px';
  slidesContainer.style.height = '200px';

  setTimeout(() => {
    slideScroller.style.display = 'none';

    slideCreator.style.display = 'block';
    creatorChooseType.style.display = 'block';

    setTimeout(() => {
      slideCreator.style.opacity = '1';
    }, 10)
  }, 500)
}

let slideEditor = ( slide: Slide ) => {
  slideScroller.style.opacity = '0';
  slidesContainer.style.width = '500px';

  currentSlideId = slide.id;
  console.log(slide);

  if(slide.type == 1 && slide.url)
    slideUrl.input.value = slide.url;

  slideUrl.clicked = async () => {
    let newUrl = slideUrl.input.value;
    let newTime = parseInt(editorTimeInput.value) * 1000;

    console.log(newUrl, newTime);

    let payload = { time: newTime, url: newUrl, type: 1 };

    let req = await fetch('/api/v1/slides/' + slide.id, { method: 'PUT', headers: { 'Content-Type': 'application/json', token: localStorage.getItem('token')! }, body: JSON.stringify(payload) });
    let res = await req.json();

    if(!res.ok)
      return new Alert('Error', errorCodes[res.err], 5000);

    slide.url = newUrl;
    slide.time = newTime;

    slideEditorContainer.style.opacity = '0';
    slidesContainer.style.width = '300px';

    currentSlideId = null;

    setTimeout(() => {
      slideEditorContainer.style.display = 'none';

      slideScroller.style.display = 'inline-block';

      setTimeout(() => {
        slideScroller.style.opacity = '1';
      }, 10)
    }, 500);
  }

  document.querySelector('.slide-editor .type')!.innerHTML = slide.type == 0 ? 'Type: Application' : 'Type: Website';

  editorTimeInput.value = (slide.time / 1000).toString();
  editorTime.innerHTML = formatTime(slide.time / 1000);

  editorTimeInput.oninput = () => {
    editorTime.innerHTML = formatTime(parseInt(editorTimeInput.value));
  }

  setTimeout(() => {
    slideScroller.style.display = 'none';

    slideEditorContainer.style.display = 'block';

    setTimeout(() => {
      slideEditorContainer.style.opacity = '1';
    }, 10)
  }, 500);
}

exitEditorButton.onclick = () => {
  slideEditorContainer.style.opacity = '0';
  slidesContainer.style.width = '300px';

  currentSlideId = null;

  setTimeout(() => {
    slideEditorContainer.style.display = 'none';

    slideScroller.style.display = 'inline-block';

    setTimeout(() => {
      slideScroller.style.opacity = '1';
    }, 10)
  }, 500);
}

slideDeleteButton.onclick = () => {
  fetch('/api/v1/slides/'+currentSlideId, {
    method: 'DELETE',
    headers: {
      token: localStorage.getItem('token')!
    }
  })
    .then(data => data.json())
    .then(data => {
      if(!data.ok)
        return new Alert('Error', errorCodes[data.err], 5000);

      let slide = slides.find(x => x.id === currentSlideId)!;
      let slideIndex = slides.indexOf(slide);

      slidesScrolled[slideIndex].remove();
      slidesScrolled = slidesScrolled.filter(x => x !== slidesScrolled[slideIndex]);

      slides = slides.filter(x => x.id !== currentSlideId);

      slideEditorContainer.style.opacity = '0';
      slidesContainer.style.width = '300px';
    
      currentSlideId = null;
    
      setTimeout(() => {
        slideEditorContainer.style.display = 'none';
    
        slideScroller.style.display = 'inline-block';
    
        setTimeout(() => {
          slideScroller.style.opacity = '1';
        }, 10)
      }, 500);
    })
    .catch(e => {
      new Alert('Error', e, 5000);
    })
}

creatorCancel.forEach(btn => {
  btn.onclick = () => {
    slideScroller.style.display = 'inline-block';
    slidesContainer.style.width = '300px';
    slidesContainer.style.height = '400px';

    slideCreator.style.opacity = '0';

    setTimeout(() => {
      slideCreator.style.display = 'none';
      creatorChooseType.style.display = 'none';
      creatorChooseApp.style.display = 'none';
      creatorChooseUrl.style.display = 'none';
      creatorChooseTime.style.display = 'none';

      setTimeout(() => {
        slideScroller.style.opacity = '1';
      }, 10)
    }, 500)
  }
})

creatorChooseTypeApp.onclick = async () => {
  creatorChooseType.style.display = 'none';
  creatorChooseApp.style.display = 'block';

  creatorType = 0;

  let req = await fetch('/api/v1/apps/slides', { headers: { 'Content-Type': 'application/json', token: localStorage.getItem('token')! } });
  let res = await req.json();

  for(let slide of res.slides){
    let div = document.createElement('div');
    div.innerHTML = slide.name;
    div.className = 'app-selector';

    div.onclick = () => {
      applicationPicked(slide.id);
    }

    appListContainer.appendChild(div);
  }
}

let applicationPicked = async ( id: string ) => {
  let optionsReq = await fetch('/api/v1/apps/slides/' + id, { headers: { token: localStorage.getItem('token')! } });
  let options = await optionsReq.json();

  creatorAppSlide = options;
  displayAppOpt(0);
}

let displayAppOpt = ( index: number ) => {
  if(!creatorAppSlide)
    return new Alert('Invaild', 'Cannot display options of an app that doesn\'t exist.', 5000);

  let options = Object.keys(creatorAppSlide.options);
  let opt = options[index];

  if(!opt)
    return new Alert('Invaild', 'Cannot display an option of an app that doesn\'t exist.', 5000);

  let info = creatorAppSlide.options[opt];

  let title = opt;
  title = title[0].toUpperCase() + title.substring(1);

  console.log(title, info);
  switch(info.type){
    case 'String':
      break;
    default:
      new Alert('Invaild Type', info.type + ' is an invaild type', 5000);
      break;
  }
}

creatorChooseAppBackBtn.onclick = () => {
  creatorChooseType.style.display = 'block';
  creatorChooseApp.style.display = 'none';
}

creatorChooseTypeWeb.onclick = () => {
  creatorChooseType.style.display = 'none';
  creatorChooseUrl.style.display = 'block';

  creatorType = 1;
}

creatorChooseUrlBackBtn.onclick = () => {
  creatorChooseType.style.display = 'block';
  creatorChooseUrl.style.display = 'none';
}

creatorSlideUrl.clicked = () => {
  if(!creatorSlideUrl.input.value.startsWith('http://') && !creatorSlideUrl.input.value.startsWith('https://'))
    return creatorChooseUrlError.innerHTML = 'Please enter a vaild URL';

  creatorChooseUrl.style.display = 'none';
  creatorChooseTime.style.display = 'block';

  creatorTimeInput.value = (30).toString();
  creatorTime.innerHTML = formatTime(30);

  creatorTimeInput.oninput = () => {
    creatorTime.innerHTML = formatTime(parseInt(creatorTimeInput.value));
  }
}

creatorChooseTimeBackBtn.onclick = () => {
  creatorChooseTime.style.display = 'none';
  creatorChooseUrl.style.display = 'block';
}

creatorCreate.onclick = async () => {
  let url = creatorSlideUrl.input.value;
  let time = parseInt(creatorTimeInput.value) * 1000;
  let type = creatorType;

  if(!type)
    return new Alert('Error', 'Cannot create a slide without a type, Please press cancel and try again', 5000);

  let payload = { type, url, time };

  let req = await fetch('/api/v1/slides', { method: 'PUT', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json', token: localStorage.getItem('token')! } });
  let res = await req.json();

  if(!res.ok)
    return new Alert('Error', errorCodes[res.err], 5000);

  let s = new Slide();
  slides.push(s);

  creatorSlideUrl.input.value = '';

  s.time = time;
  s.type = type;
  s.url = url;
  s.id = res.slide.id;

  if(s.type == 1 && s.url){
    let slide = document.createElement('div');
    slide.className = 'slide';

    let text = document.createElement('div');
    text.className = 'text';
    text.innerHTML = s.url;

    let edit = document.createElement('div');
    edit.className = 'edit-button';
    edit.innerHTML = '<i class="fa-solid fa-pen"></i>';

    slide.appendChild(text);
    slide.appendChild(edit);

    slide.onclick = () => {
      slideEditor(s);
    }

    slidesScrolled.push(slide);
    slideScroller.insertBefore(slide, newSlideButton);
  }

  slideScroller.style.display = 'inline-block';
  slidesContainer.style.width = '300px';
  slidesContainer.style.height = '400px';

  slideCreator.style.opacity = '0';

  setTimeout(() => {
    slideCreator.style.display = 'none';
    creatorChooseType.style.display = 'none';
    creatorChooseApp.style.display = 'none';
    creatorChooseUrl.style.display = 'none';
    creatorChooseTime.style.display = 'none';

    setTimeout(() => {
      slideScroller.style.opacity = '1';
    }, 10)
  }, 500)
}
