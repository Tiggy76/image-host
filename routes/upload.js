'use strict';

const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const cors = require('cors');
const config = require('../config/core');
const util = require('../util/core');

const db = util.getDatabase();
const router = express.Router();

mkdirp(config.UPLOAD_DIRECTORY);

const storage = multer.diskStorage({
	destination(req, file, cb) {
		cb(null, config.UPLOAD_DIRECTORY);
	},
	filename(req, file, cb) {
		util.generate_name(file, db, (name) => {
			cb(null, name);
		});
	}
});

// Override multer default _handleFile to add sha1 hash calculation
storage._handleFile = function _handleFile(req, file, cb) {
	this.getDestination(req, file, (err, destination) => {
		if (err) return cb(err);
		this.getFilename(req, file, (error, filename) => {
			if (err) return cb(err);

			const hash = crypto.createHash('sha1');
			const finalPath = path.join(destination, filename);
			const outStream = fs.createWriteStream(finalPath);

			file.stream.pipe(outStream);
			outStream.on('error', cb);
			outStream.on('data', (data) => {
				hash.update(data);
			});
			outStream.on('finish', () => {
				cb(null, {
					destination,
					filename,
					hash: hash.digest('hex'),
					path: finalPath,
					size: outStream.bytesWritten,
				});
			});
		});
	});
};

// Helper for HTML output
const bytesToSize = (bytes) => {
	const sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB' ];
	if (bytes === 0) return 'n/a';
	const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
	if (i === 0) return bytes + ' ' + sizes[i];
	return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
};


const upload = multer({
	fileFilter: util.fileFilter,
	limits: {
		fileSize: config.MAX_UPLOAD_SIZE
	},
	storage
});

/* Handle CORS pre-flight requests */
router.options('/', cors());

/* POST upload page. */
router.post('/', cors(), upload.array('files[]', config.MAX_UPLOAD_COUNT), (req, res) => {
	const files = [];
	req.files.forEach((file) => {
		db.run('UPDATE files SET size = ? WHERE filename = ?', [ file.size, file.filename ]);
		files.push({
			hash: file.hash,
			mimetype: file.mimetype,
			name: file.originalname,
			size: file.size,
			url: config.FILE_URL + '/' + file.filename,
		});
	});

	const furls = files.map(f => f.url).join('\n');
	if (req.query.output === 'text') {
		// Ensure trailing newline because that's a thing
		res.status(200).send(furls + '\n');
	} else if (req.query.output === 'html') {
		const outfiles = files.map((file) => ({
			hash: file.hash,
			name: file.name,
			size: bytesToSize(file.size),
			thumb: /image.*/.test(file.mimetype) ? file.url : 'images/file.png',
			url: file.url
		}));
		res.status(200).render('output', {
			config,
			files: outfiles,
			title: config.SITE_NAME + ' · ' + config.TAGLINE
		});
	} else {
		res.status(200).json({
			files,
			success: true
		});
	}
});

module.exports = router;
