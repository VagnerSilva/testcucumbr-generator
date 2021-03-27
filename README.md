# testcucumbr-generator

Generates steps for **[cypress-cucumber-preprocessor](https://github.com/TheBrainFamily/cypress-cucumber-preprocessor/blob/master/README.md)** and **[@cucumber/cucumber](https://github.com/cucumber/cucumber-js/blob/master/README.md)**

# Installation

```bash
npm i testcucumbr-generator

yarn add testcucumbr-generator

pnpm i testcucumbr-generator
```

# Configuration

Create the **testcucumbr.conf.js** file at the root of the project.

| Option         | Default value | Description                                                                                                              | type     |
| -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------ | -------- |
| featurePath    | -             | Define the path to a folder containing all **'.features'** files                                                         | required |
| defaultDialect | **en**        | Define the default language used. You can see more languages ​​in [gherkin](https://cucumber.io/docs/gherkin/languages/) | optional |
| type           | **cypress**   | Define the model type. **'cypress'** or **'cucumber'**                                                                   | optional |
| formatFile     | **js**        | Define the format file. **'js'** or **'ts'**                                                                             | optional |

# Examples

```javascript
// testcucumbr.conf.js

module.exports = {
    type: "cypress",
    formatFile: "js",
    featurePaths: "./crypress/integration/features",
    defaultDialect: "pt",
};
```

```gherkin
# language: pt

Funcionalidade: Pesquisando no Google

    Cenário: Pesquisa simples no Google
    Dado que um navegador da web está na página do Google
    Quando a frase de pesquisa "panda" é inserida
    Então os resultados para "panda" são mostrados
```

Execute the command
**.\node_modules\\.bin\testcucumbr**

```javascript
const { Given, When, Then } = require("cypress-cucumber-preprocessor");

Given("que um navegador da web está na página do Google", function () {
    // Write code here that turns the phrase above into concrete actions
    return "pending";
});

When("a frase de pesquisa {string} é inserida", function (string) {
    // Write code here that turns the phrase above into concrete actions
    return "pending";
});

Then("os resultados para {string} são mostrados", function (string) {
    // Write code here that turns the phrase above into concrete actions
    return "pending";
});
```
