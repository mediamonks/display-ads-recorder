const inquirer = require('inquirer');
const findAdsInDirectory = require('./util/findAdsInDirectory')
const recordAd = require('./util/recordDisplayAd');
const renderVideo = require('./util/renderVideoFromFiles');
const getBackupImage = require('./util/getBackupImage');
const renderGIf = require('./util/renderGifFromVideoFile')
const path = require('path');


module.exports = async function displayAdsRecorder(options) {

    console.log('make sure you import and include the enableAdsRecorder(timeline, config) function from display temple');
    console.log('so the ad can dispatch the right events to the recorder tool')
    console.log('see example here: http://www.github.com/mirkovw/display-record-template');

    const { targetDir } = await inquirer.prompt({
        type: 'input',
        name: 'targetDir',
        message: 'Target Dir?',
        default: './build'
    });

    const allAds = await findAdsInDirectory(targetDir);

    console.log(`found ${allAds.length} ad(s)`);

    const configQuestions = [];
    configQuestions.push({
        type: 'checkbox',
        name: 'location',
        message: 'Please select ad(s) to record:',
        choices: [
            {name: 'all', checked: false},
            ...allAds.map(value => {
                return {
                    value,
                    checked: false,
                };
            }),
        ]
    });

    configQuestions.push({
        type: 'checkbox',
        name: 'output',
        message: 'Please select additional output types (mp4 is done by default):',
        choices: [
            {name: 'gif (animated)', value: 'gif', checked: false},
            {name: 'jpg (last frame)', value: 'jpg', checked: false},
        ]
    });

    configQuestions.push({
        type: 'list',
        name: 'fps',
        message: 'Please select fps to record at',
        choices: [
            {name: 15},
            {name: 30},
            {name: 60},
        ],
        default: 1
    });

    const adSelection = await inquirer.prompt(configQuestions);

    if (adSelection.location.indexOf('all') > -1) {
        adSelection.location = allAds;
    }


    console.log(adSelection);

    for (const ad of adSelection.location) {

        // render screenshots from ad using puppeteer
        const screenshots = await recordAd(ad, adSelection.fps);

        //console.log(`captured ${screenshots.files.length} screenshot(s)`);
        //console.log(`backup image: ${screenshots.baseDir}\\${screenshots.files.slice(-1)}`)

        // convert screenshots to video and place in targetDir
        const outputPathVideo = path.join(targetDir,`${path.basename(path.dirname(ad))}.mp4`)
        const videoFile = await renderVideo(screenshots.baseDir, adSelection.fps, outputPathVideo);
        //console.log(`rendered video: ${path.resolve(videoFile)}`);

        // if gif is selected, convert video to GIF file and place in targetDir
        if (adSelection.output.indexOf('gif') !== -1) {
            const outputPathGif = path.join(targetDir,`${path.basename(path.dirname(ad))}.gif`)
            const animatedGif = await renderGIf(path.resolve(videoFile),outputPathGif);
            //console.log(`rendered animated GIF: ${path.resolve(animatedGif)}`);
            // console.log(animatedGif);
        }

      // if backup img is selected, convert last image from sequence and place in targetDir
      if (adSelection.output.indexOf('jpg') !== -1) {
        const outputPathImg = path.join(targetDir,`${path.basename(path.dirname(ad))}.jpg`)
        const backupImg = await getBackupImage(`${screenshots.baseDir}\\${screenshots.files.slice(-1)}`, outputPathImg);
        console.log(`rendered backup image: ${path.resolve(backupImg)}`);
      }
    }

}
