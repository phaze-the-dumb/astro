let alerts: Alert[] = [];

class Alert{
  title: string;
  body: string;
  top: number;
  timeout: NodeJS.Timeout;
  div: HTMLElement;

  constructor( title: string, body: string, time: number ){
    alerts.forEach(a => a.moveDown());
    alerts.push(this);

    this.title = title;
    this.body = body;
    this.top = 50;

    this.div = document.createElement('div');
    this.div.className = 'alert';

    let tt = document.createElement('div');
    tt.className = 'alert-title';

    let bd = document.createElement('div');
    bd.className = 'alert-body';

    tt.innerHTML = title;
    bd.innerHTML = body;

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

export { Alert };