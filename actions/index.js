'use strict';
const config = require('../config');
const API_URL = config.API_URL;
const WEB_URL = config.WEB_URL;
const greetBack = require('./greetBack');
const findBusiness = require('./findBusiness');
const getWeather = require('./getWeather');
const endConversation = require('./endConversation');
module.exports = (session, f) => {
  const actions = {
    send(request, response) {
      const {sessionId, context, entities} = request;
      const {text, quickreplies} = response;
      return new Promise((resolve, reject) => {
        let {fbid} = session.get(sessionId);
        //console.log(entities);
        let help_text = `Alf is always at your service! How can I help you today?`;
        if(entities.intent !== undefined) {
          if(entities.intent[0].confidence > 0.8) {
            f.txt(fbid, text);
          }
          else {
            let servicesbuttons = f.servicesbuttons(help_text);
            f.quick(fbid, servicesbuttons);
          }
        } else {
          let servicesbuttons = f.servicesbuttons(help_text);
          f.quick(fbid, servicesbuttons);
        }
        return resolve();
      });
    },
    greetBack,
    findBusiness,
    getWeather,
    endConversation
  }

  return actions;
}
