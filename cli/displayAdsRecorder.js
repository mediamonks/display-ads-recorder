#! /usr/bin/env node

const displayAdsRecorder = require("../src/index");
// const jsonParseDeep = require('./src/util/jsonParseDeep');
const program = require("commander");
const chalk = require("chalk");
const packageJson = require("../package.json");
const inquirer = require("inquirer");
const findAdsInDirectory = require("../src/util/findAdsInDirectory");
// const base64 = require("../src/util/base64");

(async () => {
  // program
  //     .version(packageJson.version)
  //     .option('-g, --glob <data>', 'Globbing pattern like "-p ./src/**/.richmediarc"')
  //     .parse(process.argv);
  // const options = program.opts();

  console.log(
    `Welcome to the ${chalk.green.bold(`Display.Monks Record Tool`)} v${
      packageJson.version
    }`
  );

  console.log(
    "make sure you import and include the enableAdsRecorder(timeline, config) function from display temple"
  );
  console.log("so the ad can dispatch the right events to the recorder tool");
  console.log(
    "see example here: http://www.github.com/mirkovw/display-record-template"
  );

  const { targetDir } = await inquirer.prompt({
    type: "input",
    name: "targetDir",
    message: "Target Dir?",
    default: "./build",
  });

  const allAds = await findAdsInDirectory(targetDir);

  console.log(`found ${allAds.length} ad(s)`);

  const configQuestions = [];
  configQuestions.push({
    type: "checkbox",
    name: "location",
    message: "Please select ad(s) to record:",
    choices: [
      { name: "all", checked: false },
      ...allAds.map((value) => {
        return {
          value,
          checked: false,
        };
      }),
    ],
  });

  configQuestions.push({
    type: "checkbox",
    name: "output",
    message: "Please select additional output types (mp4 is done by default):",
    choices: [
      { name: "gif (animated)", value: "gif", checked: false },
      { name: "jpg (last frame)", value: "jpg", checked: false },
    ],
  });

  configQuestions.push({
    type: "list",
    name: "gifLoopOptions",
    message:
      "You selected .gif as additional output. Would you like it run once or loop?",
    when: function (answers) {
      return answers.output.includes("gif");
    },
    choices: [
      { name: "Run once", value: "-1" },
      { name: "Loop", value: "0" },
    ],
    default: 0,
  });

  configQuestions.push({
    type: "list",
    name: "fps",
    message: "Please select fps to record at",
    choices: [{ name: 15 }, { name: 30 }, { name: 60 }],
    default: 1,
  });

  const adSelection = await inquirer.prompt(configQuestions);

  if (adSelection.location.indexOf("all") > -1) {
    adSelection.location = allAds;
  }

  await displayAdsRecorder({
    targetDir,
    adSelection,
  });

  console.log("done");
})();
