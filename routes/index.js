'use strict';

const express = require('express');
const config = require('../config/core');
const router = express.Router();

router.get('/', (req, res) => {
	res.render('index', {
		config,
		title: config.SITE_NAME + ' · ' + config.TAGLINE
	});
});

router.get('/nojs', (req, res) => {
	res.render('index-nojs', {
		config,
		title: config.SITE_NAME + ' · ' + config.TAGLINE,
	});
});


module.exports = router;
