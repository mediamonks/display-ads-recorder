const recordAd = require("./util/recordDisplayAd");
const renderVideo = require("./util/renderVideoFromFiles");
const getBackupImage = require("./util/getBackupImage");
const renderGIf = require("./util/renderGifFromVideoFile");
const path = require("path");
const { log } = require("console");

module.exports = async function displayAdsRecorder(options) {
  const { targetDir, adSelection } = options;
  let recordResult = {};

  for (const ad of adSelection.location) {
    // render screenshots from ad using puppeteer
    const screenshots = await recordAd(ad, adSelection.fps);

    // convert screenshots to video and place in targetDir
    const outputPathVideo = path.join(
      targetDir,
      `${path.basename(path.dirname(ad))}.mp4`
    );
    const videoFile = await renderVideo(
      screenshots.baseDir,
      adSelection.fps,
      outputPathVideo
    );
    recordResult.videoPath = outputPathVideo;

    // if gif is selected, convert video to GIF file and place in targetDir
    if (adSelection.output.indexOf("gif") !== -1) {
      const outputPathGif = path.join(
        targetDir,
        `${path.basename(path.dirname(ad))}.gif`
      );
      await renderGIf(
        path.resolve(videoFile),
        outputPathGif,
        adSelection.gifLoopOptions
      );
      recordResult.gifPath = outputPathGif;
    }

    // if backup img is selected, convert last image from sequence and place in targetDir
    if (adSelection.output.indexOf("jpg") !== -1) {
      const outputPathImg = path.join(
        targetDir,
        `${path.basename(path.dirname(ad))}.jpg`
      );
      const backupImg = await getBackupImage(
        `${screenshots.baseDir}/${screenshots.files.slice(-1)}`,
        outputPathImg
      );
      recordResult.jpgPath = outputPathImg;
    }
  }

  console.log("Well done");

  return recordResult;
};
