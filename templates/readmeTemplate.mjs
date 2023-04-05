import data from "./manifest.json" assert { type: "json" };
import Mustache from "mustache";
import fs from "fs";

const capitalize = (str) => {
    const capitalizedStr = str.charAt(0).toUpperCase() + str.slice(1);
    return str.includes("script")
        ? capitalizedStr.split("script")[0] + "Script"
        : capitalizedStr;
};

const getData = () =>
    data.templates.map(({ name, category, label, description, id }) => ({
        brew: "brew install apify/tap/apify-cli",
        npm: "npm -g install apify-cli",
        login: "apify login",
        deploy: "apify push",
        name: name,
        category: category,
        label: label,
        description: description,
        id: id,
        sdkDocsPath: id.includes("ts") || id.includes("js") ? "js" : "python",
        sdkLanguage: capitalize(category),
    }));

const generateReadMe = (id) => {
    const readMeContent = {
        template: getData().find((template) => template.id === id),
    };
    fs.readFile("./readmeTemplate.mustache", (err, content) => {
        if (err) throw err;
        const output = Mustache.render(content.toString(), readMeContent);
        fs.writeFileSync(`./${id}/README.md`, output);
    });
};

getData().forEach((template) => {
    generateReadMe(template.id);
});
