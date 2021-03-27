const { open, closeSync, readFile } = require("fs");
const { requireFromString } = require("require-from-memory");

const loadSupportCodePaths = async (supportCodePaths) => {
    return new Promise((resolve, reject) => {
        if (supportCodePaths.length > 0) {
            supportCodePaths.forEach((src, index) => {
                const length = supportCodePaths.length - 1;
                open(src, "r", (err, fd) => {
                    readFile(fd, (errData, data) => {
                        if (errData || err) reject(errData || err);

                        const file = data.toString();
                        const dataReplace = file.replace(
                            "cypress-cucumber-preprocessor",
                            "@cucumber/cucumber"
                        );

                        requireFromString(dataReplace);

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
