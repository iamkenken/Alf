'use strict';
const request = require('request');
const crypto = require('crypto');

class FBeamer {
	constructor(config) {
		try {
			if(!config || config.PAGE_ACCESS_TOKEN === undefined || config.VERIFY_TOKEN === undefined || config.APP_SECRET === undefined) {
				throw new Error("Unable to access tokens!");
			} else {
				this.PAGE_ACCESS_TOKEN = config.PAGE_ACCESS_TOKEN;
				this.VERIFY_TOKEN = config.VERIFY_TOKEN;
				this.APP_SECRET = config.APP_SECRET;
			}
		} catch(e) {
			console.log(e);
		}
	}

	registerHook(req, res) {
		// If req.query.hub.mode is 'subscribe'
		// and if req.query.hub.verify_token is the same as this.VERIFY_TOKEN
		// then send back an HTTP status 200 and req.query.hub.challenge
		let {
			mode,
			verify_token,
			challenge
		} = req.query.hub;

		if(mode === 'subscribe' && verify_token === this.VERIFY_TOKEN) {
			return res.end(challenge);
		} else {
			console.log("Could not register webhook!");
			return res.status(403).end();
		}
	}

	verifySignature(req, res, next) {
		if(req.method === 'POST') {
			let signature = req.headers['x-hub-signature'];
			try {
				if(!signature) {
					throw new Error("Signature missing!");
				} else {
					let hash = crypto.createHmac('sha1', this.APP_SECRET).update(JSON.stringify(req.body)).digest('hex');
					try {
						if(hash !== signature.split("=")[1]) {
							throw new Error("Invalid Signature");
						}
					} catch(e) {
							res.send(500, e);
						}
				}
			} catch(e) {
				res.send(500, e);
			}
		}

		return next();

	}

	subscribe() {
		request({
			uri: 'https://graph.facebook.com/v2.6/me/subscribed_apps',
			qs: {
				access_token: this.PAGE_ACCESS_TOKEN
			},
			method: 'POST'
		}, (error, response, body) => {
			if(!error && JSON.parse(body).success) {
				console.log("Subscribed to the page!");
			} else {
				console.log(error);
			}
		});
	}

	getProfile(id) {
		return new Promise((resolve, reject) => {
			request({
				uri: `https://graph.facebook.com/v2.7/${id}`,
				qs: {
					access_token: this.PAGE_ACCESS_TOKEN
				},
				method: 'GET'
			}, (error, response, body) => {
				if(!error & response.statusCode === 200) {
					resolve(JSON.parse(body));
				} else {
					reject(error);
				}
			});
		});
	}

	incoming(req, res, cb) {
		// Extract the body of the POST request
		let data = req.body;
		if(data.object === 'page') {
			// Iterate through the page entry Array
			data.entry.forEach(pageObj => {
				// Iterate through the messaging Array
				pageObj.messaging.forEach(msgEvent => {
					let messageObj = {
						sender: msgEvent.sender.id,
						timeOfMessage: msgEvent.timestamp,
						message: msgEvent.message || undefined,
						postback: msgEvent.postback || undefined,
						quick_reply: msgEvent.message === undefined ? undefined : msgEvent.message.quick_reply || undefined,
					}
					cb(messageObj);
				});
			});
		}
		res.send(200);
	}

	sendMessage(payload) {
		return new Promise((resolve, reject) => {
			// Create an HTTP POST request
			request({
				uri: 'https://graph.facebook.com/v2.6/me/messages',
				qs: {
					access_token: this.PAGE_ACCESS_TOKEN
				},
				method: 'POST',
				json: payload
			}, (error, response, body) => {
				if(!error && response.statusCode === 200) {
					resolve({
						messageId: body.message_id
					});
				} else {
					reject(error);
				}
			});
		});
	}

	// Show Persistent Menu
	showPersistent(payload) {
		let obj = {
			setting_type: "call_to_actions",
			thread_state: "existing_thread",
			call_to_actions: payload
		}

		request({
			uri: 'https://graph.facebook.com/v2.6/me/thread_settings',
			qs: {
				access_token: this.PAGE_ACCESS_TOKEN
			},
			method: 'POST',
			json: obj
		}, (error, response) => {
			if(error) {
				console.log(error);
			}
		});
	}

	// Send a text message
	txt(id, text) {
		let obj = {
			recipient: {
				id
			},
			message: {
				text
			}
		}

		this.sendMessage(obj)
			.catch(error => console.log(error));

	}

	// Send an image message
	img(id, url) {
		let obj = {
			recipient: {
				id
			},
			message: {
				attachment: {
					type: 'image',
					payload: {
						url
					}
				}
			}
		}

		this.sendMessage(obj)
			.catch(error => console.log(error));
	}

	// Quick Replies
	// quick(id, data) {
	// 	let obj = {
	// 		recipient: {
	// 			id
	// 		},
	// 		message: {
	// 			text: data.text,
	// 			quick_replies: data.buttons
	// 		}
	// 	}
	//
	// 	this.sendMessage(obj)
	// 		.catch(error => console.log('I am '+error));
	// }

	quick(id, message) {
		let obj = {
			recipient: {
				id
			},
			message
		}
		this.sendMessage(obj)
			.catch(error => console.log('I am '+error));
	}

	btn(id, data) {
		let obj = {
			recipient: {
				id
			},
			message: {
				attachment: {
					type: 'template',
					payload: {
						template_type: 'button',
						text: data.text,
						buttons: data.buttons
					}
				}
			}
		}

		this.sendMessage(obj)
			.catch(error => console.log(error));
	}

	generic(id, data) {
		let obj = {
			recipient: {
				id
			},
			message: {
				attachment: {
					type: 'template',
					payload: {
						template_type: 'generic',
						elements: data
					}
				}
			}
		}

		this.sendMessage(obj)
			.catch(error => console.log(error));
	}

	senderAction(id) {
		let obj = {
			recipient: { id
			},
			sender_action: "typing_on"
		}

		this.sendMessage(obj)
			.catch(error => console.log(error));
	}

	//template data
	directorydata(WEB_URL) {
		let data = [{
			"title": 'Directory',
			"image_url":"https://scontent.fmnl3-2.fna.fbcdn.net/v/t1.0-1/15267711_1997827973777390_3857560197000386910_n.jpg?oh=29f7212a1a23fa5a8ddda490f0f2f578&oe=58D87AD4",
			"subtitle":"Great! You can start to find or add a business by choosing button below.",
			"buttons":[
				{
					"type": "postback",
					"title": "Find Business",
					"payload": "MENU_DIRECTORY_SEARCH"
				},
				{
					"type":"web_url",
					"url":WEB_URL+"/add-business",
					"title":"Add A Business",
					"webview_height_ratio": "tall",
					"messenger_extensions": true
				},
				{
					"type": "postback",
					"title": "My Business",
					"payload": "MENU_DIRECTORY_LISTINGS"
				}
			]
		}];
		return data;
	}

	classifiedsdata(WEB_URL) {
		let data = [{
			"title": 'Buy or Sell?',
			"image_url":"https://scontent.fmnl3-2.fna.fbcdn.net/v/t1.0-1/15267711_1997827973777390_3857560197000386910_n.jpg?oh=29f7212a1a23fa5a8ddda490f0f2f578&oe=58D87AD4",
			"subtitle":"Great! want something to Buy or Sell?",
			"buttons":[
				{
					"type": "postback",
					"title": "Find Item",
					"payload": "MENU_CLASSIFIEDS_SEARCH"
				},
				{
					"type":"web_url",
					"url":WEB_URL+"/add-business",
					"title":"Sell Item",
					"webview_height_ratio": "tall",
					"messenger_extensions": true
				},
				{
					"type": "postback",
					"title": "My Listings",
					"payload": "MENU_CLASSIFIEDS_LISTINGS"
				}
			]
		}];
		return data;
	}

	servicesbuttons(text) {
		let buttons ={
	    "text":text,
	    "quick_replies":[
	      {
	        "content_type":"text",
	        "title":"Business Finder",
	        "payload":"MENU_DIRECTORY"
	      },
				{
	        "content_type":"text",
	        "title":"Buy or Sell",
	        "payload":"MENU_CLASSIFIEDS"
	      },
				{
	        "content_type":"text",
	        "title":"FREE Text Message",
	        "payload":"MENU_SMS"
	      },
				{
	        "content_type":"text",
	        "title":"Weather",
	        "payload":"MENU_WEATHER"
	      }
	    ]
	  };

		return buttons;
	}

	servicesbuttons2(text) {
		let buttons ={
	    "text":text,
	    "quick_replies":[
			{
			"content_type":"text",
			"title":"Business Finder",
			"payload":"MENU_DIRECTORY_RESULT"
			},
			{
	        "content_type":"text",
	        "title":"Buy or Sell",
	        "payload":"MENU_CLASSIFIEDS_RESULT"
	      	}
	    ]
	  };

		return buttons;
	}

}

module.exports = FBeamer;
