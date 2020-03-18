const fs = require('fs');
const path = require('path');
const Mustache = require('mustache');
const { EXAMPLES_DIR_NAME } = require('./consts');

buildAllExamples(EXAMPLES_DIR_NAME);

function buildAllExamples(dirName) {
    const dirPath = path.join(__dirname, dirName);
    try {
        return fs
            .readdirSync(dirPath).forEach( exampleDir => {
                buildExample(exampleDir);
                });
    } catch (err) {
        console.log('No examples found for example directory');
    }
}

function loadExamples(dirname) {
    const dirPath = path.join(__dirname, EXAMPLES_DIR_NAME, dirname);
    try {
        return fs
            .readdirSync(dirPath)
            .reduce((examples, exampleFile) => {
                const exampleName = exampleFile.split('.')[0];
                examples[exampleName] = fs.readFileSync(path.join(dirPath, exampleFile), 'utf8');
                return examples;
            }, {});
    } catch (err) {
        console.log('No examples found for dir: ', dirname);
        return {};
    }
}

function getView(dirname) {
    return {
        name: dirname,
        capitalizedName: dirname.split('-').map(capitalize).join(' '),
        code: () => (filename) => {
            const codeFile = path.join(__dirname, '../', dirname, 'code', filename);
            const code = fs.readFileSync(codeFile, 'utf8');
            const header = '```javascript\n';
            const footer = '```';
            return header + code + footer;
        },
        dontForget: dirname === 'web' ? '(don\'t forget to tick that **Inject jQuery** box)' : '',
        eq1: dirname === 'puppeteer-scraper' ? 'els[1]' : '.eq(1)',
    };
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.substr(1);
}

function buildExample(exampleName) {
    const filename = `${exampleName}.md`;
    const templatePath = path.join(__dirname, EXAMPLES_DIR_NAME, exampleName, filename);
    const template = fs.readFileSync(templatePath, 'utf8');
    const view = getView(exampleName);
    const partials = {
        ...loadExamples(exampleName),
    };
    const markdown = Mustache.render(template, view, partials);
    const buildFilename = `${exampleName}.md`;
    const buildPath = path.join(__dirname, '../build/examples',  buildFilename);
    fs.writeFileSync(buildPath, markdown);
}

