const { open, closeSync, readFile } = require('fs');

function requireFromString(src, filename) {
    var m = new module.constructor();
    m.paths = module.paths;
    m._compile(src, filename);
    return m.exports;
}

const loadSupportCodePaths = async (supportCodePaths) => {
    return new Promise((resolve, reject) => {
        if (supportCodePaths.length > 0) {
            supportCodePaths.forEach((src, index) => {
                const length = supportCodePaths.length - 1;
                open(src, 'r', (err, fd) => {
                    readFile(fd, (errData, data) => {
                        if (errData || err) reject(errData || err);

                        const file = data.toString();
                        const dataReplace = file.replace(
                            'cypress-cucumber-preprocessor/steps',
                            '@cucumber/cucumber'
                        );

                        requireFromString(dataReplace, '');

                        closeSync(fd);
                        if (length === index) resolve();
                    });
                });
            });
        } else {
            resolve();
        }
    });
};

module.exports = {
    loadSupportCodePaths,
};
