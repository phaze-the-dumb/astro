const crypto = require('crypto');

class Slide{
  constructor( json ){
    // Converting from a JSON object to this class

    this.type = json.type; // 0 - App, 1 - Url
    this.time = json.time;
    this.id = crypto.randomUUID()

    switch(this.type){
      case 1:
        this.url = json.url;
        break;
      case 0:
        this.appId = json.appId;
        break;
    }
  }
}

module.exports = { Slide };