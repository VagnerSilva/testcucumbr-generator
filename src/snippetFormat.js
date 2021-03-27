const cucumber = require("@cucumber/cucumber");

module.exports.default = class SnippetsFormatter extends (
    cucumber.SnippetsFormatter
) {
    constructor(options) {
        super(options);
    }

    logSnippets() {
        const scenarios = [];
        let featureLines = [];
        let uri = "";
        let oldUri = "old";

        this.eventDataCollector.getTestCaseAttempts().map((testCaseAttempt) => {
            const parsed = cucumber.formatterHelpers.parseTestCaseAttempt({
                cwd: this.cwd,
                snippetBuilder: this.snippetBuilder,
                supportCodeLibrary: this.supportCodeLibrary,
                testCaseAttempt,
            });

            parsed.testSteps
                .filter((step) => {
                    uri = step.sourceLocation.uri;
                    if (uri !== oldUri) featureLines = [];
                    featureLines.push(step.sourceLocation.line);
                    oldUri = uri;
                    return step.result.status === cucumber.Status.UNDEFINED;
                })
                .forEach((step) => {
                    uri = step.sourceLocation.uri;
                    scenarios.push({
                        snippet: step.snippet,
                        featureLines,
                        uri,
                        line: step.sourceLocation.line,
                    });
                });
        });

        this.log(scenarios);
    }
};
