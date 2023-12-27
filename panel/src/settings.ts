import { Alert } from "./notifications";
import { Input } from "./input";

let settingsButton = document.querySelector<HTMLElement>('#settings-button')!;
let settingsCloseBtn = document.querySelector<HTMLElement>('#settings-close')!;
let settingsShowAddr = document.querySelector<HTMLInputElement>('#setting-showaddr')!;
let settingsAutoStart = document.querySelector<HTMLInputElement>('#setting-autostart')!;
let settingsBackdrop = document.querySelector<HTMLInputElement>('.settings-backdrop')!;
let settingsContainer = document.querySelector<HTMLElement>('.settings')!;

let passcodeInput = new Input('setting-passcode');

settingsButton.onclick = async () => {
  let req = await fetch('/api/v1/settings', { headers: { token: localStorage.getItem('token')! } });
  let res = await req.json();

  if(!res.ok)
    return new Alert('Error', 'Cannot fetch settings', 5000);

  settingsShowAddr.checked = res.showAddr;
  settingsAutoStart.checked = res.autoStart;

  settingsShowAddr.onchange = async () => {
    let payload = { value: settingsShowAddr.checked };

    let req = await fetch('/api/v1/settings/showAddr', { method: 'PUT', headers: { 'Content-Type': 'application/json', token: localStorage.getItem('token')! }, body: JSON.stringify(payload) });
    let res = await req.json();

    if(!res.ok)
      return new Alert('Error', 'Failed to update setting', 5000);
  };

  settingsAutoStart.onchange = async () => {
    let payload = { value: settingsAutoStart.checked };

    let req = await fetch('/api/v1/settings/autoStart', { method: 'PUT', headers: { 'Content-Type': 'application/json', token: localStorage.getItem('token')! }, body: JSON.stringify(payload) });
    let res = await req.json();

    if(!res.ok)
      return new Alert('Error', 'Failed to update setting', 5000);
  };

  settingsContainer.style.display = 'block';
  settingsBackdrop.style.display = 'block';

  setTimeout(() => {
    settingsContainer.style.opacity = '1';
    settingsBackdrop.style.opacity = '1';
  }, 10)
}

settingsCloseBtn.onclick = () => {
  settingsShowAddr.onchange = () => {};
  settingsAutoStart.onchange = () => {};

  settingsBackdrop.style.opacity = '0';
  settingsContainer.style.opacity = '0';

  setTimeout(() => {
    settingsBackdrop.style.display = 'none';
    settingsContainer.style.display = 'none';
  }, 500);
}

settingsBackdrop.onclick = () => {
  settingsShowAddr.onchange = () => {};
  settingsAutoStart.onchange = () => {};

  settingsBackdrop.style.opacity = '0';
  settingsContainer.style.opacity = '0';

  setTimeout(() => {
    settingsBackdrop.style.display = 'none';
    settingsContainer.style.display = 'none';
  }, 500);
}

passcodeInput.clicked = async () => {
  let pass = passcodeInput.input.value;

  let payload = { value: pass };

  let req = await fetch('/api/v1/settings/passcode', { method: 'PUT',  headers: { 'Content-Type': 'application/json', token: localStorage.getItem('token')! }, body: JSON.stringify(payload) });
  let res = await req.json();

  if(res.ok){
    passcodeInput.input.value = '';
    new Alert('Success', 'Password successfully set', 2500);
  } else  
    new Alert('Error', res.error, 5000);
}