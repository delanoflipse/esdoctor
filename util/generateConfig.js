const path = require('path').posix;

module.exports = (input, dir) => {
    const exp = {
        ignore: new Set([
            '.git',
            '.nuxt',
            'node_modules',
        ]),
        exportpath: path.join(dir, 'docs'),
        debug: false,
        dir,
        currentPath: '',
    }

    if (!input) {
        return exp;
    }

    if (input.ignore && Array.isArray(input.ignore)) {
        input.ignore.forEach(x => exp.ignore.add(x))
    }

    if (input.debug) {
        exp.debug = true;
    }

    if (input.exportpath) {
        exp.exportpath = path.join(dir, input.exportpath);
    }

    exp.ignore.add(exp.exportpath);

    return exp;
}
