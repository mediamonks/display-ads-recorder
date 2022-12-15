const recordAd = require("./util/recordDisplayAd");
const renderVideo = require("./util/renderVideoFromFiles");
const getBackupImage = require("./util/getBackupImage");
const renderGIf = require("./util/renderGifFromVideoFile");
const path = require("path");
const express = require("express");
const app = express();
const port = 3000;
const { log } = require("console");

module.exports = async function displayAdsRecorder(options) {
  const { targetDir, adSelection } = options;
  let recordResult = {};

  app.use(express.static(targetDir));

  const server = app.listen(port, () => {
    //console.log(`server listening on port ${port}`);
  });

  for (const adLocation of adSelection.location) {
    const htmlBaseDirName = path.basename(path.dirname(adLocation)); // ./build/banner_300x250/index.html > banner_300x250
    const url = `http://localhost:${port}/${htmlBaseDirName}`;

    // if mp4 or gif is selected, record screenshots

    if (
      adSelection.output.includes("mp4") ||
      adSelection.output.includes("gif")
    ) {
      // record screenshots from ad using puppeteer
      const screenshots = await recordAd({
        target: adLocation,
        url,
        fps: adSelection.fps,
      });

      //render video from screenshots
      const outputPathVideo = path.join(targetDir, `${htmlBaseDirName}.mp4`);
      const videoFile = await renderVideo(
        screenshots.baseDir,
        adSelection.fps,
        outputPathVideo
      );
      recordResult.videoPath = outputPathVideo;

      // if gif is selected, convert video to GIF file and place in targetDir
      if (adSelection.output.includes("gif")) {
        const outputPathGif = path.join(targetDir, `${htmlBaseDirName}.gif`);
        await renderGIf(
          path.resolve(videoFile),
          outputPathGif,
          adSelection.gifLoopOptions
        );
        recordResult.gifPath = outputPathGif;
      }
    }

    // if backup img is selected, convert last image from sequence and place in targetDir
    if (adSelection.output.includes("jpg")) {
      const outputPathImg = path.join(targetDir, `${htmlBaseDirName}.jpg`);
      await getBackupImage({
        url,
        outputPathImg,
        maxSizeBytes: adSelection.jpgMaxFileSize * 1024,
      });
      recordResult.jpgPath = outputPathImg;
    }
  }

  server.close();

  return recordResult;
};
