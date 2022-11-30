const fs = require("fs");
const glob = require("glob");
const htmlParser = require("node-html-parser");
const path = require("path");

module.exports = async function findAdsInDirectory(targetDir) {
  console.log(`finding all index.html files recursively in ${targetDir}`);

  const allIndexHtmlFiles = await glob.sync(`${targetDir}/**/index.html`);

  const allAds = allIndexHtmlFiles.filter((file) => {
    const rawData = fs.readFileSync(file, "utf8");
    const parsed = htmlParser.parse(rawData);
    if (parsed.querySelectorAll('meta[name="ad.size"]').length > 0) {
      return file;
    }
  });
  return allAds;

  //return allAds.map((adLocation) => path.basename(path.dirname(adLocation)));
};
