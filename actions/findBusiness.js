'use strict';
const request = require('request');
let session = require('../session');
const config = require('../config');
const API_URL = config.API_URL;
const WEB_URL = config.WEB_URL;
const DIR_IMAGE_URL = config.DIR_IMAGE_URL;
const API_URL_CLASSIFIEDS = config.API_URL_CLASSIFIEDS;
const FBeamer = require('../fbeamer');
const f = new FBeamer(config.FB);
const {fetchEntity} = require('../utils');
const findBusiness = ({sessionId, context, entities}) => {
  return new Promise((resolve, reject) => {
    let business = fetchEntity(entities, 'business');
    let location = fetchEntity(entities, 'location');
    console.log(entities);
    let {fbid} = session.get(sessionId);
    if(entities.business[0].confidence > 0.5) {
      //Directory searching
      if(context.action == 'directory') {
          f.txt(fbid, 'Great! please wait...');
          if(business) {
            //let data = {};
            //f.generic(fbid, data);
            let qs = {what:business,where:location};

            request({
              uri: API_URL+"/search",
              qs: qs,
              method: "POST",
            }, (error, response, body) => {
              //console.log(body);
              if(!error && response.statusCode === 200) {
                let data = JSON.parse(body).data;
                //     console.log(data);
                if(data.length > 0) {
                  let listing = data.length > 1 ? 'listings':'listing';
                  if(location === '') {
                    f.txt(fbid, "I found "+data.length+" "+listing+" fitting your inquiry.  You can also ask me with a location like 'Looking for a gadgets in Quezon City'");
                  } else {
                    f.txt(fbid, "I found "+data.length+" "+listing+" fitting your inquiry.  Here you go...");
                  }
                  let elements = [];
                  for(let i = 0, len = data.length; i < len; i++) {

                  let text = data[i].company;
                  let imgUrl = data[i].logo === '' ? 'placeholder-square.jpeg' : data[i].logo;
                  let address = data[i].address+' '+data[i].city;
                  elements.push({
                      "title": text,
                      "image_url": DIR_IMAGE_URL+'/'+imgUrl,
                      "subtitle":address,
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": WEB_URL+'/show/'+data[i].id,
                          "title":"View Details",
                          "webview_height_ratio": "tall",
                          "messenger_extensions": true
                        }
                      ]
                    });
                  }
                  f.generic(fbid, elements);
                } else {
                  f.txt(fbid, "Sorry, I can't find what you're looking.");
                }
              }
              else {
                f.txt(fbid, "Sorry, something went wrong please try again later.");
              }
            });
          } else {
            f.txt(fbid, 'I will be able to help you if you tell me exactly what you\'re looking');
            f.txt(fbid, 'For example: "Can you find me a restaurant?"');
          }

          //Classifieds searching
        } else if(context.action === 'classifieds') {
          let qs = {what:business,where:location};
          request({
            uri: API_URL_CLASSIFIEDS+"/search",
            qs: qs,
            method: "POST",
          }, (error, response, body) => {
            console.log(body);
              if(!error && response.statusCode === 200) {
                let data = JSON.parse(body).data;
                console.log(data);
                if(data.length > 0) {
                  let listing = data.length > 1 ? 'listings':'listing';
                  if(location === '') {
                    f.txt(fbid, "I found "+data.length+" "+listing+" fitting your inquiry.  You can also ask me with a location like 'Looking for a gadgets in Quezon City'");
                  } else {
                    f.txt(fbid, "I found "+data.length+" "+listing+" fitting your inquiry.  Here you go...");
                  }
                  let elements = [];
                  for(let i = 0, len = data.length; i < len; i++) {

                  let text = data[i].name;
                  let imgUrl = 'placeholder-square.jpeg';
                  let address = data[i].city+' '+data[i].province;
                  elements.push({
                      "title": text,
                      "image_url": DIR_IMAGE_URL+'/'+imgUrl,
                      "subtitle":address,
                      "buttons":[
                        {
                          "type":"web_url",
                          "url": WEB_URL+'/show/'+data[i].id,
                          "title":"View Details",
                          "webview_height_ratio": "tall",
                          "messenger_extensions": true
                        }
                      ]
                    });
                  }
                  f.generic(fbid, elements);
                } else {
                  f.txt(fbid, "Sorry, I can't find what you're looking.");
                }
              } else {
                f.txt(fbid, "Sorry, something went wrong please try again later.");
              }
          });

        } else {
          context.action = 'choose service';
          context.business = business;
          context.location = location;
          f.txt(fbid, 'Where do you want me to find to our directory or classified ads?');
        }

    } else {
      f.txt(fbid, 'I will be able to help you if you tell me exactly what you\'re looking');
      f.txt(fbid, 'For example: "Can you find me a restaurant?"');
    }
    //console.log(context);

    return resolve(context);

  });
}

module.exports = findBusiness;
