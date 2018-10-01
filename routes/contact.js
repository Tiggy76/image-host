'use strict';

const express = require('express');
const config = require('../config/core');
const router = express.Router();

router.get('/', (req, res) => {
	res.render('contact', {
		config,
		title: config.SITE_NAME + ' · Contact'
	});
});

module.exports = router;
