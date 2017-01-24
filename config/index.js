'use strict';
if(process.env.NODE_ENV === 'production') {
	module.exports = {
		WIT_ACCESS_TOKEN: process.env.WIT_ACCESS_TOKEN,
		FB: {
			PAGE_ACCESS_TOKEN: process.env.PAGE_ACCESS_TOKEN,
			VERIFY_TOKEN: process.env.VERIFY_TOKEN,
			APP_SECRET: process.env.APP_SECRET
		},
		"API_URL": process.env.API_URL,
		"WEB_URL": process.env.WEB_URL,
		"DIR_IMAGE_URL": process.env.DIR_IMAGE_URL,
		"API_URL_CLASSIFIEDS": process.env.API_URL_CLASSIFIEDS,
	}
} else {
	module.exports = require('./development.json');
}
