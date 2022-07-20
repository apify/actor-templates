const fs = require('fs');
const path = require('path');
const Mustache = require('mustache');
const rimraf = require('rimraf');
const { EXAMPLES_DIR_NAME, DIST_DIR_NAME } = require('./consts');

exports.buildExamples = async function () {
    const distDir = path.resolve(__dirname, '..', DIST_DIR_NAME, EXAMPLES_DIR_NAME);
    if (fs.existsSync(distDir)) rimraf.sync(distDir);
    fs.mkdirSync(distDir);

    const examplesDir = path.resolve(__dirname, '..', EXAMPLES_DIR_NAME);
    return fs
        .readdirSync(examplesDir).forEach((exampleDir) => {
            buildExample(exampleDir);
        });
};

function loadExamples(dirname) {
    const dirPath = path.join(__dirname, '../examples', dirname);
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
            const codeFile = path.join(__dirname, '../examples', dirname, filename);
            const code = fs.readFileSync(codeFile, 'utf8');
            const header = '```javascript\n';
            const footer = '```';
            return header + code + footer;
        },
    };
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.substr(1);
}

function buildExample(exampleName) {
    const filename = `${exampleName}.md`;
    const templatePath = path.join(__dirname, '../examples', exampleName, filename);
    const template = fs.readFileSync(templatePath, 'utf8');
    const view = getView(exampleName);
    const partials = {
        ...loadExamples(exampleName),
    };
    const markdown = Mustache.render(template, view, partials);
    const buildFilename = `${exampleName}.md`;
    const buildPath = path.join(__dirname, '../dist/examples', buildFilename);
    console.log(`Creating markdown ${buildFilename}`);
    fs.writeFileSync(buildPath, markdown);
}
