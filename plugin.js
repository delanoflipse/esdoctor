const compiler = require('vue-template-compiler');

class ESdocPlugin {
	onHandleConfig(ev) {
		if (!ev.data.config.includes) ev.data.config.includes = [];
		ev.data.config.includes.push('\\.vue$', '\\.js$');
	}

	onHandleCodeParser(ev) {
		const fileName = ev.data.filePath;
		const esParser = ev.data.parser;
		if (/\.vue$/.test(fileName)) {
			ev.data.isVueCode = true;
			// const esParserOption = ev.data.parserOption;
			// const filePath = ev.data.filePath;

			ev.data.parser = code => {
				const output = compiler.parseComponent(code);
				const vueCode = output.script ? output.script.content : '';
				return esParser(vueCode);
			};
		}
	}

	onHandleDocs(ev) {
		const docs = ev.data.docs;
		// const vuedocs = {};

		for (const doc of docs) {
			console.log(doc);
			throw new Error();
		}
	}
}

module.exports = new ESdocPlugin();
