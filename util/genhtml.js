const fs = require('fs');
const path = require('path');
const pug = require('pug');

const basedir = path.join(__dirname, '../layout');
const templatePath = path.join(basedir, 'template.pug');

const template = fs.readFileSync(templatePath);
const pugtemplate = pug.compile(template, {
	filename: templatePath,
	basedir,
});

module.exports = x => {
	const { ctx, config, docs, tree, output, resolve, raw } = x;
	const csspath = path.posix.join(config.exportpath, 'docs', 'static', 'style.css');
	const indexpath = path.posix.join(config.exportpath, 'docs', 'index.json.js');
	const jspath = path.posix.join(config.exportpath, 'docs', 'static', 'index.js');
	const imgpath = path.posix.join(config.exportpath, 'docs', 'static', 'logo.png');

	return pugtemplate({
		cssPath: path.posix.relative(output, csspath),
		jsPath: path.posix.relative(output, jspath),
		indexPath: path.posix.relative(output, indexpath),
		vueLogoPath: path.posix.relative(output, imgpath),
		baseUrl: config.exportpath,
		doc: ctx.doc,
		ctx,
		raw,
		docs,
		tree,
		relbaseDir: path.posix.relative('/' + ctx.doc.filedir, '/'),
		relativeUrl(ctxfile, ctxtree) {
			const x = ctxfile.doc.filepath;
			const y = ctxtree.doc.filepath;
			if (x === y) return '#';
			const xdir = path.posix.dirname(x);
			const relative = path.relative('/' + xdir, '/' + y);
			return relative + '.html';
		},
		relativePackage(doc, pth, id = '') {
			if (pth.package) {
				return `https://www.npmjs.com/package/${pth.value}`;
			}

			if (pth.value === undefined) {
				return '#' + id;
			}

			const docdir = doc.filedir;
			const abs = pth.absolute ? pth.value : path.posix.join(docdir, pth.value || '');
			const resdoc =
				resolve[abs] ||
				resolve[abs + '.js'] ||
				resolve[abs + '.vue'] ||
				resolve[abs + '.json'];
			if (!resdoc) {
				return '#';
			}

			return (
				path.relative('/' + docdir, '/' + resdoc.filepath) + '.html' + (id ? '#' + id : '')
			);
		},
		literalValue: {
			NullLiteral: { type: 'null', text: 'null' },
			StringLiteral: { type: 'string', text: 'String' },
			NumericLiteral: { type: 'number', text: 'Number' },
			BooleanLiteral: { type: 'boolean', text: 'Boolean' },
			ArrayExpression: { type: 'array', text: 'Array' },
			ObjectExpression: { type: 'object', text: 'Object' },
			'*': { type: 'any', text: 'Any' },
			AnyLiteral: { type: 'any', text: 'Any' },
		},
	});
};
