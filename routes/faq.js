'use strict';

const express = require('express');
const config = require('../config/core');
const router = express.Router();

router.get('/', (req, res) => {
	res.render('faq', {
		config,
		title: config.SITE_NAME + ' · FAQ'
	});
});

module.exports = router;
