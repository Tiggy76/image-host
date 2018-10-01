'use strict';

document.addEventListener('DOMContentLoaded', () => {
	// Get the template HTML and remove it from the doumenthe template HTML and remove it from the doument
	const previewNode = document.querySelector('.template');
	previewNode.id = '';
	previewNode.className = '';
	const previewTemplate = previewNode.parentNode.innerHTML;
	previewNode.parentNode.removeChild(previewNode);

	const post_url = document.querySelector('meta[name="upload-url"]').getAttribute('value') || '';

	const bytesToSize = (bytes) => {
		const sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB' ];
		if (bytes === 0) return 'n/a';
		const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
		if (i === 0) return bytes + ' ' + sizes[i];
		return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
	};

	const fakeFileUpload = (data) => {
		const filename = 'browser-upload-' + new Date().toISOString() + '.txt';
		const boundary = '-boundry';
		const xhr = new XMLHttpRequest();
		const body = '--' + boundary + '\r\n' +
			'Content-Disposition: form-data; name="files[]";' +
			'filename="' + filename + '"\r\n' +
			'Content-type: plain/text\r\n\r\n' +
			data + '\r\n' +
			'--' + boundary + '--';

		xhr.open('POST', post_url + '/upload', true);
		xhr.setRequestHeader('Content-type', 'multipart/form-data; boundary=' + boundary);
		xhr.addEventListener('load', () => {
			const fdata = JSON.parse(this.responseText); /* eslint-disable-line no-invalid-this*/
			let template = document.createElement('div');
			template.innerHTML = previewTemplate;
			template = template.querySelector('.row');
			template.querySelector('.status').classList.add('hidden');
			template.querySelector('.link').classList.remove('hidden');
			if (!fdata.files || fdata.files.length <= 0) return;
			template.querySelector('.link-href').setAttribute('href', fdata.files[0].url);
			template.querySelector('.link-href').innerHTML = fdata.files[0].url;
			template.querySelector('span.name').innerHTML = filename;
			template.querySelector('span.size').innerHTML = bytesToSize(fdata.files[0].size);
			document.querySelector('.container#preview').appendChild(template);
		});
		xhr.send(body);
	};

	const pastebtn = document.querySelector('#paste-button');
	pastebtn.addEventListener('click', () => {
		const wrap = document.querySelector('#paste-wrap');
		if (wrap.classList.contains('hidden')) {
			wrap.classList.remove('hidden');
			pastebtn.innerHTML = 'x';
		} else {
			wrap.classList.add('hidden');
			pastebtn.innerHTML = 'Paste…';
		}
	});
	const submitpastebtn = document.querySelector('button#paste-submit-button');
	submitpastebtn.addEventListener('click', () => {
		const content = document.querySelector('textarea#paste-box').value;
		fakeFileUpload(content);
	});

	function errorHandler(file, response) {
		let message = response;
		if (typeof response !== 'string') ({ message } = response);
		file.previewElement.classList.add('dz-error');
		const _ref = file.previewElement.querySelectorAll('[data-dz-errormessage]');
		const _results = [];
		for (let _i = 0, _len = _ref.length; _i < _len; _i++) {
			const node = _ref[_i];
			_results.push(node.textContent = message);
		}
		return _results;
	}

	const dz = new Dropzone(document.body, { /* eslint-disable-line no-undef*/
		autoQueue: true, // Make sure the files aren't queued until manually added
		clickable: '#upload-button', // Define the element that should be used as click trigger to select files.
		dictFileTooBig: 'Sorry, That file is too big. ({{filesize}}MB > {{maxFilesize}}MB)',
		error: errorHandler,
		maxFilesize: document.querySelector('meta[name="max-up-size"]').getAttribute('value') / 1000000,
		parallelUploads: 20,
		paramName: 'files[]',
		previewsContainer: '#preview', // Define the container to display the previews
		previewTemplate,
		thumbnailHeight: 60,
		thumbnailWidth: 60,
		url: post_url + '/upload' // Set the url
	});

	dz.on('addedfile', (file) => {
		file.previewElement.querySelector('.remove').onclick = () => {
			dz.removeFile(file);
		};
	});

	dz.on('sending', () => {
		// Show the total progress bar when upload starts
		document.querySelector('.file-progress').style.opacity = '1';
	});

	dz.on('complete', (file) => {
		file.previewElement.querySelector('.status').classList.add('hidden');

		if (!file.xhr || !file.xhr.response) return;
		const data = JSON.parse(file.xhr.response);
		if (!data.files || data.files.length <= 0) return;
		file.previewElement.querySelector('.link').classList.remove('hidden');
		file.previewElement.querySelector('.link-href').setAttribute('href', data.files[0].url);
		file.previewElement.querySelector('.link-href').innerHTML = data.files[0].url;
	});

	dz.on('uploadprogress', (file, progress) => {
		file.previewElement.querySelector('.file-progress .progress-inner').style.width = progress + '%';
	});
});
