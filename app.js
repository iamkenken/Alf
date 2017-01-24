'use strict';
const config = require('./config');
// create an API server
const Restify = require('restify');
const fs = require('fs');
//SSL
const options = {
  key: fs.readFileSync('/etc/ssl/keys/node1.alfafusion.com.key'),
  cert: fs.readFileSync('/etc/ssl/certs/node1.alfafusion.com.pem')
};
const server = Restify.createServer(options);
const PORT = process.env.PORT || 8000;
const request = require('request');
// FBeamer
const FBeamer = require('./fbeamer');
const f = new FBeamer(config.FB);

server.use(Restify.jsonp());
server.use(Restify.bodyParser());
server.use((req, res, next) => f.verifySignature(req, res, next));

// Session
const session = require('./session');
// WIT Actions
const actions = require('./actions')(session, f);

// WIT.AI
const Wit = require('node-wit').Wit;
const wit = new Wit({
	accessToken: config.WIT_ACCESS_TOKEN,
	actions
});

//const subscriber = require('./req_subscriber');
const API_URL = config.API_URL;
const WEB_URL = config.WEB_URL;
const DIR_IMAGE_URL = config.DIR_IMAGE_URL;
const SMS_API = 'http://sgd2.domainwink.com:8010/unifiedsms/send.php';
const OWM_API = 'http://api.openweathermap.org/data/2.5/weather';
const weather = require('openweather-apis');
const OWM_KEY = config.OWM_KEY;

const postbacks = require('./postbacks');
const p = new postbacks();
// Register the webhooks
server.get('/', (req, res, next) => {
	f.registerHook(req, res);
	return next();
});

// Handle incoming
server.post('/', (req, res, next) => {
	f.incoming(req, res, msg => {
		const {
			sender,
			postback,
			message,
		} = msg;
		//console.log(msg);
		//turn typing indicators on
		f.senderAction(sender);

		//Store facebook user on get started
		if(postback && postback.payload === 'GET_STARTED') {
			//console.log(postback);
			p.getstarted(sender, f, API_URL, WEB_URL);
			res.end();
		}

		//Send SMS
		if(postback && postback.payload === 'MENU_SEND') {
			let sessionId = session.init(sender);
			let {context} = session.get(sessionId);
			//console.log(context);
			if(context.data.number !== '' && context.data.sms_message !== '') {
				request({
					uri: SMS_API,
					qs: {
						user: 'testuser',
						pass: '7caa69399c8e146768deb3fefce991b7',
						recipient: context.data.number,
						message: context.data.sms_message
					},
					method: 'GET'
				}, (error, response, body) => {
					//console.log(body);
					if(!error && response.statusCode === 200 && body.includes("OK")) {
						f.txt(sender, 'Your message has been sent');
						let text = 'Thanks for using Alf.'
						let servicesbuttons = f.servicesbuttons(text);
						f.quick(sender, servicesbuttons);
					} else {
						let text = 'Can\'t deliver your message. Invalid data';
						let servicesbuttons = f.servicesbuttons(text);
						f.quick(sender, servicesbuttons);
					}
				});
			} else {
				let text = 'Can\'t deliver your message. Invalid data';
				let servicesbuttons = f.servicesbuttons(text);
				f.quick(sender, servicesbuttons);
			}
			session.delete(sessionId);
			res.end();
		}


		if(postback && postback.payload === 'MENU_DIRECTORY_LISTINGS') {
			p.menulistings(sender, f, API_URL, WEB_URL, DIR_IMAGE_URL);
			res.end();
		}

		//SMS postback
		if(postback && postback.payload === 'MENU_SMS') {
			let sessionId = session.init(sender);
			let {context} = session.get(sessionId);
			context.action = 'sms';
			context.data = {
				number: '',
				sms_message: ''
			};
			session.update(sessionId, context);
			p.menusms(sender, f);
			res.end();
		}

		//Directory Postbacks
		if(postback && postback.payload === 'MENU_DIRECTORY_SEARCH') {
			let sessionId = session.init(sender);
			let {context} = session.get(sessionId);
			context.action = 'directory';
			session.update(sessionId, context);
			f.txt(sender, 'Tell me what business do you want me to find. (e.g. I am looking for restaurant in Quezon City)');
			res.end();
		}

		if(postback && postback.payload === 'MENU_CLASSIFIEDS_SEARCH') {
			let sessionId = session.init(sender);
			let {context} = session.get(sessionId);
			context.action = 'classifieds';
			session.update(sessionId, context);
			f.txt(sender, 'Tell me the item that you like to buy. (e.g. I am looking for smart phone in Quezon City)');
			res.end();
		}

		if(postback && postback.payload === 'MENU_HELP') {
			p.menuhelp(sender, f, WEB_URL);
			res.end();
		}

		//weather postbacks
		if(postback && postback.payload === 'MENU_WEATHER') {
			let sessionId = session.init(sender);
			let {context} = session.get(sessionId);
			context.action = 'weather';
			session.update(sessionId, context);
			p.weather(sender, f);
			res.end();
		}

		if(postback && postback.payload === 'MENU_DIRECTORY') {
			//console.log(postback);
			let sessionId = session.init(sender);
			let {context} = session.get(sessionId);
			context.action = 'directory';
			session.update(sessionId, context);
			p.directory(sender, f, WEB_URL);
			res.end();
		}

		if(postback && postback.payload === 'MENU_CLASSIFIEDS') {
			//console.log(postback);
			let sessionId = session.init(sender);
			let {context} = session.get(sessionId);
			context.action = 'classifieds';
			session.update(sessionId, context);
			console.log(context);
			p.classifieds(sender, f, WEB_URL);
			res.end();
		}

		if(message.quick_reply && message.quick_reply.payload === 'MENU_WEATHER') {
			let sessionId = session.init(sender);
			let {context} = session.get(sessionId);
			context.action = 'weather';
			session.update(sessionId, context);
			p.weather(sender, f);
			res.end();
		}

		if(message.quick_reply && message.quick_reply.payload === 'MENU_DIRECTORY') {
			//console.log(postback);
			let sessionId = session.init(sender);
			let {context} = session.get(sessionId);
			context.action = 'directory';
			session.update(sessionId, context);
			p.directory(sender, f, WEB_URL);
			res.end();
		}

		if(message.quick_reply && message.quick_reply.payload === 'MENU_SMS') {
			let sessionId = session.init(sender);
			let {context} = session.get(sessionId);
			context.action = 'sms';
			context.data = {
				number: '',
				sms_message: ''
			};
			session.update(sessionId, context);
			p.menusms(sender, f);
			res.end();
		}

		if(message.quick_reply && message.quick_reply.payload === 'MENU_CLASSIFIEDS') {
			//console.log(postback);
			let sessionId = session.init(sender);
			let {context} = session.get(sessionId);
			context.action = 'classifieds';
			session.update(sessionId, context);
			console.log(context);
			p.classifieds(sender, f, WEB_URL);
			res.end();
		}

		// if(message.attachments && message.attachments[0].type == 'location') {
		// 	let sessionId = session.init(sender);
		// 	let {context} = session.get(sessionId);
		// 	let lat = message.attachments[0].payload.coordinates.lat;
		// 	let lon = message.attachments[0].payload.coordinates.long;
		// 	console.log(lat);
		// 	console.log(lon);
		// 	request({
		// 		uri: OWM_API,
		// 		qs: {
		// 			lat: lat,
		// 			lon: lon,
		// 			units: 'metric',
		// 			appid: 'd14b5d9ea530ef1c8faa46cbf983c020'
		// 		},
		// 		method: 'GET'
		// 	}, (error, response, body) => {
		// 		//console.log(body);
		// 		if(!error && response.statusCode === 200) {
		// 			let data = JSON.parse(body);
		// 			//console.log(data);
		// 			let name = data.name;
		// 			let country = data.sys.country;
		// 			let temp = data.main.temp;
		// 			let desc = data.weather[0].description;
		// 			let weather_result = "The weather in "+name+', '+ country +" is "+ desc +" & "+temp+"℃";
		// 			f.txt(sender, weather_result);
		// 			res.end();
		// 		} else {
		// 			console.log(response.statusCode);
		// 			f.txt(sender, 'I can\'t find that city');
		// 		}
		// 		session.delete(sessionId);
		// 	});
		//
		// 	res.end();
		// }

		//function to check empty object
		// function isEmpty(obj) {
		//     for(var key in obj) {
		//         if(obj.hasOwnProperty(key))
		//             return false;
		//     }
		//     return true;
		// }

		//WIT

		if(message.text && message.quick_reply === undefined) {
			// Process the message herelet sessionId = session.init(sender);
			let sessionId = session.init(sender);
			let {context} = session.get(sessionId);
			if(context.action && context.action === 'sms') {
				if(context.data.number === '' && context.data.sms_message === '') {
					context.data.number = message.text;

					f.txt(sender, 'Type your message');
					res.end();
				} else {
					context.data.sms_message = message.text;

					let data = {
			      text: 'Tap send to continue',
			      buttons:[
			        {
			          "type": "postback",
			          "title": "SEND",
			          "payload": "MENU_SEND"
			        }
			      ]
			    };
			    f.btn(sender, data);
					res.end();
				}

				session.update(sessionId, context);
				console.log(sessionId);
				console.log(context);
			} else if(context.action && context.action === 'weather') {
				console.log(context)
				let location = message.text;
				weather.setLang('en');
				weather.setCity(location);
				weather.setUnits('metric');
				weather.setAPPID(OWM_KEY);
				weather.getAllWeather(function(error, data){
	        if(!error && data.cod === 200) {
				//let data = JSON.parse(body);
				//console.log(data);
				let name = data.name;
				let temp = data.main.temp;
				let desc = data.weather[0].description;
				let weather_result = "The weather in "+name+" is "+ desc +" & "+temp+"℃";
				f.txt(sender, weather_result);
				session.delete(sessionId);
	        } else {
				console.log(error);
				f.txt(sender, 'I can\'t find that city');
	        }
	      });
				//console.log(msg);
			} else {
			wit.runActions(sessionId, message.text, context)
				.then(ctx => {
					// Delete session if the conversation is over
					ctx.jobDone ? session.delete(sessionId) : session.update(sessionId, ctx);
					//console.log(ctx);
				})
				.catch(error => console.log(`Error: ${error}`));
			}
		}

	});

	return next();
});



// Persistent Menu
f.showPersistent([
	// {
	// 	type: "postback",
	// 	title: "Star Over",
	// 	payload: "GET_STARTED"
	// },
	{
		type: "postback",
		title: "Business Finder",
		payload: "MENU_DIRECTORY"
	},
	{
		type: "postback",
		title: "Buy or Sell",
		payload: "MENU_CLASSIFIEDS"
	},
	{
		type: "postback",
		title: "Free SMS",
		payload: "MENU_SMS"
	},
	{
		type: "postback",
		title: "Weather",
		payload: "MENU_WEATHER"
	}
]);

// Subscribe
f.subscribe();

server.listen(PORT, () => console.log(`Bot running on port ${PORT}`));