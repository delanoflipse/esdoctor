// Source: https://github.com/esdoc/esdoc/blob/master/src/Parser/CommentParser.js

const paramRegx = /{\(?([*a-zA-Z0-9<>| ]*)\)?} (\S+)( *.*)/i;
const emitsRegx = /(\S+)( *.*)/i;
const typeRegx = /{\(?([*a-zA-Z0-9<>| ]*)\)?}/;
const returnsRegx = /{\(?([*a-zA-Z0-9<>| ]*)\)?}( *.*)/;

/** split type tags with in the format {type1|type2 | type3} */
const getTypes = param => {
	return param.split(/\W*\|\W*/g);
};

/** extra logic for some tags */
const mapper = {
	'@param': tag => {
		const match = paramRegx.exec(tag.tagValue);
		if (!match) return tag;
		const param = getTypes(match[1].trim());

		return {
			tagName: tag.tagName,
			tagValue: tag.tagValue,
			param,
			label: match[2],
			value: match[3].trim(),
		};
	},
	'@type': tag => {
		const match = typeRegx.exec(tag.tagValue);
		if (!match) return tag;
		const param = getTypes(match[1].trim());

		return {
			tagName: tag.tagName,
			tagValue: tag.tagValue,
			param,
		};
	},
	'@emits': tag => {
		const match = emitsRegx.exec(tag.tagValue);
		if (!match) return tag;
		const label = match[1].trim();
		const value = match[2].trim();

		return {
			tagName: tag.tagName,
			tagValue: tag.tagValue,
			label,
			value,
		};
	},
	'@return': tag => {
		tag.tagName = '@returns';
		return mapper['@returns'](tag);
	},
	'@returns': tag => {
		const match = returnsRegx.exec(tag.tagValue);
		if (!match) return tag;
		const param = getTypes(match[1].trim());
		const value = match[2].trim();

		return {
			tagName: tag.tagName,
			tagValue: tag.tagValue,
			param,
			value,
		};
	},
};

/** Parse a comment block */
module.exports = cmt => {
	let comment = cmt;
	comment = comment.replace(/\r\n/gm, '\n'); // for windows
	comment = comment.replace(/^[\t ]*/gm, ''); // remove line head space
	comment = comment.replace(/^\*[\t ]?/, ''); // remove first '*'
	comment = comment.replace(/[\t ]$/, ''); // remove last space
	comment = comment.replace(/^\*[\t ]?/gm, ''); // remove line head '*'
	if (comment.charAt(0) !== '@') comment = `@desc ${comment}`; // auto insert @desc
	comment = comment.replace(/[\t ]*$/, ''); // remove tail space.
	comment = comment.replace(/```[\s\S]*?```/g, match => match.replace(/@/g, '\\ESCAPED_AT\\')); // escape code in descriptions
	comment = comment.replace(/^[\t ]*(@\w+)$/gm, '$1 \\TRUE'); // auto insert tag text to non-text tag (e.g. @interface)
	comment = comment.replace(/^[\t ]*(@\w+)[\t ](.*)/gm, '\\Z$1\\Z$2'); // insert separator (\\Z@tag\\Ztext)

	const lines = comment.split('\\Z');

	let tagName = '';
	let tagValue = '';
	const tags = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line.charAt(0) === '@') {
			tagName = line;
			const nextLine = lines[i + 1];
			if (nextLine.charAt(0) === '@') {
				tagValue = '';
			} else {
				tagValue = nextLine;
				i++;
			}
			tagValue = tagValue
				.replace('\\TRUE', '')
				.replace(/\\ESCAPED_AT\\/g, '@')
				.replace(/^\n/, '')
				.replace(/\n*$/, '');
			tags.push({ tagName, tagValue });
		}
	}

	return tags.map(x => (mapper[x.tagName] ? mapper[x.tagName](x) : x));
};
