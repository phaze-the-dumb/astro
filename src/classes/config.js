const fs = require('fs');
const argon2 = require('argon2');
const { Slide } = require('./slide');

class Config {
  constructor( path ){
    // Init an empty array of slides and put the config path in the class
    this.slides = [];
    this.path = path;

    // Read the config file and parse it as json
    let file = fs.readFileSync(path, 'utf8');
    let json = JSON.parse(file);

    // Load all the slides as slide classes (./slides.js)
    for(let slide of json.slides){
      this.slides.push(new Slide(slide));
    }

    // Load other values from json
    this.autoStart = json.autoStart;
    this.showAddr = json.showAddr;
    this.passcode = json.passcode;
  }

  save(){
    // Recreate the json struct in the file
    let json = {
      slides: this.slides.map(s => {
        if(s.type == 0)
          return { time: s.time, type: s.type, appId: s.appId, appOpts: s.appOpts, slideName: s.slideName };
        else if(s.type == 1)
          return { time: s.time, type: s.type, url: s.url };
      }),
      autoStart: this.autoStart,
      showAddr: this.showAddr,
      passcode: this.passcode
    }

    // Write it to the file
    fs.writeFileSync(this.path, JSON.stringify(json));
  }

  addSlide( slide ){
    // Add a new slide to the slides array and save it to the file
    this.slides.push(slide);
    this.save();
  }

  removeSlide( id ){
    // Filter a slide out of the array by its id and save it to the file
    this.slides = this.slides.filter(x => x.id !== id);
    this.save();
  }

  updateSlide( id, slide ){
    // Update slide values and save it to the file
    let s = this.slides.find(x => x.id === id);

    s.time = slide.time;
    s.slideName = slide.slideName;
    s.type = slide.type;
    s.url = slide.url;

    this.save();
  }

  setOptions( id, options ){
    // Update slide options and save it to the file
    let s = this.slides.find(x => x.id === id);
    s.appOpts = options;

    this.save();
  }

  async setPasscode( plaintext ){
    let hash = await argon2.hash(plaintext);
    this.passcode = hash;
  }

  async checkCode( plaintext ){
    let auth = await argon2.verify(this.passcode, plaintext);
    return auth;
  }
}

Config.DefaultConfig = {
  slides: [],
  autoStart: true,
  showAddr: true,
  passcode: null
}

module.exports = { Config };