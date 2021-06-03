const ejs = require('ejs');
const { dirname, resolve } = require('path');
const {
    createReadStream,
    readFileSync,
    existsSync,
    mkdirSync,
    writeFileSync,
} = require('fs');
const insertLine = require('insert-line');
const dir = process.cwd();
const requireFile = `${resolve(dir, 'testcucumbr.conf')}`;
const config = require(requireFile);

/**
 * Add new step by position
 *
 * @param {string} src
 * @param {string} step
 * @param {number} position
 */
function addStep(src, step, position) {
    insertLine(src)
        .contentSync('\n' + step.snippet + '\n')
        .at(position);
    readFileSync(src, 'utf8');
}

/**
 * Get position to insert
 * @typedef {Object} step
 * @property {string} step.snippet - snippet code.
 * @param {string} src
 * @param {Array<string>} lines
 * @param {Object.<string, step>} steps
 * @return {Promise}
 */
async function insert(src, steps) {
    if (typeof src !== 'string' || src === null) {
        reject('src parameter must be a string');
    }

    if (typeof steps !== 'object' || steps === null) {
        reject('steps parameter must be a step object');
    }

    if (Object.keys(steps).length === 0) return;
    const data = await getData(src);
    const lines = data.split(/\r?\n/);
    let line = '';
    let step = '';
    let lineCount = 0;
    let counter = 0;

    for (let index = 0; index < lines.length; index++) {
        line = lines[index];
        if (isEndFunc(line)) {
            lineCount = index + 1;
            if (steps[counter]) {
                const stepLine = lineCount + 1;
                step = steps[counter];
                delete steps[counter];
                addStep(src, step, stepLine);
                insert(src, steps);
            } else if (steps[counter - 1]) {
                const stepLine = 2;
                counter = counter - 1;
                step = steps[counter];
                delete steps[counter];
                addStep(src, step, stepLine);
                insert(src, steps);
            } else {
                counter++;
            }
        }
    }
}

/**
 *  Check if it is the final line of the function
 * @param {string} line
 * @returns {boolean}
 */
function isEndFunc(line) {
    const END_FUNC = /(^(!^\s+)?(}\);))/;
    const regexLine = new RegExp(END_FUNC, 'gim');
    const result = line.match(regexLine);
    return result ? true : false;
}

/**
 * Get snippet with key position
 * @typedef {Object} step
 * @property {string} step.snippet - snippet code.
 * @param {Array} steps
 * @returns {Object.<string, step>} snippets
 * @example {'1', snippet: string, '2': snippet: string}
 */
function getSnippets(steps) {
    const snippet = {};
    const snippetsOrder = steps.map((step) => {
        const line = step.featureLines.indexOf(step.line);

        snippet[line - 1] = {
            snippet: step.snippet,
        };
        return snippet;
    });

    const snippets = snippetsOrder[0];
    return snippets;
}

/**
 * Get file content
 *
 * @param {string} src
 * @return {Promise<string>} Data
 */
function getData(src) {
    return new Promise((resolve, reject) => {
        let scenarios;
        const readL = createReadStream(src);
        readL
            .on('data', (data) => {
                scenarios = data;
            })
            .on('close', () => resolve(scenarios.toString()))
            .on('error', (err) => reject(err));
    });
}

/**
 * Include new steps
 * @param {string} destSrc
 * @param {Object<Array>}  scenario
 */
function update(destSrc, scenario) {
    const snippets = getSnippets(scenario.steps);
    insert(destSrc, snippets);
}

/**
 *
 * @param {string} templateFile
 * @param {string} destSrc
 * @param {Array} steps
 */
function copy(templateFile, destSrc, steps) {
    const dir = dirname(destSrc);
    const tmp = readFileSync(templateFile);

    steps = config && config.arrow ? convertArrow(steps) : steps;
    const result = ejs.render(tmp.toString(), steps, {
        filename: templateFile,
    });

    if (!existsSync(destSrc)) {
        mkdirSync(dir, { recursive: true });
        writeFileSync(destSrc, result, { encoding: 'utf-8' });
        return;
    }

    const file = readFileSync(destSrc);
    file.length === 0
        ? writeFileSync(destSrc, result, { encoding: 'utf-8' })
        : update(destSrc, steps);
}

function convertArrow(data) {
    const removeFunc = new RegExp(/(?!\'|\"),\sfunction/, 'gim');
    const addArrow = new RegExp(/(?<=\))[\s](?=\{)/, 'gim');

    for (let index = 0; index < data.steps.length; index++) {
        data.steps[index].snippet = data.steps[index].snippet
            .replace(removeFunc, ',')
            .replace(addArrow, ' => ');
    }
    return data;
}

module.exports = {
    copy,
};
