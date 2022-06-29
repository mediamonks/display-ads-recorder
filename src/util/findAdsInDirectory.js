const fs = require('fs');
const glob = require('glob')
const htmlParser = require('node-html-parser');

module.exports = async function findAdsInDirectory(targetDir) {
    console.log(`finding all index.html files recursively in ${targetDir}`);

    const allIndexHtmlFiles = await glob.sync(`${targetDir}/**/index.html`);
    return allIndexHtmlFiles.filter(file => {
        const rawData = fs.readFileSync(file, 'utf8');
        const parsed = htmlParser.parse(rawData);
        if (parsed.querySelectorAll('meta[name="ad.size"]').length > 0) {
            return file;
        }
    })
}
