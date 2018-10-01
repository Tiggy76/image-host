'use strict';

const express = require('express');
const config = require('../../config/core');
const util = require('../../util/core');
const router = express.Router();

router.get('/', util.ensureAuthenticated, (req, res) => {
	util.getAllUsers((error, users) => {
		if (req.user.permissions.indexOf('u') < 0 && req.user.permissions.indexOf('*') < 0) {
			users = [ req.user ];
		}
		res.render('admin/users', {
			config,
			title: config.SITE_NAME + ' · Users',
			user: { req },
			users });
	});
});

const ensureAuthenticated = (req, res, next) => {
	if (req.isAuthenticated() && (req.user.permissions.indexOf('u') >= 0 || req.user.permissions.indexOf('*') >= 0)) {
		return next();
	}
	res.status(401).json({ error: { code: 401, message: 'Not authenticated' } });
};

router.post('/perm', ensureAuthenticated, (req, res) => {
	const id = req.body.id; /* eslint-disable-line */
	const perms = req.body.perms; /* eslint-disable-line */
	if (!id || !perms) {
		return res.status(400).json({ error: { code: 400, message: 'Invalid id or permissions specified' } });
	}
	util.setUserPermissions(id, perms, (err) => {
		if (err) {
			return res.status(500).json({ error: { code: 500, message: 'An error occurred' } });
		}
		res.status(200).json({ id, perms });
	});
});

module.exports = router;
