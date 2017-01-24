'use strict';
let session = require('../session');
const config = require('../config');
const FBeamer = require('../fbeamer');
const f = new FBeamer(config.FB);
const greetBack = ({sessionId, context, entities}) => {
  console.log(entities);

    return new Promise((resolve, reject) => {
      let {fbid} = session.get(sessionId);
      f.getProfile(fbid)
        .then(profile => {
          const {first_name, timezone} = profile;
          let help_text = `Hello ${first_name}, Alf is always at your service! How can I help you today?`;
          let servicesbuttons = f.servicesbuttons(help_text);
          f.quick(fbid, servicesbuttons);
          //console.log(entities.intent[0].value);
        })
        .catch(error => console.log(error));

      return resolve(context);
    });

}

module.exports = greetBack;
