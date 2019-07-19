'use strict'

require('colors');
const fs = require('fs');
const path = require('path').posix;
const ncp = require('ncp').ncp;
const rimraf = require('rimraf');
const genHTML = require('./util/genhtml');
const genCSS = require('./util/gencss');
const parseFile = require('./parsers/file.js');
const generateConfig = require('./util/generateConfig');

const dir = './';

function logSucces(message) {
	console.log(' DONE '.bgGreen.white + ' ' + message);
}

function logInfo(message) {
	console.log(' INFO '.bgYellow.white + ' ' + message);
}

function logError(message) {
	console.log(' ERROR '.bgRed.white + ' ' + message);
}

let config = null;
const files = ['.esdoctor.js', '.esdoctor', '.esdoctor.json'];
for (const file of files) {
	if (fs.existsSync(file)) {
		config = require('./' + file);
		break;
	}
}

if (config === null) {
	logInfo('no config file found, using defaults.');
}

config = generateConfig(config, dir);

function parseAll() {
	if (!config.debug) {
		rimraf.sync(config.exportpath);
	}

	fs.mkdirSync(config.exportpath, { recursive: true });
	fs.mkdirSync(path.join(config.exportpath, '__static__'), { recursive: true });
	logSucces('created documentation folder.');

	genCSS(config);
	logSucces('created css.');

	ncp(path.join(__dirname, 'static'), path.join(config.exportpath, '__static__'), function(err) {
		if (err) {
			logError('failed to move static files!');
			return console.error(err);
		}

		logSucces('moved static file.');
		const arg = recursive(dir || '.');
		logSucces(`parsed ${arg.count} files`);
		writeAll(arg);
		logSucces(`created ${arg.count} files`);
	});
}

function indexDoc(a, ast, f) {
	if (!ast || typeof ast !== 'object' || !ast.id) {
		return;
	}

	a.push({
		id: ast.id,
		file: f,
	});
}

function writeAll({ docs, tree, resolve }) {
	docs.forEach(ctx => {
		const { doc, output, ast, raw } = ctx;
		const dir = output.dir;
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		fs.writeFileSync(
			output.html,
			genHTML({
				ctx,
				config,
				raw,
				docs,
				tree,
				resolve,
				output: output.html,
			})
		);

		fs.writeFileSync(output.json, JSON.stringify(doc, null, 4));
		fs.writeFileSync(output.ast, JSON.stringify(ast, null, 4));
	});

	const index = docs.reduce((a, v) => {
		const f = v.doc.fileraw;
		// index file
		indexDoc(a, { id: v.doc.filename }, f);

		if (['vue', 'js'].indexOf(v.type) > -1) {
			// index file contents
			indexDoc(a, v.doc.default, f);
			v.doc.exports.forEach(ast => indexDoc(a, ast, f));
			v.doc.private.forEach(ast => indexDoc(a, ast, f));
		}
		return a;
	}, []);

	const json = JSON.stringify(index, null, 4);
	fs.writeFileSync(config.exportpath + '/index.json.js', `const searchIndex = ${json};`);
}

// sort dir > file > .md file
function sortFiles(x, y) {
	if (x.dir === y.dir) {
		// unequal extensions.
		if (x.ext === '.md' && y.ext !== '.md') {
			return 1;
		} else if (y.ext === '.md' && x.ext !== '.md') {
			return -1;
		} else {
			return x.file.localeCompare(y.file);
		}
	} else {
		// sort by dir
		return x.dir ? 1 : -1;
	}
}

function recursive(p, resolve = {}, total = 0) {
	const files = fs.readdirSync(p);
	const arr = [];
	const tree = {};
	let count = total;

	files
		.map(f => {
			const pth = path.join(p, f);
			const ext = path.extname(pth);
			return {
				pth,
				file: f,
				ext,
				dir: fs.lstatSync(pth).isDirectory(),
			};
		})
		.sort(sortFiles)
		.forEach(({ pth, file, dir }) => {
			const f = file;
			if (config.ignore.has(file)) {
				return;
			}

			if (dir) {
				const rec = recursive(pth, resolve);
				count += rec.count;
				tree[f] = {
					name: pth,
					isDir: true,
					isRoot: false,
					docs: rec.docs,
					children: rec.tree,
				};

				arr.push(...rec.docs);
				return;
			}

			if (!/(\.vue|\.js|\.md)$/.test(f)) {
				return;
			}

			const ctx = parseFile(pth, config);
			count++;
			arr.push(ctx);
			resolve[ctx.doc.fileraw.trim()] = ctx.doc;
			tree[f] = {
				name: f,
				isDir: false,
				isRoot: false,
				ctx,
			};
		});

	tree.docs = arr;

	return {
		docs: arr,
		tree,
		resolve,
		count,
	};
}

parseAll();
