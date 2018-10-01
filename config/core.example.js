
'use strict'; /* eslint-disable */

const config = module.exports;

// Directory to store uploaded files
config.UPLOAD_DIRECTORY = './files';

// Database filename
config.DB_FILENAME = './database.db';

// Maximum file size (in bytes)
// Default: 100MB (100000000)
config.MAX_UPLOAD_SIZE = 100000000;

config.SITE_NAME = 'ImageHost';
config.HELLO = `Welcome to ${config.SITE_NAME}`;
config.TAGLINE = 'A simple image hosting site based on npomf.';

// Main URL (User-facing)
// config.URL = 'http://my.domain.is.moe';
// Used to have trailing / but trailing / is no longer supported.
config.URL = 'http://localhost:3000';
// URL to access uploaded files
// Different from URL if you're serving uploaded files from a different subdomain
// If you serve from a different directory/subdomain this app won't be able
// to actually serve the files, NGINX or something must do that. This is just
// for generating links to uploaded files.
// config.FILE_URL = 'http://a.my.domain.is.moe';
// Also used to have a trailing / but shouldn't any more!
config.FILE_URL = 'http://localhost:3000/f';

// Only open to localhost, you can should put this behind nginx or similar
// config.IFACES = '0.0.0.0'; // Open to all interfaces (Not running behind nginx)
config.IFACES = '0.0.0.0';
// Run on 3000 and then proxy with nginx to 80, or just directly open to 80 (not recommended)
// config.PORT = '80';
config.PORT = '3000';

// Contact name & email, for contact page
config.CONTACTS = [
	'<b>Your Name</b><br/>' +
	'<a href="mailto:Your@email.com">Your@email.com</a><br/>' +
	'<a href="http://twitter.com/YourTwitter">@YourTwitter</a>'
];

// Put your grills in public/images/grills and then link them here for them to randomly appear
// on rendered pages.
config.GRILLS = [
];

// Maximum number of files to upload at once
// Default: 10
config.MAX_UPLOAD_COUNT = 10;

// Filename key length
// Can be changed without affecting existing files
// Default: 6
config.KEY_LENGTH = 6;

// Extensions that should be automatically rejected.
// This is totally optional, you can just do
// if you don't want to reject any extensions.
// config.BANNED_EXTS = [];
config.BANNED_EXTS = [
	'exe',
	'scr',
	'vbs',
	'bat',
	'cmd',
	'html',
	'htm',
	'msi'
];

// Two dot extensions - for files that need both parts of the extension
// Some others might include .tar.lzma or .tar.lz . These are optional
// but may affect the way that users attempt to open files.
config.COMPLEX_EXTS = [
	'.tar.gz',
	'.tar.bz',
	'.tar.bz2',
	'.tar.xz',
	'.user.js'
];

// Google client ID and secret for admin login...
// https://console.developers.google.com/
config.GOOGLE_CLIENT_ID = 'xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com';
config.GOOGLE_CLIENT_SECRET = 'xxxxxxxxxxxxxxxxxxxxxxxxx';

// Before using passport-telegram-official, you must register your bot and get a API token.
// Read more about it on Telegram Documentation.
// Then you must set your domain using /setdomain command sent to @BotFather
config.TELEGRAM_BOT_TOKEN = 'xxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// Twitter client ID and secret for admin login...
// https://console.developers.google.com/
config.TWITTER_CLIENT_ID = 'xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com';
config.TWITTER_CLIENT_SECRET = 'xxxxxxxxxxxxxxxxxxxxxxxxx';

// Facebook client ID and secret for admin login...
// https://console.developers.google.com/
config.FACEBOOK_CLIENT_ID = 'xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com';
config.FACEBOOK_CLIENT_SECRET = 'xxxxxxxxxxxxxxxxxxxxxxxxx';

// Session options for Admin access.
// Set cookies are always signed with keys[0], while the other keys are
// valid for verification, allowing for key rotation.
// If you don't want to use key rotation, remove the 'keys' and use 'secret'
// instead.
// Documentation: https://github.com/expressjs/cookie-session#cookie-options
config.SESSION_OPTIONS = {
	keys: [ 'new key', 'old key in rotation' ],
	maxAge: 86400 * 1000, // 1 day (milliseconds)
	name: 'admin.session',
	secure: false, // Should be true if you are proxying w/ nginx with SSL
	domain: undefined // You should set this to your domain
};

for (const attr in process.env) {
	if (attr && attr.startsWith('IH_')) {
		const eattr = attr.replace('IH_', '');
		const data = process.env[attr];
		// lets make it possible to use stuff like CONTACTS in docker environments.
		try {
			config[eattr] = JSON.parse(data);
		} catch (exception) {
			config[eattr] = data;
		}
	}
}


if (!('DESCRIPTION' in config)) {
	config.DESCRIPTION = `Upload whatever you want here, as long as it's under ${config.MAX_UPLOAD_SIZE / 1000000} MB.<br/> ` +
						`Please read our <a href='/faq'>FAQ</a>, as we may remove files under specific circumstances.`;
}

// DO NOT TOUCH UNLESS YOU KNOW HOW TO PROPERLY CONFIGURE CORS
// Changes the file upload form to POST to this URL instead of the one it's loaded from.
if (!('UPLOAD_URL' in config)) {
	config.UPLOAD_URL = config.URL;
}
