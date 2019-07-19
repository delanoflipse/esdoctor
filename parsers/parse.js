const exportPathParser = require('./package');
const annotate = require('./annotate');

function asParams(params) {
	return params.map(x => {
		if (typeof x === 'string') {
			return {
				id: x,
				value: {
					type: 'literal',
					literal: 'AnyLiteral',
				},
			};
		}
		return x;
	});
}

function parse(ast, ctx) {
	if (!ast) {
		return null;
	}

	if (Array.isArray(ast)) {
		return ast.map(x => parse(x, ctx));
	}

	switch (ast.type) {
		// --- FILE ENTRY ---
		case 'File':
			return parse(ast.program, ctx);
		case 'Program':
			const values = ast.body.map(x => parse(x, ctx)).filter(x => !!x);
			ctx.doc.private = values;
			break;

		// --- IMPORTS ---
		case 'ImportDeclaration':
			const imp = parse(ast.specifiers, ctx);
			const imports = {
				default: null,
				exports: [],
			};
			imp.forEach(x => {
				if (!x) return;
				if (x.default) {
					imports.default = x;
				} else {
					imports.exports.push(x);
				}
			});
			ctx.doc.dependencies.push({
				path: exportPathParser(ast.source.value, ctx.currentPath, ctx),
				imports,
			});
			break;
		case 'ImportDefaultSpecifier':
			return {
				id: parse(ast.local, ctx),
				default: true,
			};
		case 'ImportSpecifier':
			return {
				id: parse(ast.local, ctx),
				default: false,
			};

		// --- EXPORTS ---
		case 'ExportDefaultDeclaration':
			ctx.doc.default = annotate(ast, parse(ast.declaration, ctx), ctx);
			return;
		case 'ExportNamedDeclaration':
			// todo: var -> function
			const namedDecValue = parse(ast.declaration, ctx);
			ctx.doc.exports.push(annotate(ast, namedDecValue, ctx));
			return;

		// --- VARIABLES ---
		case 'VariableDeclarator':
			const varDecValue = parse(ast.init, ctx);
			if (varDecValue) {
				varDecValue.id = parse(ast.id, ctx);
			}
			return annotate(ast, varDecValue, ctx);
		case 'VariableDeclaration':
			const decValues = parse(ast.declarations, ctx);
			if (decValues.length === 0) {
				return null;
			}

			if (decValues.length === 1) {
				const val = decValues.pop();
				if (val) {
					val.const = ast.kind === 'const';
				}
				return annotate(ast, val, ctx);
			}

			return annotate(
				ast,
				{
					type: 'variables',
					const: ast.kind === 'const',
					loc: ast.loc,
					decValues: parse(ast.declarations, ctx),
				},
				ctx
			);

		// --- CLASSES ---
		case 'ClassDeclaration':
			return annotate(
				ast,
				{
					type: 'class',
					loc: ast.loc,
					id: parse(ast.id, ctx),
					superClass: parse(ast.superClass, ctx),
					body: ast.body.body.map(x => annotate(x, parse(x, ctx), ctx)),
				},
				ctx
			);
		case 'ClassProperty':
			return annotate(
				ast,
				{
					type: 'cls_variable',
					id: parse(ast.key, ctx),
					valuetype: parse(ast.value, ctx),
					loc: ast.loc,
				},
				ctx
			);

		// --- (ANONYMOUS) OBJECTS ---
		case 'ObjectExpression':
			return annotate(
				ast,
				{
					type: 'literal',
					loc: ast.loc,
					id: parse(ast.id, ctx),
					literal: ast.type,
					value: parse(ast.properties, ctx),
				},
				ctx
			);
		case 'ObjectProperty':
			return annotate(
				ast,
				{
					id: parse(ast.key, ctx),
					type: 'literal',
					value: parse(ast.value, ctx),
					loc: ast.loc,
				},
				ctx
			);

		// --- LITERALS & IDS ---
		case 'Identifier':
			return ast.name;
		case 'StringLiteral':
		case 'NumericLiteral':
			return {
				type: 'literal',
				literal: ast.type,
				value: ast.extra.raw,
				content: ast.extra.rawValue,
			};
		case 'NullLiteral':
			return {
				type: 'literal',
				literal: ast.type,
				value: 'null',
			};
		case 'BooleanLiteral':
			return {
				type: 'literal',
				literal: ast.type,
				value: String(ast.value),
			};
		case 'ArrayExpression':
			return {
				type: 'literal',
				loc: ast.loc,
				literal: ast.type,
				value: parse(ast.elements),
			};

		// --- FUNCTIONS ---
		case 'ClassMethod':
		case 'ObjectMethod':
		case 'FunctionDeclaration':
		case 'ArrowFunctionExpression':
			return annotate(
				ast,
				{
					type: 'function',
					static: Boolean(ast.static),
					async: Boolean(ast.async),
					loc: ast.loc,
					id: parse(ast.key, ctx) || parse(ast.id, ctx),
					params: asParams(parse(ast.params, ctx)),
					returns: {
						type: 'literal',
						literal: 'Any',
					},
					tags: {},
				},
				ctx
			);

		// --- PATTERNS ---
		case 'AssignmentPattern':
			return {
				id: parse(ast.left, ctx),
				value: parse(ast.right, ctx),
			};
		case 'ObjectPattern':
			return {
				id: null,
				value: {
					id: null,
					type: 'ObjectExpression',
					literal: ast.type,
					value: parse(ast.properties, ctx),
				},
			};

		default:
			return null;
	}
}

module.exports = parse;
