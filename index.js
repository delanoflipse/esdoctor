const fs = require('fs');
const path = require('path').posix;
const winpath = require('path');
const ncp = require('ncp').ncp;
const rimraf = require('rimraf');
const genHTML = require('./util/genhtml');
const genCSS = require('./util/gencss');
const parseFile = require('./parsers/file.js');

const dir = winpath.join(__dirname, '..').replace(/\\/g, '/');
const dir2 = winpath.resolve(process.cwd()).replace(/\\/g, '/');
let basepath = path.relative(dir2, dir);
basepath = basepath ? basepath + '/' : './';

const args = {
	ignore: [
		'.git',
		'.nuxt',
		'node_modules',
		'.eslintrc.js',
		'nuxt.config.js',
		'docs',
		'doc',
		'static',
		'assets',
	],
	exportpath: path.join(basepath, 'docs'),
	basepath,
	debug: true,
	dir,
	currentPath: '',
};

function parseAll() {
	if (!args.debug) {
		rimraf.sync(args.exportpath);
	}

	fs.mkdirSync(args.exportpath, { recursive: true });
	fs.mkdirSync(path.join(args.exportpath, 'static'), { recursive: true });

	genCSS(args);

	ncp(path.join(basepath, 'doc', 'static'), path.join(args.exportpath, 'static'), function(err) {
		if (err) {
			return console.error(err);
		}

		if (args.debug) {
			const arg = recursive(path.join(basepath, 'doc', 'sample'));
			writeAll(arg);
		}

		const arg = recursive(basepath || '.');
		writeAll(arg);
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
				args,
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
	fs.writeFileSync(args.exportpath + '/index.json.js', `const searchIndex = ${json};`);
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

function recursive(p, resolve = {}) {
	const files = fs.readdirSync(p);
	const arr = [];
	const tree = {};

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
			if (args.ignore.indexOf(file) > -1) {
				return;
			}

			if (dir) {
				const rec = recursive(pth, resolve);
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
			const ctx = parseFile(pth, args);
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
	};
}

parseAll();
