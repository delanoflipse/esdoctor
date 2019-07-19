const fs = require('fs');
const path = require('path').posix;
const compiler = require('vue-template-compiler');
const parser = require('@babel/parser');
const showdown = require('showdown');
const markdown = new showdown.Converter();
const vueParse = require('./vue');
const parse = require('./parse');

/** Parse a file */
module.exports = (file, args) => {
	// setup paths
	let content = fs.readFileSync(file, 'utf-8');
	const filepath = path.relative('../../', file);

	const dir = path.dirname(file);
	const filename = path.basename(file);
	const relpath = dir.replace(args.basepath, '');
	const writedir = path.join(args.exportpath, relpath);
	const writepath1 = path.join(writedir, `${filename}.html`);
	const writepath2 = path.join(writedir, `${filename}.json`);
	const writepath3 = path.join(writedir, `${filename}.ast.json`);

	// file context
	const context = {
		doc: {
			dependencies: [],
			exports: [],
			default: null,
			private: [],
			filename,
			filenameOnly: path.basename(file, path.extname(file)),
			filedir: dir,
			file: filepath,
			fileraw: file,
			filepath: path.relative('/' + args.basepath, '/' + file),
			references: {},
		},
		output: {
			html: writepath1,
			json: writepath2,
			ast: writepath3,
			dir: writedir,
		},
		offset: 0,
		raw: content,
		args,
		type: 'js',
		ast: null,
		currentPath: path.relative('/' + args.basepath, '/' + file),
	};

	// extract js from template
	if (/\.vue$/.test(file)) {
		const output = compiler.parseComponent(content);
		const start = output.script ? output.script.start : 0;
		const lines = content.substr(0, start).split(/\r?\n/g).length;
		context.offset = lines - 1;
		content = output.script ? output.script.content : '';
		context.type = 'vue';
	}

	if (/\.md$/.test(file)) {
		// parse markdown
		context.type = 'md';
		context.doc.default = markdown.makeHtml(content);
	} else {
		// or es6 javascript
		const ast = parser.parse(content, {
			sourceType: 'module',
			plugins: ['classProperties', 'dynamicImport'],
		});

		context.ast = ast;

		parse(ast, context);
	}

	// save references for dependencies/exports/default exports and private instances.
	context.doc.dependencies.forEach(x => {
		if (!x) return;
		const html = x.path || null;
		if (x.imports && x.imports.default) {
			context.doc.references[x.imports.default.id] = html;
		}

		x.imports.exports.forEach(y => {
			context.doc.references[y.id] = html;
		});
	});

	context.doc.exports.forEach(x => {
		if (!x) return;
		context.doc.references[x.id] = {};
	});

	if (context.doc.default) {
		context.doc.references[context.doc.default.id] = {};
	}

	context.doc.private.forEach(x => {
		if (!x) return;
		context.doc.references[x.id] = {};
	});

	// extra logic for vue files
	if (context.type === 'vue') {
		vueParse(context.doc);
	}

	return context;
};
