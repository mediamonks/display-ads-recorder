#! /usr/bin/env node

const displayAdsRecorder = require('../src/index');
// const jsonParseDeep = require('./src/util/jsonParseDeep');
const program = require('commander');
const chalk = require('chalk');
const packageJson = require('../package.json');
// const base64 = require("../src/util/base64");

(async ()=> {
    // program
    //     .version(packageJson.version)
    //     .option('-g, --glob <data>', 'Globbing pattern like "-p ./src/**/.richmediarc"')
    //     .parse(process.argv);
    // const options = program.opts();

    console.log(`Welcome to the ${chalk.green.bold(`Display.Monks Record Tool`)} v${packageJson.version}`);

    await displayAdsRecorder({
        targetDir: './build'
    });
    console.log('done');



})();


