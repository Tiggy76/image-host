'use strict';

const express = require('express');
const config = require('../../config/core');
const util = require('../../util/core');
const router = express.Router();


router.get('/', util.ensureAuthenticated, (req, res) => {
	res.render('admin/media', {
		config,
		title: config.SITE_NAME + ' · Media',
		user: req.user
	});
});

const ensureAuthenticated = (req, res, next) => {
	if (req.isAuthenticated() && (req.user.permissions.indexOf('a') >= 0 || req.user.permissions.indexOf('*') >= 0)) {
		return next();
	}
	res.status(401).json({ error: { code: 401, message: 'Not authenticated' } });
};

router.get('/uploads', ensureAuthenticated, (req, res) => {
	let age = req.query.maxAge; // 1 day
	age = parseInt(age, 10);
	if (!age && age !== 0) {
		return res.status(400).json({ error: { code: 400, message: 'Invalid/no age specified' } });
	}
	const now = Math.floor((new Date()).getTime() / 1000);
	const since = now - age;
	util.getUploads(since, (err, uploads) => {
		if (err) {
			return res.status(500).json({ error: { code: 500, message: 'An error occurred' } });
		}
		res.status(200).json(uploads);
	});
});

router.post('/delete', ensureAuthenticated, (req, res) => {
	const id = req.body.id; /* eslint-disable-line */
	if (!id) {
		return res.status(400).json({ error: { code: 400, message: 'Invalid id specified' } });
	}
	util.deleteFile(id, (err) => {
		if (err) {
			return res.status(500).json({ error: { code: 500, message: 'An error occurred' } });
		}
		res.status(200).json({ id });
	});
});

router.post('/rename', ensureAuthenticated, (req, res) => {
  const id = req.body.id; /* eslint-disable-line */
  const newName = req.body.newName; /* eslint-disable-line */
	if (!id || !newName || !/^[\w\-. ]+$/.test(newName)) {
		return res.status(400).json({ error: { code: 400, message: 'Invalid id or new name specified' } });
	}
	util.renameFile(id, newName, (err, data) => {
		if (err) {
			return res.status(500).json({ error: { code: 500, message: 'An error occurred' } });
		}
		res.status(200).json(data);
	});
});

module.exports = router;
