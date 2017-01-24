'use sctrict';
const request = require('request');
//request Url
const localhost = 'http://localhost/alfafusion/directory/public/api/v1';
class req_subscriber {

    store(fbid) {
      return new Promise((resolve, reject) => {
          request({
            uri: localhost+'/subscriber/store',
            qs: {
              fbid: sender,
            },
            method: 'GET'
          }, (error, response, body) => {
            console.log(response.exists);
            if(!error && response.statusCode === 200 && response.exists === true) {
              f.txt(sender, `Welcome back ${first_name}`);
            } else {
              f.txt(sender, `Hi ${first_name},`);
            }
          });
        });
    }
}
