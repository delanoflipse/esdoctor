const asideSelected = document.querySelector(`[data-tree-index='${doc.raw}']`);
if (asideSelected) {
	asideSelected.classList.add('selected');
	asideSelected.scrollIntoView();
	document.querySelector('aside').scrollTop -= 50;
}

const modeMap = {
	vue: 'vue',
	js: 'javascript',
};

let oldline = 0;
function scrollToLine(editor) {
	if (location.hash && location.hash.startsWith('#line-')) {
		const line = Number(location.hash.substr(6));
		editor.display.wrapper.scrollIntoView();
		editor.scrollIntoView({ line, char: 0 }, 100);
		editor.addLineClass(line - 1, 'background', 'line-highlight');
		if (oldline) {
			editor.removeLineClass(oldline - 1, 'background', 'line-highlight');
		}
		oldline = line;
	}
}

const source = document.querySelector('code.source');
if (source) {
	const text = source.textContent || source.innerText;
	const editor = CodeMirror(
		function(node) {
			source.parentNode.replaceChild(node, source);
		},
		{
			value: text,
			readOnly: true,
			lineNumbers: true,
			mode: modeMap[doc.type],
			viewportMargin: Infinity,
		}
	);

	window.onhashchange = () => scrollToLine(editor);
	scrollToLine(editor);
}

const searchBoxForm = document.getElementById('search-box');
const searchBoxResults = document.querySelector('.search-box-results');
const searchBoxInput = document.querySelector('#search-box input');
let currentResults = [];
document.addEventListener('click', _ => searchBoxResults.classList.add('hide'));
searchBoxForm.addEventListener('click', e => {
	e.preventDefault();
	e.stopPropagation();
});

searchBoxForm.addEventListener('submit', e => {
	e.preventDefault();
	if (currentResults.length > 0) {
		goToSearchItem(currentResults[0]);
	}
});

searchBoxInput.addEventListener('focus', _ => {
	searchBoxResults.classList.remove('hide');
});

searchBoxInput.addEventListener('input', _ => {
	const value = searchBoxInput.value.toLowerCase();
	currentResults = [];

	// clear
	while (searchBoxResults.firstChild) {
		searchBoxResults.removeChild(searchBoxResults.firstChild);
	}

	if (!value) {
		return;
	}

	searchBoxResults.classList.remove('hide');

	const results = searchIndex
		.map(x => {
			const score = x.id.toLowerCase().includes(value) ? value.length / x.id.length : 0;
			x.score = score;
			return x;
		})
		.filter(x => x.score > 0)
		.sort((a, b) => b.score - a.score);

	currentResults = results;

	if (results.length) {
		// add new results
		results.forEach((x, i) => {
			const el = document.createElement('div');

			const idspan = document.createElement('div');
			idspan.className = 'id-index';
			idspan.innerText = x.id;

			const filespan = document.createElement('div');
			filespan.className = 'file-index';
			filespan.innerText = x.file;

			el.className = 'result';

			if (i === 0) {
				el.classList.add('selected');
			}

			el.appendChild(idspan);
			el.appendChild(filespan);
			searchBoxResults.appendChild(el);

			el.onclick = _ => goToSearchItem(x);
		});
	} else {
		const el = document.createElement('div');
		el.innerText = 'No results';
		el.className = 'result';
		searchBoxResults.appendChild(el);
	}
});

const reldir = doc.reldir ? doc.reldir + '/' : '';
function goToSearchItem(x) {
	window.location.href = reldir + x.file + '.html#' + x.id;
}

const links = document.querySelectorAll('a');
links.forEach(a => {
	const href = a.getAttribute('href') || '';
	const parts = href.substr(1).split(/#/g);
	const url = parts[0];
	const hash = parts[1] ? '#' + parts[1] : '';
	if (href.startsWith('/')) {
		a.setAttribute('href', reldir + url + '.html' + hash);
	}
});
