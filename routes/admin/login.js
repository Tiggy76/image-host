'use strict';

const express = require('express');
const config = require('../../config/core');
const router = express.Router();


router.get('/', (req, res, next) => {
	if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
		if (req.isAuthenticated()) {
			return res.redirect('/admin/media');
		}
		res.render('admin/login', {
			config,
			title: config.SITE_NAME + ' · Login'
		});
	} else if (config.TWITTER_CLIENT_ID && config.TWITTER_CLIENT_SECRET) {
		if (req.isAuthenticated()) {
			return res.redirect('/admin/media');
		}
		res.render('admin/login', {
			config,
			title: config.SITE_NAME + ' · Login'
		});
	} else if (config.FACEBOOK_CLIENT_ID && config.FACEBOOK_CLIENT_SECRET) {
		if (req.isAuthenticated()) {
			return res.redirect('/admin/media');
		}
		res.render('admin/login', {
			config,
			title: config.SITE_NAME + ' · Login'
		});
	} else if (config.TELEGRAM_BOT_TOKEN) {
		if (req.isAuthenticated()) {
			return res.redirect('/admin/media');
		}
		res.render('admin/login', {
			config,
			title: config.SITE_NAME + ' · Login'
		});
	} else {
		next(new Error('Authentication not configured'));
	}
});

module.exports = router;
