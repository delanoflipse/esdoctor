const fs = require('fs');
const path = require('path');
const stylus = require('stylus');
const cssPath = path.join(__dirname, '../layout/style.styl');

module.exports = args => {
	let cssString = '';
	cssString = fs.readFileSync(cssPath, 'utf-8');

	stylus.render(cssString, { filename: 'style.css' }, function(err, css) {
		if (err) throw err;
		fs.writeFileSync(path.join(args.exportpath, 'static', 'style.css'), css);
	});
};
