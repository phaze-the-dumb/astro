const fs = require('fs');
const { Slide } = require('./slide');

class Config {
  constructor( path ){
    this.slides = [];
    this.path = path;

    let file = fs.readFileSync(path, 'utf8');
    let json = JSON.parse(file);

    for(let slide of json.slides){
      this.slides.push(new Slide(slide));
    }

    this.autoStart = json.autoStart;
    this.showAddr = json.showAddr;
  }

  save(){
    let json = {
      slides: this.slides.map(s => {
        if(s.type == 0)
          return { time: s.time, type: s.type, appId: s.appId };
        else if(s.type == 1)
          return { time: s.time, type: s.type, url: s.url };
      }),
      autoStart: this.autoStart,
      showAddr: this.showAddr
    }

    fs.writeFileSync(this.path, JSON.stringify(json));
  }

  addSlide( slide ){
    this.slides.push(slide);
    this.save();
  }

  removeSlide( id ){
    this.slides = this.slides.filter(x => x.id !== id);
    this.save();
  }

  updateSlide( id, slide ){
    let s = this.slides.find(x => x.id === id);

    s.time = slide.time;
    s.appId = slide.appId;
    s.type = slide.type;
    s.url = slide.url;
  }
}

Config.DefaultConfig = {
  slides: [],
  autoStart: true,
  showAddr: true
}

module.exports = { Config };