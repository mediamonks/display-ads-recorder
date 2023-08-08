const recordAd = require("./util/recordDisplayAd");
const renderVideo = require("./util/renderVideoFromFiles");
const getBackupImage = require("./util/getBackupImage");
const renderGIf = require("./util/renderGifFromVideoFile");
const cliProgress = require("cli-progress");
const path = require("path");
const express = require("express");
const app = express();
const port = 3000;
const { log } = require("console");

// allows to run multiple puppeteers in parallel
process.setMaxListeners(0);

module.exports = async function displayAdsRecorder(options, chunkSize = 10) {
  const { targetDir, adSelection } = options;

  app.use(express.static(targetDir));

  const server = app.listen(port, () => {
    //console.log(`server listening on port ${port}`);
  });

  // should be processed in a sequence
  // if mp4 or gif is selected, record screenshots
  if (
    adSelection.output.includes("mp4") ||
    adSelection.output.includes("gif")
  ) {
    for (const adLocation of adSelection.location) {
      await recordVideoGif(adLocation)
    }
  }

  // can be processed paralelly
  // if backup img is selected, convert last image from sequence and place in targetDir
  if (adSelection.output.includes("jpg")) {
    const startTime = new Date().getTime();
    const progressBar = new cliProgress.SingleBar({
      format:
        "making backup images     [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}",
    }, cliProgress.Presets.shades_classic);
    progressBar.start(adSelection.location.length, 0);

    const resultChunks = splitArrayIntoChunks(adSelection.location, chunkSize);

    for (const [index, resultChunk] of resultChunks.entries()) {
      await Promise.all(resultChunk.map(recordBackup));
      progressBar.update(index * chunkSize + resultChunk.length);
    }
    
    progressBar.stop();
    console.log(`recorded in ${new Date().getTime() - startTime}ms`);
  }
  
  async function recordVideoGif(adLocation) {
    const [url, htmlBaseDirName] = urlFromAdLocation(adLocation);

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
    // if gif is selected, convert video to GIF file and place in targetDir
    if (adSelection.output.includes("gif")) {
      const outputPathGif = path.join(targetDir, `${htmlBaseDirName}.gif`);
      await renderGIf(
        path.resolve(videoFile),
        outputPathGif,
        adSelection.gifLoopOptions
      );
    }
  }

  async function recordBackup(adLocation) {
    const [url, htmlBaseDirName] = urlFromAdLocation(adLocation);

    const outputPathImg = path.join(targetDir, `${htmlBaseDirName}.jpg`);
    await getBackupImage({
      url,
      outputPathImg,
      maxSizeBytes: adSelection.jpgMaxFileSize * 1024,
    });
  }

  server.close();
}

function urlFromAdLocation(adLocation) {
  const htmlBaseDirName = path.basename(path.dirname(adLocation)); // ./build/banner_300x250/index.html > banner_300x250
  return [`http://localhost:${port}/${htmlBaseDirName}`, htmlBaseDirName];
}

function splitArrayIntoChunks(array, chunkSize) {
  return array.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / chunkSize);
    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }
    resultArray[chunkIndex].push(item);
    return resultArray;
  }, []);
}
