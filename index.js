const { resolve, join, dirname } = require('path');
const { loadSupportCodePaths } = require('./src/loadPaths');
const glob = require('glob');
const { EventEmitter } = require('events');
const {
    Runtime,
    formatterHelpers,
    FormatterBuilder,
    parseGherkinMessageStream,
    supportCodeLibraryBuilder,
    Cli,
    PickleFilter,
} = require('@cucumber/cucumber');
const gherkin = require('gherkin').default;
const { IdGenerator } = require('@cucumber/messages');
const fs = require('./src/managerFile');

const dir = process.cwd();
const requireFile = `${resolve(dir, 'testcucumbr.conf')}`;
const config = require(requireFile);

const output = (snippetData) => {
    if (typeof snippetData === 'undefined') return;
    const format = config.formatFile
        ? `_spec.${config.formatFile}`
        : '_spec.js';

    const snippetsByFile = snippetData.reduce((steps, step) => {
        const uri = step.uri;
        if (typeof steps[uri] === 'undefined') steps[uri] = [];

        steps[uri].push(step);

        return steps;
    }, {});

    for (const file in snippetsByFile) {
        const folderRegex = new RegExp(/(.+)(?=\.feature)/, 'gim');
        const fileRegex = new RegExp(/[^\\]*(?=\.feature)/, 'gim');
        const folder = join(process.cwd(), file.match(folderRegex)[0]);
        const filename =
            file.replace(/(\/)/g, '\\').match(fileRegex)[0] + `_steps${format}`;
        const destSrc = join(folder, filename);
        const template =
            config.type.toLowerCase() === 'cypress'
                ? __dirname + '/src/template.ejs'
                : __dirname + '/src/template-c.ejs';

        fs.copy(template, destSrc, {
            steps: snippetsByFile[file],
        });
    }
};

async function Generator() {
    process.argv.push(config.featurePath);
    const cli = new Cli({
        argv: process.argv,
        cwd: dir,
        stdout: process.stdout,
    });

    /**
     *  locale file from the user input
     *  default {*.feature, *.features,!(node_modules)}
     */
    const featurePaths = await new Promise((resolve, reject) => {
        const featureSearch = `${config.featurePath}/{*.feature, *.features,!(node_modules)/**/*.feature}`;
        glob(featureSearch, (error, matches) => {
            if (error) reject(error);
            resolve(matches);
        });
    });

    const eventBroadcaster = new EventEmitter();
    const eventDataCollector = new formatterHelpers.EventDataCollector(
        eventBroadcaster
    );

    const newId = IdGenerator.uuid();
    const configuration = await cli.getConfiguration();
    const supportCodePaths = configuration.supportCodePaths;
    // const supportCodeRequiredModules = configuration.supportCodeRequiredModules;
    // supportCodeRequiredModules.map((module) => require(module));
    supportCodeLibraryBuilder.reset(dir, newId);
    await loadSupportCodePaths(supportCodePaths);
    supportCodeLibrary = await supportCodeLibraryBuilder.finalize();

    const gherkinMessageStream = gherkin.fromPaths(featurePaths, {
        newId,
        defaultDialect: config.defaultDialect ? config.defaultDialect : 'en',
        includePickles: true,
        includeGherkinDocument: true,
        includeSource: true,
    });

    const pickleIds = await parseGherkinMessageStream({
        cwd: dir,
        eventBroadcaster,
        eventDataCollector,
        gherkinMessageStream,
        order: 'defined',
        pickleFilter: new PickleFilter({
            cwd: dir,
            featurePaths: featurePaths,
        }),
    });

    const formatterOptions = {
        parsedArgvOptions: {
            colorsEnabled: false,
        },
        cwd: dir,
        eventBroadcaster,
        eventDataCollector,
        log: output.bind(this),
        supportCodeLibrary,
        clean: async () => await Promise.resolve(),
    };

    FormatterBuilder.build(
        __dirname + '/src/snippetFormat.js',
        formatterOptions
    );

    const runtime = new Runtime({
        eventBroadcaster,
        eventDataCollector,
        options: {
            filterStacktraces: true,
            predictableIds: true,
        },
        newId,
        pickleIds,
        supportCodeLibrary,
    });

    runtime.start().catch((error) => {
        throw error;
    });
    // cli.run();
}

Generator();
