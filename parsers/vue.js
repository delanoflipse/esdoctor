module.exports = function vueParse(doc) {
	if (doc.default && doc.default.type === 'literal' && doc.default.literal === 'ObjectExpression') {
		const valueMap = {
			events: doc.default.events || undefined,
		};
		doc.default.value.forEach(x => {
			valueMap[x.id] = vueparsers[x.id] ? vueparsers[x.id](x) : x;
		});
		doc.default.value = valueMap;
	}
};

const vueparsers = {
	middleware: ast => {
		return ast.value && Array.isArray(ast.value.value) ? ast.value.value : [ast.value];
	},
	props: ast => {
		return (
			ast.value &&
			ast.value.value &&
			ast.value.value.map(prop => {
				if (prop.value && prop.value.type === 'literal' && prop.value.literal === 'ObjectExpression') {
					const vueprop = {
						id: prop.id,
						type: null,
						default: null,
						comments: prop.comments,
						description: prop.description,
					};

					prop.value.value.forEach(attr => {
						if (attr.id === 'type') {
							vueprop.type = attr;
						} else if (attr.id === 'default') {
							vueprop.default = attr;
						}
					});

					return vueprop;
				}

				return prop;
			})
		);
	},
};
