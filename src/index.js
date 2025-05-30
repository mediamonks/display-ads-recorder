const recordAd = require("./util/recordDisplayAd");
const addAudioToVideo = require("./util/addAudioToVideo");
const renderVideo = require("./util/renderVideoFromFiles");
const getBackupImage = require("./util/getBackupImage");
const renderGIf = require("./util/renderGifFromVideoFile");
const cliProgress = require("cli-progress");
const path = require("path");
const express = require("express");
const app = express();
const port = 3000;
const fs = require("fs/promises")
// const { log } = require("console");

// allows to run multiple puppeteers in parallel
process.setMaxListeners(0);

module.exports = async function displayAdsRecorder(options, chunkSize = 10) {
  const { targetDir, adSelection } = options;

  app.use(express.static(targetDir));

  const server = app.listen(port, () => {
    //console.log(`server listening on port ${port}`);
  });
  
  const startTime = new Date().getTime();
  const resultChunks = splitArrayIntoChunks(adSelection.location, chunkSize);
  // if mp4 or gif is selected, record screenshots
  // since nodejs cache can improve performance lets run funtions in sequence
  if (
    adSelection.output.includes("mp4") ||
    adSelection.output.includes("gif")
  ) {
    await runWithChunks(recordScreenshots, "capturing screenshots")

    await runWithChunks(
      recordVideo,
      adSelection.output.includes("mp4")
        ? "making videos"
        : "making videos for GIFs"
    )
    
    if (adSelection.output.includes("gif")) {
      await runWithChunks(recordGif, "making GIFs")
    }

    if (adSelection.output.includes("mp4") && adSelection.audio) {
      await runWithChunks(addAudio, "adding audio track to videos")
    }

    await runWithChunks(clearScreenshots, "clearing tmp files")
  }

  // if backup img is selected, convert last image from sequence and place in targetDir
  if (adSelection.output.includes("jpg")) {
    await runWithChunks(recordBackup, "making backup images")
  }
  
  async function recordScreenshots(adLocation) {
    const [url, htmlBaseDirName] = urlFromAdLocation(adLocation);

    // record screenshots from ad using puppeteer
    await recordAd({
      target: adLocation,
      url,
      fps: adSelection.fps,
    });
  }

  async function recordVideo(adLocation) {
    const [url, htmlBaseDirName] = urlFromAdLocation(adLocation);

    const screenshots = path.join(path.dirname(adLocation), ".cache/screenshots/");

    //render video from screenshots
    const outputPathVideo = path.join(targetDir, `${htmlBaseDirName}.mp4`);
    await renderVideo(
      screenshots,
      adSelection.fps,
      outputPathVideo
    );
  }

  async function recordGif(adLocation) {
    const [url, htmlBaseDirName] = urlFromAdLocation(adLocation);

    // if gif is selected, convert video to GIF file and place in targetDir
    const outputPathGif = path.join(targetDir, `${htmlBaseDirName}.gif`);
    await renderGIf(
      path.join(targetDir, `${htmlBaseDirName}.mp4`),
      outputPathGif,
      adSelection.gifLoopOptions
    );
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

  async function addAudio(adLocation) {
    const [url, htmlBaseDirName] = urlFromAdLocation(adLocation);

    const video = path.join(targetDir, `${htmlBaseDirName}.mp4`)
    const audio = path.join(targetDir, adSelection.audio)
    await addAudioToVideo(
      video,
      audio,
      adSelection.volume
    );
  }

  async function clearScreenshots(adLocation) {
    const screenshots = path.join(path.dirname(adLocation), ".cache/");
    await fs.rm(screenshots, { force: true, recursive: true })
  }

  async function runWithChunks(fn, name) {
    const startTime = new Date().getTime();
    const progressBar = new cliProgress.SingleBar({
      format:
        `${name}${' '.repeat(30 - name.length)}[{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    }, cliProgress.Presets.shades_classic);

    const total = adSelection.location.length;
    progressBar.start(adSelection.location.length, 0);
  
    try {
      for (const [index, resultChunk] of resultChunks.entries()) {
          await Promise.all(resultChunk.map(async (location) => {
              await fn(location);
              progressBar.increment();
          }));
      }
  } catch (error) {
      console.error('\nError:', error);
  } finally {
      progressBar.stop();
  }

  console.log(`done in ${new Date().getTime() - startTime}ms`);
  }

  console.log(`recorded all in ${new Date().getTime() - startTime}ms`);
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
