'use strict';

const config = require('../config/core');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(config.DB_FILENAME);
db.exec('CREATE TABLE IF NOT EXISTS users (id integer primary key, provider text, username text, displayName text, profileUrl text, permissions text)');
db.run('CREATE TABLE IF NOT EXISTS files (id integer primary key, filename text unique, originalname text, size number, created datetime)', () => {
	db.all('PRAGMA table_info(\'files\')', (error, rows) => {
		if (typeof rows !== 'undefined' && rows !== null) {
			const names = rows.map((val) => val.name);
			if (names.indexOf('created') === -1) {
			// Add creation date if we are at version 0, version 0 shouldn't have it.
				db.exec('ALTER TABLE files ADD COLUMN created datetime');
			}
		}
	});
});

const reverse = (s) => {
	let o = '';
	for (let i = s.length - 1; i >= 0; i--) {
		o += s[i];
	}
	return o;
};

const randomString = (length) => Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)).toString(36).slice(1);

const generate_name = (file, database, cb) => {
	let ext = path.extname(file.originalname).toLowerCase();
	// Check if extension is a double-dot extension and, if true, override $ext
	const revname = reverse(file.originalname.toLowerCase());
	config.COMPLEX_EXTS.forEach((extension) => {
		extension = reverse(extension.toLowerCase());
		if (revname.indexOf(extension) === 0) {
			ext = reverse(extension);
		}
	});

	const gen_name_internal = () => {
		let name = randomString(config.KEY_LENGTH);
		// Add the extension to the file name
		if (typeof ext !== 'undefined' && ext !== null && ext !== '') {
			name += ext;
		}
		// Check if a file with the same name does already exist in the database
		database.get('SELECT COUNT(name) FROM files WHERE filename = ?', name, (error, row) => {
			if (typeof row === 'undefined' || row === null || row['COUNT(name)'] === 0) {
				const now = Math.floor((new Date()).getTime() / 1000);
				database.run('INSERT INTO files (originalname, filename, size, created) VALUES (?, ?, ?, ?)', [ file.originalname, name, file.size, now ]);
				cb(name);
			} else {
				console.warn('Name conflict! (' + name + ')');
				gen_name_internal();
			}
		});
	};
	gen_name_internal();
};

const getUploads = (since, callback) => {
	db.all('SELECT * FROM files WHERE datetime(created) > datetime(?);', [ since ], callback);
};

const deleteFile = (id, callback) => {
	db.get('SELECT filename FROM files WHERE id = ?', id, (error, row) => {
		if (row && row.filename) {
			db.run('DELETE FROM files WHERE id = ?', id, (err) => {
				if (err) return callback(err);
				fs.unlink(path.join(config.UPLOAD_DIRECTORY, row.filename), callback);
			});
		} else {
			return callback(new Error('Failed to get the filename from the db'));
		}
	});
};

const renameFile = (id, newName, callback) => {
	db.get('SELECT * FROM files WHERE id = ?', id, (error, row) => {
		if (row && row.filename) {
			db.run('UPDATE files SET filename = ? WHERE id = ?', [ newName, id ], (err) => {
				if (err) return callback(err);
				fs.rename(
					path.join(config.UPLOAD_DIRECTORY, row.filename),
					path.join(config.UPLOAD_DIRECTORY, newName), (nameerror) => {
						row.filename = newName;
						callback(nameerror, row);
					}
				);
			});
		} else {
			return callback(new Error('Failed to get the filename from the db'));
		}
	});
};

const createOrGetUser = (user, callback) => {
	db.all('SELECT * FROM users', [], (err, rows) => {
		if (err) console.error('A problem occurred getting the user!');
		if (typeof user.kind !== 'undefined') {
			user.provider = 'google';
			user.username = user.emails[0].value;
			user.profileUrl = user.url;
			user.id = parseInt(user.id.toString().substr(user.id.toString().length - 15),10)
		}
		if (typeof rows === 'undefined' || rows === null || rows.length === 0) {
		// If this is the first user, give them all permissions
			db.run(
				'INSERT INTO users (id, provider, username, displayName, profileUrl, permissions) VALUES (?, ?, ?, ?, ?, ?)',
				[ user.id, user.provider, user.username, user.displayName, user.profileUrl, '*' ]
			);
			user.permissions = '*';
			return callback(user);
		}
		// If the user is already in the DB return that one, otherwise create one with no permissions
		for (let i = 0; i < rows.length; i++) {
			if (rows[i].id === user.id) return callback(rows[i]);
		}
		db.run(
			'INSERT INTO users (id, provider, username, displayName, profileUrl, permissions) VALUES (?, ?, ?, ?, ?, ?)',
			[ user.id, user.provider, user.username, user.displayName, user.profileUrl, '' ]
		);
		user.permissions = '';
		callback(user);
	});
};

const getAllUsers = (callback) => {
	db.all('SELECT * FROM users', [], callback);
};

const setUserPermissions = (id, permissions, callback) => {
	db.run('UPDATE users SET permissions = ? WHERE id = ?', [ permissions, id ], callback);
};

const toObject = (array) =>
	array.reduce((o, v, i) => {
		o[i] = v;
		return o;
	}, {});

const fileFilter = (req, file, cb) => {
	let found = false;
	let error = null;
	config.BANNED_EXTS.forEach((ext) => {
		if (file.originalname.toLowerCase().endsWith(ext)) {
			found = true;
			error = new Error('File \'' + file.originalname + '\' uses a banned extension.');
			error.status = 403;
		}
	});

	return cb(error, !found);
};

const ensureAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/admin/login');
};

exports = module.exports;
exports.reverse = reverse;
exports.toObject = toObject;
exports.fileFilter = fileFilter;
exports.generate_name = generate_name;
exports.ensureAuthenticated = ensureAuthenticated;
exports.createOrGetUser = createOrGetUser;
exports.getAllUsers = getAllUsers;
exports.getDatabase = () => db;
exports.getUploads = getUploads;
exports.renameFile = renameFile;
exports.deleteFile = deleteFile;
exports.setUserPermissions = setUserPermissions;
