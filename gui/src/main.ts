import './style.css';
import { Alert } from './notifications';
import { Slide } from './slide';

setTimeout(() => {
  main();
}, 500);

let timerTimeout: any;

declare global {
  interface Window {
    electronAPI: any;
  }
}

let main = () => {
  window.electronAPI.on('link-code', ( _event: any, code: string ) => {
    let title = document.querySelector<HTMLElement>('.title')!;
    let linkcode = document.querySelector<HTMLElement>('.link-code')!;
    let linkcodeTimer = document.querySelector<HTMLElement>('.code-timer .timer-inner')!;

    linkcode.innerHTML = code;

    title.style.transform = 'translate(-50%, calc(-50% - 100px))';

    setTimeout(() => {
      linkcode.style.transition = '0.5s';
      linkcode.style.opacity = '1';

      linkcodeTimer.style.transition = '0.1s';
      linkcodeTimer.style.opacity = '1';
      linkcodeTimer.style.width = '300px';

      setTimeout(() => {
        linkcodeTimer.style.transition = '30s linear';
        linkcodeTimer.style.width = '0%';

        if(timerTimeout)
          window.clearTimeout(timerTimeout);

        timerTimeout = setTimeout(() => {
          timerTimeout = null;

          linkcodeTimer.style.transition = '0.5s';
          linkcodeTimer.style.opacity = '0';

          linkcode.style.transition = '0.5s';
          linkcode.style.opacity = '0';

          setTimeout(() => {
            title.style.transform = 'translate(-50%, -50%)';
          }, 100);
        }, 30000);
      }, 100)
    }, 100)
  })

  window.electronAPI.on('linked', ( _event: any ) => {
    let title = document.querySelector<HTMLElement>('.title')!;
    let linkcode = document.querySelector<HTMLElement>('.link-code')!;
    let linkcodeTimer = document.querySelector<HTMLElement>('.code-timer .timer-inner')!;

    title.style.transform = 'translate(-50%, calc(-50% - 100px))';

    if(timerTimeout)
      window.clearTimeout(timerTimeout);

    timerTimeout = null;

    linkcodeTimer.style.transition = '0.5s';
    linkcodeTimer.style.opacity = '0';

    linkcode.style.transition = '0.5s';
    linkcode.style.opacity = '0';

    setTimeout(() => {
      title.style.transform = 'translate(-50%, -50%)';
    }, 100);
  })

  window.electronAPI.on('ip-addr', ( _event: any, url: string ) => {
    document.querySelector<HTMLElement>('.web-url')!.innerHTML = url;
  });

  window.electronAPI.on('unload', ( _event: any ) => {
    let title = document.querySelector<HTMLElement>('.title')!;
    title.style.opacity = '0';
  });

  window.electronAPI.on('slides-update', ( _event: any, type: number, slide: Slide ) => {
    let title = '';
    let body = '';

    title = type == 0 ? 'Slide Added' : 'Slide Removed';
    body = slide.type == 1 ? slide.url! : slide.appId!;

    new Alert(title, body, 5000);
  });
}