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
    .option('-a, --all', 'If you want to record all', false)
    .option('-j, --jpg [size]', 'If you want to output jpg and optional kbs')
    .addOption(
      new program.Option("-g, --gif [loop]", "If you want to output animated gifs and loop them or play once").choices(['-1', '0'])
    )
    .option("-m, --mp4", "If you want to output video")
    .addOption(
      new program.Option("-f, --fps <data>", "fps for gif and/or mp4").choices(['15', '30', '60'])
    )
    .parse(process.argv);

  const options = program.opts();

  console.log(
    `Welcome to the ${chalk.green.bold(`Display.Monks Record Tool`)} v${packageJson.version}`,
    "make sure you import and include the enableAdsRecorder(timeline, config) function from display temple",
    "so the ad can dispatch the right events to the recorder tool",
    "see example here: http://www.github.com/mirkovw/display-record-template"
  );
  
  const { targetDir } = options.targetDir
  ? options
  : await inquirer.prompt({
    type: "input",
    name: "targetDir",
    message: "Target Dir?",
    default: './build',
  });

  const allAds = await findAdsInDirectory(targetDir);

  console.log(`found ${allAds.length} ad(s)`);
  
  const { location } = options.all
  ? { location: allAds }
  : await inquirer.prompt({
      type: "checkbox",
      name: "location",
      message: "Please select ad(s) to record:",
      validate: (answers) => answers.length > 0,
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

  const outputChoices = [
    { name: "mp4", value: "mp4", checked: false },
    { name: "gif (animated)", value: "gif", checked: false },
    { name: "jpg (last frame)", value: "jpg", checked: false },
  ]

  const { output } = outputChoices.some(e => options[e.value] != undefined)
  ? { output: outputChoices.map(e => e.value).filter(e => options[e] != undefined) }
  : await inquirer.prompt({
      type: "checkbox",
      name: "output",
      message: "Please select output(s)",
      validate: (answers) => answers.length > 0,
      choices: outputChoices
    });

  const { gifLoopOptions } = output.includes("gif")
  ? options.gif != true
    ? { gifLoopOptions: options.gif }
    : await inquirer.prompt({
        type: "list",
        name: "gifLoopOptions",
        message:
          "You selected .gif as additional output. Would you like it run once or loop?",
        choices: [
          { name: "Run once", value: "-1" },
          { name: "Loop", value: "0" },
        ],
        default: 0,
      })
  : { gifLoopOptions: undefined }

  const { fps } = (output.includes("mp4") || output.includes("gif"))
  ? options.fps
    ? options
    : await inquirer.prompt({
        type: "list",
        name: "fps",
        message: "Please select fps to record at",
        choices: [{ name: 15 }, { name: 30 }, { name: 60 }],
        default: 1,
      })
  : { fps: undefined }

  const { jpgMaxFileSize } = output.includes("jpg")
  ? !options.jpg || options.jpg == true // so if no flag at all or flag only
    ? await inquirer.prompt({
        type: "input",
        name: "jpgMaxFileSize",
        message: "Please select max KB filesize for backup image",
        default: 40,
      })
    : { jpgMaxFileSize: options.jpg }
  : { jpgMaxFileSize: undefined }

  const adSelection = {
    output,
    jpgMaxFileSize,
    gifLoopOptions,
    fps,
    location: (options.all || location.indexOf("all") > -1)
      ? allAds
      : location,
  }

  await displayAdsRecorder({
    targetDir,
    adSelection,
  }, options.chunkSize);

})();
