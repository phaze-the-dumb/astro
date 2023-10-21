// This holds the code for the web panel
import './style.css';
import './settings.ts';
import { Alert } from './notifications';
import { Input } from './input';
import { Slide } from './slide';
import { formatTime } from './util';

// Get all required elements
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

let slideCreator = document.querySelector<HTMLElement>('.slide-creator')!;
let creatorCreate = document.querySelector<HTMLElement>('#creator-create')!;
let slidesContainer = document.querySelector<HTMLElement>('.slides')!;
let slideEditorContainer = document.querySelector<HTMLElement>('.slide-editor')!;
let appListContainer = document.querySelector<HTMLElement>('.app-list-container')!;

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
let creatorOptionStringMenu = document.querySelector<HTMLElement>('.creator-option-string')!;
let creatorOptionStringBackBtn = document.querySelector<HTMLElement>('#creator-option-string-back')!;
let creatorOptionStringTitle = document.querySelector<HTMLElement>('#creator-option-string-title')!;
let creatorOptionString = new Input('creator-option-string');
let creatorSlideUrl = new Input('creator-slide-url');
let creatorCancel = document.querySelectorAll<HTMLElement>('.creator-cancel')!;

let linkCode = new Input('submit-code');
let slideUrl = new Input('slide-url');

// Define all error codes
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

// Init empty values
let slides: Slide[] = [];
let slidesScrolled: HTMLElement[] = [];
let playerTime = Date.now();
let playerActive = false;
let currentSlide: Slide | null = null;
let currentSlideId: string | null = null;
let creatorType: number | null = null;
let creatorAppSlide: any = null;

// Hook window load event
window.onload = () => {
  // Check if has a valid token
  if(!localStorage.getItem('token'))return;

  // Check if token is valid
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
  // When get code button is pressed, fetch the backend and show the code
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
  // When the link code is inputted, check it is valid
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
        // Hide the auth stuff, and load the main panel
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
  // Grab backend status
  let infoReq = await fetch('/api/v1', { headers: { token: localStorage.getItem('token')! }});
  let info = await infoReq.json();

  // Get slides from the backend
  let slidesReq = await fetch('/api/v1/slides', { headers: { token: localStorage.getItem('token')! }});
  slides = (await slidesReq.json()).slides;

  console.log(slides);

  for(let s of slides){
    // Render each slide
    if(s.type == 1 && s.url){
      let slide = document.createElement('div');
      slide.className = 'slide';

      let text = document.createElement('div');
      text.className = 'text';

      // Make sure text length never exceeds 23 characters
      if(s.url.length > 20)
        text.innerHTML = s.url.replace('https://', '').replace('http://', '').slice(0, 20) + '...'
      else
        text.innerHTML = s.url.replace('https://', '').replace('http://', '').slice(0, 20);

      let edit = document.createElement('div');
      edit.className = 'edit-button';
      edit.innerHTML = '<i class="fa-solid fa-pen"></i>';

      slide.appendChild(text);
      slide.appendChild(edit);

      // When slide is clicked, open the slide settings menu
      slide.onclick = () => {
        slideEditor(s);
      }

      // Add slide to the list
      slidesScrolled.push(slide);
      slideScroller.insertBefore(slide, newSlideButton);
    }
  }

  // If slideshow is running, show the player
  if(info.running){
    currentSlide = slides[info.index];
    playerTime = info.lastChange + currentSlide.time;

    // Update player url
    if(currentSlide.type == 1 && currentSlide.url){
      if(currentSlide.url.length > 20)
        playerInfo.innerHTML = currentSlide.url.replace('https://', '').replace('http://', '').slice(0, 20) + '...'
      else
        playerInfo.innerHTML = currentSlide.url.replace('https://', '').replace('http://', '')
    }

    playerActive = true;
    startButton.style.display = 'none';
    stopButton.style.display = 'inline-block';
    player.style.display = 'inline-flex';
    slidesContainer.style.display = 'inline-block';
  } else{
    // If not hide the player
    playerActive = false;
    startButton.style.display = 'inline-block';
    stopButton.style.display = 'none';
    player.style.display = 'none';
    slidesContainer.style.display = 'inline-block';
  }

  requestAnimationFrame(update);

  // Show the main container
  mainContainer.style.display = 'block';

  // Every second ping the backend and check the status
  setInterval(async () => {
    let infoReq = await fetch('/api/v1', { headers: { token: localStorage.getItem('token')! }});
    info = await infoReq.json();

    // If the token is not valid, then reload the page
    if(info.err === 'TOKEN_INVALID')
      return window.location.reload();

    // Update slide url if the slideshow is running
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
  // When the start button is clicked
  loader.style.display = 'block';

  // Tell the backend to start playing slides
  let req = await fetch('/api/v1/start', { headers: { token: localStorage.getItem('token')! }});
  let res = await req.json();

  loader.style.display = 'none';

  if(!res.ok){
    new Alert('Error', errorCodes[res.err], 5000);
    return;
  }

  // Check the current slide status
  let infoReq = await fetch('/api/v1', { headers: { token: localStorage.getItem('token')! }});
  let info = await infoReq.json();

  // Update the player
  if(info.running){
    currentSlide = slides[info.index];
    playerTime = info.lastChange + currentSlide.time;
  }

  // Show the player
  playerActive = true;
  startButton.style.display = 'none';
  stopButton.style.display = 'inline-block';
  player.style.display = 'inline-flex';
  slidesContainer.style.display = 'inline-block';
}

stopButton.onclick = async () => {
  // When the stop button is clicked
  loader.style.display = 'block';

  // Tell the backend to stop the slideshow
  let req = await fetch('/api/v1/stop', { headers: { token: localStorage.getItem('token')! }});
  let res = await req.json();

  loader.style.display = 'none';

  if(!res.ok){
    new Alert('Error', errorCodes[res.err], 5000);
    return;
  }

  currentSlide = null;

  // Hide the player
  playerActive = false;
  startButton.style.display = 'inline-block';
  stopButton.style.display = 'none';
  player.style.display = 'none';
  slidesContainer.style.display = 'inline-block';
}

nextButton.onclick = async () => {
  // When the next button is clicked
  loader.style.display = 'block';

  // Tell the backend to go to the next slide
  let req = await fetch('/api/v1/slide/next', { headers: { token: localStorage.getItem('token')! }});
  let res = await req.json();

  loader.style.display = 'none';

  if(!res.ok){
    new Alert('Error', errorCodes[res.err], 5000);
    return;
  }

  // Update current slide
  currentSlide = slides[res.index];

  // Update player info
  if(currentSlide.type == 1 && currentSlide.url){
    if(currentSlide.url.length > 20)
      playerInfo.innerHTML = currentSlide.url.replace('https://', '').replace('http://', '').slice(0, 20) + '...'
    else
      playerInfo.innerHTML = currentSlide.url.replace('https://', '').replace('http://', '')
  }

  let infoReq = await fetch('/api/v1', { headers: { token: localStorage.getItem('token')! }});
  let info = await infoReq.json();

  if(info.running){
    currentSlide = slides[info.index];
    playerTime = info.lastChange + currentSlide.time;
  }
}

prevButton.onclick = async () => {
  // When the previous slide button is clicked
  loader.style.display = 'block';

  // Tell the backend to load the previous slide
  let req = await fetch('/api/v1/slide/prev', { headers: { token: localStorage.getItem('token')! }});
  let res = await req.json();

  loader.style.display = 'none';

  if(!res.ok){
    new Alert('Error', errorCodes[res.err], 5000);
    return;
  }

  // Update the current slide
  currentSlide = slides[res.index];

  // Update the player
  if(currentSlide.type == 1 && currentSlide.url){
    if(currentSlide.url.length > 20)
      playerInfo.innerHTML = currentSlide.url.replace('https://', '').replace('http://', '').slice(0, 20) + '...'
    else
      playerInfo.innerHTML = currentSlide.url.replace('https://', '').replace('http://', '')
  }

  let infoReq = await fetch('/api/v1', { headers: { token: localStorage.getItem('token')! }});
  let info = await infoReq.json();

  if(info.running){
    currentSlide = slides[info.index];
    playerTime = info.lastChange + currentSlide.time;
  }
}

let update = () => {
  // Called every frame
  requestAnimationFrame(update);

  // Update the player info timer
  if(playerActive && currentSlide){
    let x = 100 - (((playerTime - Date.now()) / currentSlide.time) * 100);
    player.style.background = 'linear-gradient(to right, #006c86 ' + x + '%, #111 ' + x + '%)'
  }
}

newSlideButton.onclick = () => {
  // When the new slide button is clicked

  // Animate the slide creator opening
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
  // When a slide is opened for editing

  // Hide the slide list and make the menu wider
  slideScroller.style.opacity = '0';
  slidesContainer.style.width = '500px';

  currentSlideId = slide.id;
  console.log(slide);

  if(slide.type == 1 && slide.url)
    slideUrl.input.value = slide.url;

  slideUrl.clicked = async () => {
    // When the slide is updated

    let newUrl = slideUrl.input.value;
    let newTime = parseInt(editorTimeInput.value) * 1000;

    console.log(newUrl, newTime);

    // Send the data to the backend and update the slide
    let payload = { time: newTime, url: newUrl, type: 1 };

    let req = await fetch('/api/v1/slides/' + slide.id, { method: 'PUT', headers: { 'Content-Type': 'application/json', token: localStorage.getItem('token')! }, body: JSON.stringify(payload) });
    let res = await req.json();

    if(!res.ok)
      return new Alert('Error', errorCodes[res.err], 5000);

    // Update the local slide values
    slide.url = newUrl;
    slide.time = newTime;

    slideEditorContainer.style.opacity = '0';
    slidesContainer.style.width = '300px';

    currentSlideId = null;

    // Animate back to the slide list
    setTimeout(() => {
      slideEditorContainer.style.display = 'none';

      slideScroller.style.display = 'inline-block';

      setTimeout(() => {
        slideScroller.style.opacity = '1';
      }, 10)
    }, 500);
  }

  // Set editor heading
  document.querySelector('.slide-editor .type')!.innerHTML = slide.type == 0 ? 'Type: Application' : 'Type: Website';

  // Create slider
  editorTimeInput.value = (slide.time / 1000).toString();
  editorTime.innerHTML = formatTime(slide.time / 1000);

  // When sliders is changed update the relevant text
  editorTimeInput.oninput = () => {
    editorTime.innerHTML = formatTime(parseInt(editorTimeInput.value));
  }

  // Animate the container box
  setTimeout(() => {
    slideScroller.style.display = 'none';

    slideEditorContainer.style.display = 'block';

    setTimeout(() => {
      slideEditorContainer.style.opacity = '1';
    }, 10)
  }, 500);
}

exitEditorButton.onclick = () => {
  // When cancel button in the editor is clicked
  slideEditorContainer.style.opacity = '0';
  slidesContainer.style.width = '300px';

  // Resey the current slide id
  currentSlideId = null;

  // Animate back to the slides list
  setTimeout(() => {
    slideEditorContainer.style.display = 'none';

    slideScroller.style.display = 'inline-block';

    setTimeout(() => {
      slideScroller.style.opacity = '1';
    }, 10)
  }, 500);
}

slideDeleteButton.onclick = () => {
  // When the delete button is clicked

  // Tell the backend to delete the slide
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

      // Find the slide index
      let slide = slides.find(x => x.id === currentSlideId)!;
      let slideIndex = slides.indexOf(slide);

      // Remove the slide from the slide list
      slidesScrolled[slideIndex].remove();
      slidesScrolled = slidesScrolled.filter(x => x !== slidesScrolled[slideIndex]);

      // Remove it from the slide list
      slides = slides.filter(x => x.id !== currentSlideId);

      // Animate the editor closing
      slideEditorContainer.style.opacity = '0';
      slidesContainer.style.width = '300px';
    
      currentSlideId = null;

      // Animate the slide list back in
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
  // For every cancel button in the slide creator
  btn.onclick = () => {
    // When it is clicked
    slideScroller.style.display = 'inline-block';
    slidesContainer.style.width = '300px';
    slidesContainer.style.height = '400px';

    // Animate the editor out
    slideCreator.style.opacity = '0';

    setTimeout(() => {
      slideCreator.style.display = 'none';
      creatorChooseType.style.display = 'none';
      creatorChooseApp.style.display = 'none';
      creatorChooseUrl.style.display = 'none';
      creatorChooseTime.style.display = 'none';
      creatorOptionStringMenu.style.display = 'none';

      setTimeout(() => {
        slideScroller.style.opacity = '1';
      }, 10)
    }, 500)
  }
})

creatorChooseTypeApp.onclick = async () => {
  // When the app type button is pressed
  creatorChooseType.style.display = 'none';
  creatorChooseApp.style.display = 'block';

  creatorType = 0;

  // Fetch the application list
  let req = await fetch('/api/v1/apps/slides', { headers: { 'Content-Type': 'application/json', token: localStorage.getItem('token')! } });
  let res = await req.json();

  appListContainer.innerHTML = '';

  // Find all the app slides and render them
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
  // When an application is picked
  let optionsReq = await fetch('/api/v1/apps/slides/' + id, { headers: { token: localStorage.getItem('token')! } });
  let options = await optionsReq.json();

  // Display the first app option
  creatorAppSlide = options;
  creatorChooseApp.style.display = 'none';

  if(Object.keys(options)[0])
    displayAppOpt(0);
  else {
    creatorChooseTime.style.display = 'block';

    creatorTimeInput.value = (30).toString();
    creatorTime.innerHTML = formatTime(30);

    creatorTimeInput.oninput = () => {
      creatorTime.innerHTML = formatTime(parseInt(creatorTimeInput.value));
    }
  }
}

let displayAppOpt = ( index: number ) => {
  // Check the slide exists
  if(!creatorAppSlide)
    return new Alert('Invaild', 'Cannot display options of an app that doesn\'t exist.', 5000);

  // Find the option
  let options = Object.keys(creatorAppSlide.options);
  let opt = options[index];

  // Check the option exists
  if(!opt)
    return new Alert('Invaild', 'Cannot display an option of an app that doesn\'t exist.', 5000);

  // Get the option info
  let info = creatorAppSlide.options[opt];

  // Get the option name
  let title = opt;
  title = title[0].toUpperCase() + title.substring(1); // Capitalize the title

  //Check the type
  console.log(title, info);
  switch(info.type){
    case 'String':
      creatorOptionStringMenu.style.display = 'block';
      creatorOptionStringTitle.innerHTML = title;

      creatorOptionString.clicked = () => {
        creatorOptionStringMenu.style.display = 'none';

        if(options[index + 1])
          displayAppOpt(index + 1);
        else {
          creatorChooseTime.style.display = 'block';

          creatorTimeInput.value = (30).toString();
          creatorTime.innerHTML = formatTime(30);

          creatorTimeInput.oninput = () => {
            creatorTime.innerHTML = formatTime(parseInt(creatorTimeInput.value));
          }
        }
      }

      break;
    default:
      new Alert('Invaild Type', info.type + ' is an invaild type', 5000);
      break;
  }
}

creatorOptionStringBackBtn.onclick = () => {
  creatorChooseApp.style.display = 'block';
  creatorOptionStringMenu.style.display = 'none';

  creatorAppSlide = null;
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
  let appId = creatorAppSlide.id;

  if(type == undefined)
    return new Alert('Error', 'Cannot create a slide without a type, Please press cancel and try again', 5000);

  let payload = { type, url, time, appId };

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
  s.appId = appId;
  s.id = res.slide.id;

  if(s.type == 1 && s.url){
    let slide = document.createElement('div');
    slide.className = 'slide';

    let text = document.createElement('div');
    text.className = 'text';

    if(s.url.length > 20)
      text.innerHTML = s.url.replace('https://', '').replace('http://', '').slice(0, 20) + '...';
    else
      text.innerHTML = s.url.replace('https://', '').replace('http://', '');

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
  } else if(s.type == 0){
    let slide = document.createElement('div');
    slide.className = 'slide';

    let text = document.createElement('div');
    text.className = 'text';

    let edit = document.createElement('div');
    edit.className = 'edit-button';
    edit.innerHTML = '<i class="fa-solid fa-pen"></i>';

    slide.appendChild(text);
    slide.appendChild(edit);

    slide.onclick = () => {
      slideEditor(s);
    }
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
