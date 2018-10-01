'use strict';

const express = require('express');
const config = require('../config/core');
const router = express.Router();

router.get('/', (req, res) => {
	res.render('tools', {
		config,
		title: config.SITE_NAME + ' · Tools'
	});
});

router.get('/sharex', (req, res) => {
	res.json({
		Arguments: {},
		DeletionURL: '',
		FileFormName: 'files[]',
		Name: config.SITE_NAME,
		RegexList: [
			'\'url\': \'(.+?)\''
		],
		RequestType: 'POST',
		RequestURL: config.UPLOAD_URL + '/upload.php',
		ResponseType: 'Text',
		ThumbnailURL: '',
		URL: '$1,1$'
	});
});

module.exports = router;
