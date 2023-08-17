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
  program
    .version(packageJson.version)
    .option('-c, --chunkSize <data>', 'Define chunkSize', 10)
    .option('-t, --targetDir <data>', 'Set target dir')
    .option('-a, --all', 'If you want to record all')
    .option('-j, --jpg [size]', 'If you want to output jpg and optional kbs')
    .addOption(
      new program.Option("-g, --gif [loop]", "If you want to output animated gifs and loop them or play once").choices(['once', 'loop'])
    )
    .option("-m, --mp4", "If you want to output video")
    .addOption(
      new program.Option("-f, --fps <data>", "fps for gif and/or mp4").choices(['15', '30', '60'])
    )
    .parse(process.argv);

  const options = program.opts();

  console.log(
    `Welcome to the ${chalk.green.bold(`Display.Monks Record Tool`)} v${packageJson.version}`,
    "\nmake sure you import and include the enableAdsRecorder(timeline, config) function from display temple",
    "\nso the ad can dispatch the right events to the recorder tool",
    "\nsee example here: http://www.github.com/mirkovw/display-record-template"
  );
  
  const { targetDir } = options.targetDir
  ? options
  : await inquirer.prompt({
    type: "input",
    name: "targetDir",
    message: "Target Dir?",
    default: "./build",
  });

  const allAds = await findAdsInDirectory(targetDir);

  console.log(`found ${allAds.length} ad(s)`);
  
  const outputChoices = [
    { name: "mp4", value: "mp4", checked: false },
    { name: "gif (animated)", value: "gif", checked: false },
    { name: "jpg (last frame)", value: "jpg", checked: false },
  ]

  const gifLoopOptionsMap = {
    'once': -1,
    'loop': 0
  }

  // data parsed from cli
  const adSelection = {
    location: options.all,
    output: outputChoices.map(e => e.value).filter(e => options[e]),
    gifLoopOptions: gifLoopOptionsMap[options.gif],
    fps: options.fps,
    jpgMaxFileSize: options.jpg
  }

  // inquirer questions
  const questions = [
    {
      type: "checkbox",
      name: "location",
      message: "Please select ad(s) to record:",
      validate: (answers) => answers.length > 0,
      when: !adSelection.location,
      choices: [
        { name: "all", checked: false },
        ...allAds.map((value) => {
          return {
            value,
            checked: false,
          };
        }),
      ],
    },
    {
      type: "checkbox",
      name: "output",
      message: "Please select output(s)",
      validate: (answers) => answers.length > 0,
      when: !adSelection.output.length,
      choices: outputChoices
    },
    {
      type: "list",
      name: "gifLoopOptions",
      message:
        "You selected .gif as additional output. Would you like it run once or loop?",
      choices: [
        { name: "Run once", value: "-1" },
        { name: "Loop", value: "0" },
      ],
      when: answers => (adSelection.output.includes("gif") && adSelection.gifLoopOptions === undefined) || answers.output?.includes("gif"),
      default: 0,
    },
    {
      type: "list",
      name: "fps",
      message: "Please select fps to record at",
      choices: [{ name: 15 }, { name: 30 }, { name: 60 }],
      when: answers => (
          (adSelection.output.includes("gif") || adSelection.output.includes("mp4")) ||
          (answers.output?.includes("gif") || answers.output?.includes("mp4"))
        ) &&
        !adSelection.fps,
      default: 1,
    },
    {
      type: "input",
      name: "jpgMaxFileSize",
      message: "Please select max KB filesize for backup image",
      when: answers => (adSelection.output.includes("jpg") && adSelection.jpgMaxFileSize === true) || answers.output?.includes("jpg"),
      default: 40,
    }
  ]

  const answers = await inquirer.prompt(questions)

  // replace cli data with data from answers
  for (const [key, value] of Object.entries(answers)) {
    if (value) {
      adSelection[key] = value
    }
  }

  if (options.all || adSelection.location.indexOf("all") > -1) {
    adSelection.location = allAds;
  }

  await displayAdsRecorder({
    targetDir,
    adSelection,
  }, options.chunkSize);

})();
