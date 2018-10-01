'use strict';
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');
const GoogleStrategy = require('passport-google-auth').Strategy;
const TelegramStrategy = require('passport-telegram-official').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const FacbookStrategy = require('passport-facebook').Strategy;
const config = require('./config/core');
const utils = require('./util/core');
const cookieSession = require('cookie-session');

const contactRouter = require('./routes/contact');
const uploadRouter = require('./routes/upload');
const indexRouter = require('./routes/index');
const toolsRouter = require('./routes/tools');
const faqRouter = require('./routes/faq');
const mediaRouter = require('./routes/admin/media');
const usersRouter = require('./routes/admin/users');
const loginRouter = require('./routes/admin/login');
const disabledRouter = require('./routes/admin/disabled');

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((obj, done) => {
	done(null, obj);
});

let google_auth = false;
let twitter_auth = false;
let facebook_auth = false;
let telegram_auth = false;
if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
	google_auth = true;
	passport.use('google', new GoogleStrategy(
		{
			callbackURL: config.URL + '/auth/google/callback',
			clientId: config.GOOGLE_CLIENT_ID,
			clientSecret: config.GOOGLE_CLIENT_SECRET
		},
		(accessToken, refreshToken, profile, done) => {
			utils.createOrGetUser(profile, (profiledata) => {
				done(null, profiledata);
			});
		}
	));
}

if (config.TWITTER_CLIENT_ID && config.TWITTER_CLIENT_SECRET) {
	twitter_auth = true;
	passport.use('twitter', new TwitterStrategy(
		{
			callbackURL: config.URL + '/auth/twitter/callback',
			consumerKey: config.TWITTER_CLIENT_ID,
			consumerSecret: config.TWITTER_CLIENT_SECRET
		},
		(accessToken, refreshToken, profile, done) => {
			utils.createOrGetUser(profile, (profiledata) => {
				done(null, profiledata);
			});
		}
	));
}

if (config.FACEBOOK_CLIENT_ID && config.FACEBOOK_CLIENT_SECRET) {
	facebook_auth = true;
	passport.use('facebook', new FacbookStrategy(
		{
			callbackURL: config.URL + '/auth/facebook/callback',
			clientID: config.FACEBOOK_CLIENT_ID,
			clientSecret: config.FACEBOOK_CLIENT_SECRET
		},
		(accessToken, refreshToken, profile, done) => {
			utils.createOrGetUser(profile, (profiledata) => {
				done(null, profiledata);
			});
		}
	));
}

if (config.TELEGRAM_BOT_TOKEN) {
	telegram_auth = true;
	passport.use('telegram', new TelegramStrategy(
		{
			botToken: config.TELEGRAM_BOT_TOKEN,
			callbackURL: config.URL + '/auth/telegram/callback'
		},
		(accessToken, refreshToken, profile, done) => {
			utils.createOrGetUser(profile, (profiledata) => {
				done(null, profiledata);
			});
		}
	));
}

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
	extended: false
}));
app.use(cookieParser());

if (config.SESSION_OPTIONS.secureProxy === true) {
	app.set('trust proxy', 1);
}
app.use(cookieSession(config.SESSION_OPTIONS));

if (google_auth || twitter_auth || telegram_auth || facebook_auth) {
	app.use(passport.initialize());
	app.use(passport.session());
}

app.use(express.static(path.join(__dirname, 'public')));
app.use('/f', express.static(path.join(__dirname, config.UPLOAD_DIRECTORY)));
app.set('json spaces', 2);

if (google_auth || twitter_auth || telegram_auth || facebook_auth) {
	app.use('/admin/media', mediaRouter);
	app.use('/admin/users', usersRouter);
	app.use('/admin/login', loginRouter);
	app.get('/admin/logout', (req, res) => {
		req.logout();
		res.redirect('/');
	});
} else {
	app.use('/admin/media', disabledRouter);
	app.use('/admin/users', disabledRouter);
	app.use('/admin/login', disabledRouter);
}

app.use('/', indexRouter);
app.use('/upload(.php)?', uploadRouter);
app.use('/tools', toolsRouter);
app.use('/faq', faqRouter);
app.use('/contact', contactRouter);

// Authentication functionality
if (google_auth) {
	const opts = { scope: [ 'https://www.googleapis.com/auth/userinfo.email' ] };
	app.get('/auth/google', passport.authenticate('google', opts));

	app.get(
		'/auth/google/callback',
		passport.authenticate('google', { failureRedirect: '/failed' }),
		(req, res) => {
			res.redirect('/admin/media');
		}
	);
}

if (facebook_auth) {
	app.get('/auth/facebook', passport.authenticate('facebook'));

	app.get(
		'/auth/facebook/callback',
		passport.authenticate('facebook', { failureRedirect: '/failed' }),
		(req, res) => {
			res.redirect('/admin/media');
		}
	);
}

if (twitter_auth) {
	app.get('/auth/twitter', passport.authenticate('twitter'));

	app.get(
		'/auth/twitter/callback',
		passport.authenticate('twitter', { failureRedirect: '/failed' }),
		(req, res) => {
			res.redirect('/admin/media');
		}
	);
}

if (telegram_auth) {
	app.get('/auth/telegram', passport.authenticate('telegram'));

	app.get(
		'/auth/telegram/callback',
		passport.authenticate('telegram', { failureRedirect: '/failed' }),
		(req, res) => {
			res.redirect('/admin/media');
		}
	);
}

// catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404));
});

// error handler
app.use((err, req, res) => { // next...
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
