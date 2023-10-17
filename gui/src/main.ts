// Holds the code for the landing page
import './style.css';

// Wait 500ms then load the page (keeps animations in line)
setTimeout(() => {
  main();
}, 500);

let timerTimeout: any;

// Add the electronAPI to the window object, to supress typescript errors
declare global {
  interface Window {
    electronAPI: any;
  }
}

let main = () => {
  // Hook link code event
  window.electronAPI.on('link-code', ( _event: any, code: string ) => {
    // Get the necessary elements
    let title = document.querySelector<HTMLElement>('.title')!;
    let linkcode = document.querySelector<HTMLElement>('.link-code')!;
    let linkcodeTimer = document.querySelector<HTMLElement>('.code-timer .timer-inner')!;

    // Update the link code
    linkcode.innerHTML = code;

    // Move the title up
    title.style.transform = 'translate(-50%, calc(-50% - 100px))';

    setTimeout(() => {
      // Load the link code and link code timer in
      linkcode.style.transition = '0.5s';
      linkcode.style.opacity = '1';

      linkcodeTimer.style.transition = '0.1s';
      linkcodeTimer.style.opacity = '1';
      linkcodeTimer.style.width = '300px';

      setTimeout(() => {
        // Make the link code timer start going down
        linkcodeTimer.style.transition = '30s linear';
        linkcodeTimer.style.width = '0%';

        // Reset timer timeout
        if(timerTimeout)
          window.clearTimeout(timerTimeout);

        // Wait 30 seconds
        timerTimeout = setTimeout(() => {
          // Close the link code and link code timer
          timerTimeout = null;

          linkcodeTimer.style.transition = '0.5s';
          linkcodeTimer.style.opacity = '0';

          linkcode.style.transition = '0.5s';
          linkcode.style.opacity = '0';

          // Wait 100ms then move the title back down
          setTimeout(() => {
            title.style.transform = 'translate(-50%, -50%)';
          }, 100);
        }, 30000);
      }, 100)
    }, 100)
  })

  // Hook linked event
  window.electronAPI.on('linked', ( _event: any ) => {
    // Get the necessary elements
    let title = document.querySelector<HTMLElement>('.title')!;
    let linkcode = document.querySelector<HTMLElement>('.link-code')!;
    let linkcodeTimer = document.querySelector<HTMLElement>('.code-timer .timer-inner')!;

    // Animate the title
    title.style.transform = 'translate(-50%, calc(-50% - 100px))';

    // Clean up the timeout
    if(timerTimeout)
      window.clearTimeout(timerTimeout);

    timerTimeout = null;

    // Hide the link code timer and the link code
    linkcodeTimer.style.transition = '0.5s';
    linkcodeTimer.style.opacity = '0';

    linkcode.style.transition = '0.5s';
    linkcode.style.opacity = '0';

    // Wait 100ms and move the title down
    setTimeout(() => {
      title.style.transform = 'translate(-50%, -50%)';
    }, 100);
  })

  // Hook unload event
  window.electronAPI.on('unload', ( _event: any ) => {
    // Unload the title
    let title = document.querySelector<HTMLElement>('.title')!;
    title.style.opacity = '0';
  });
}