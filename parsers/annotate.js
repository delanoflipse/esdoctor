const showdown = require('showdown');
const markdown = new showdown.Converter();
const commentParser = require('./comment');

// flat reduce
const reducer = (acc, val) => (Array.isArray(val) ? acc.concat(val) : acc);

/**
 * Parse the comment blocks.
 * @param {AST} ast The current AST.
 * @returns {Array} Array or instance of comments.
 */
function parse(ast) {
	if (!ast) {
		return null;
	}

	if (Array.isArray(ast)) {
		return ast.map(parse);
	}

	if (ast.type === 'CommentBlock') {
		if (ast.value && ast.value[0] === '*') {
			return commentParser(ast.value);
		}
		return ast.value;
	}
}

module.exports = (tree, ast, ctx) => {
	const cmdts = parse(tree.leadingComments, ctx);
	if (!cmdts || !tree || !ast) {
		return ast;
	}

	const comments = cmdts.reduce(reducer, []);

	// Copy loc values for all asts.
	if (tree.loc) {
		ast.loc = tree.loc;
	}

	// Annotate using comment tags.
	comments.forEach(x => {
		if (x.tagName === '@desc') {
			ast.description = markdown.makeHtml(x.tagValue);
			return;
		}

		if (ast.type === 'function' && x.tagName === '@param') {
			const param = ast.params.filter(y => y && y.id === x.label).pop();
			if (param) {
				param.value = param.value || {};
				param.value.type = 'literal';
				param.value.literal = x.param;
				param.value.text = x.value;
			}
		}

		if (ast.type === 'function' && x.tagName === '@returns') {
			ast.returns = {
				type: 'literal',
				literal: x.param,
				text: x.value,
			};
		}

		if (x.tagName === '@override' || x.tagName === '@deprecated') {
			ast.tags = ast.tags || {};
			const tag = x.tagName.substr(1);
			ast.tags[tag] = true;
		}

		if (ast.type === 'cls_variable' && x.tagName === '@type') {
			ast.valuetype = {
				type: 'literal',
				literal: x.param,
				text: x.value,
				value: tree.extra ? tree.extra.raw : null,
			};
		}

		if (x.tagName === '@emits') {
			ast.events = ast.events || [];
			ast.events.push(x);
		}
	});

	// save comments.
	ast.comments = comments;
	return ast;
};
