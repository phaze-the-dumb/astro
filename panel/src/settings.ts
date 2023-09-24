import { Alert } from "./notifications";

let settingsButton = document.querySelector<HTMLElement>('#settings-button')!;
let settingsCloseBtn = document.querySelector<HTMLElement>('#settings-close')!;
let settingsShowAddr = document.querySelector<HTMLInputElement>('#setting-showaddr')!;
let settingsAutoStart = document.querySelector<HTMLInputElement>('#setting-autostart')!;
let settingsContainer = document.querySelector<HTMLElement>('.settings')!;

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
}

settingsCloseBtn.onclick = () => {
  settingsContainer.style.display = 'none';

  settingsShowAddr.onchange = () => {};
  settingsAutoStart.onchange = () => {};
}