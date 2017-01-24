'use strict';
const request = require('request');
let randMsg = require('../messages');
let greetrandNum = Math.floor((Math.random() * Object.keys(randMsg.greeting.message).length) + 0);
let alfrandNum = Math.floor((Math.random() * Object.keys(randMsg.alfmsg.message).length) + 0);
console.log(randMsg.greeting.message[greetrandNum]);
const greeting = randMsg.greeting.message[greetrandNum];
const alfmsg = randMsg.alfmsg.message[alfrandNum];

class postbacks {

  getstarted(sender, f, API_URL, WEB_URL) {
    f.getProfile(sender)
      .then(profile => {
        const {first_name, last_name, gender, profile_pic, timezone} = profile;
        //console.log(gender);
        let sex = gender === undefined ? 'none' : gender;
            request({
              uri: API_URL+'/subscriber/store',
              qs: {
                fbid: sender,
                fname: first_name,
                lname: last_name,
                gender: sex,
                pic: profile_pic,
                timezone: timezone
              },
              method: 'POST'
            }, (error, response, body) => {
              //console.log(body);
              if(!error && response.statusCode === 200) {
                let data = JSON.parse(body);
                let text = '';
                if(data.exists === true)
                {
                      text = `${greeting} ${first_name}.`;
                } else {
                      text = `${greeting} ${first_name}.`;
                }
                text += ' '+alfmsg;
                let servicesbuttons = f.servicesbuttons(text);
                f.quick(sender, servicesbuttons);
              } else {
                f.txt(sender, ':( Sorry for inconvinient please come back later.')
              }
            });
      })
      .catch(error => console.log(error));
  }

  directory(sender, f, WEB_URL) {
    let elements = f.directorydata(WEB_URL);
    f.generic(sender, elements);
  }

  classifieds(sender, f, WEB_URL) {
    let elements = f.classifiedsdata(WEB_URL);
    f.generic(sender, elements);
  }

  menulistings(sender, f, API_URL, WEB_URL, DIR_IMAGE_URL) {
    request({
      uri: API_URL+'/mylisting',
      qs: {
        fbid: sender
      },
      method: 'POST'
    }, (error, response, body) => {
      //console.log(body);
      if(!error && response.statusCode === 200) {
        let data = JSON.parse(body).data;
        if(data.length > 0) {
          let elements = [];
          for(let i = 0, len = data.length; i < len; i++) {
            let text = data[i].company;
            let imgUrl = data[i].logo === '' ? 'placeholder-square.jpeg' : data[i].logo;
            let address = data[i].address+' '+data[i].city;
            elements.push({
                "title": text,
                "image_url": DIR_IMAGE_URL+'/'+imgUrl,
                "buttons":[
                  {
                    "type":"web_url",
                    "url": WEB_URL+'/edit/'+sender+'/'+data[i].id,
                    "title":"Edit",
                    "webview_height_ratio": "tall",
                    "messenger_extensions": true
                  }
                ]
              });
          }
          f.generic(sender, elements);
        } else {
          let data = {
            text: 'Your have no business yet.',
            buttons:[
              {
                "type":"web_url",
                "url":WEB_URL+"/add-business",
                "title":"Add A Business.",
                "webview_height_ratio": "full",
                "messenger_extensions": true
              }
            ]
          };
          f.btn(sender, data);
        }
      } else {
        console.log(response.statusCode);
        f.txt(sender, 'Sorry, something went wrong. please try again later.');
      }
    });
  }

  menuhelp(sender, f, WEB_URL) {
    //console.log(postback);
    //f.txt(sender, 'You can ask me to find products or services. (e.g. I am looking for clothing in Quezon City)');
    let data = {
      text: 'You can start by clicking one of the button below.',
      buttons:[
        {
          "type": "postback",
          "title": "Search",
          "payload": "MENU_SEARCH"
        },
        {
          "type":"web_url",
          "url":WEB_URL+"/add-business",
          "title":"Add A Business",
          "webview_height_ratio": "full",
          "messenger_extensions": true
        }
      ]
    };
    f.btn(sender, data);
  }

  //SMS

  menusms(sender, f) {
    f.txt(sender, 'Type phone number');
    f.txt(sender, 'For example: 09461234567');
  }

  weather(sender, f) {
    let text ="I'll tell you the current weather, please send your city or location.";
    // let message = {
    //   "text":text,
    //   "quick_replies":[
    //     {
    //       "content_type":"location",
    //     }
    //   ]
    // };

    f.txt(sender, text);
  }

}

module.exports = postbacks;
