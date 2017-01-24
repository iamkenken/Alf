'use strict';
const request = require('request');
let session = require('../session');
const config = require('../config');
const API_URL = config.API_URL;
const weather = require('openweather-apis');
const OWM_KEY = config.OWM_KEY;
const FBeamer = require('../fbeamer');
const f = new FBeamer(config.FB);
const postbacks = require('../postbacks');
const p = new postbacks();
const {fetchEntity} = require('../utils');
const getWeather = ({sessionId, context, entities}) => {
  return new Promise((resolve, reject) => {
    let location = fetchEntity(entities, 'location');
    console.log(entities);
    let {fbid} = session.get(sessionId);
    if(entities.intent && entities.intent[0].value == 'weather') {
      if(location) {
        weather.setLang('en');
        weather.setCity(location);
        weather.setUnits('metric');
        weather.setAPPID(OWM_KEY);
        weather.getAllWeather(function(error, data){
          if(!error && data.cod === 200) {
            //let data = JSON.parse(body);
            console.log(data);
            let name = data.name;
            let temp = data.main.temp;
            let desc = data.weather[0].description;
            let weather_result = "The weather in "+name+" is "+ desc +" & "+temp+"℃";
            f.txt(fbid, weather_result);
            //context.jobDone = true;
          } else {
            console.log(error);
            f.txt(fbid, 'I can\'t find that city');
          }
        });
      } else {
        context.action = 'weather';
  			session.update(sessionId, context);
  			p.weather(fbid, f);
        console.log(context);
      }
      //console.log(context);
    } else {
      let help_text = `Alf is always at your service! How can I help you today?`;
      let servicesbuttons = f.servicesbuttons(help_text);
      f.quick(fbid, servicesbuttons);
    }
    return resolve(context);

  });
}

module.exports = getWeather;
