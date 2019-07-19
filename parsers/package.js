const path = require('path').posix;

// Parse imports.
module.exports = (value, currentPath, { args }) => {
	const v = value || '';
	const vs = v.split(/\//g);

	// starts with '.'? Then it is a relative import.
	if (vs.indexOf('.') > -1 || vs.indexOf('..') > -1) {
		// set path
		const p = path.relative('/' + args.basepath, '/' + v);

		return {
			path: p,
			value: v,
			raw: v,
			package: false,
			absolute: false,
		};
	}

	// Starts with (@/~)? Then relative to base folder.
	if (vs[0] === '@' || vs[0] === '~') {
		vs.shift();
		return {
			path: path.join(...vs),
			value: vs.join('/'),
			raw: v,
			package: false,
			absolute: true,
		};
	}

	// Otherwise, it is a npm module.
	return {
		path: value,
		value: v,
		package: true,
		absolute: true,
	};
};
