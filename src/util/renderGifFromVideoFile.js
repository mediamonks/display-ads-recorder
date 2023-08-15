const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = async function renderGifFromVideoFile(inputVideo, outputPath, gifLoopOptions) {

  const input = inputVideo;
  const paletteOutput = path.join(path.dirname(outputPath), path.basename(inputVideo, path.extname(inputVideo)), 'temp_palette.png');

  // create pallette
  await new Promise((resolve, reject) => {
    try {
      const process = ffmpeg();
      process.addInput(input);
      process.withOptions([
        '-vf palettegen',
      ])

      process.output(paletteOutput);
      process.on('end', () => resolve())
      process.run();

    } catch (e) {
      reject(e);
    }
  })

  // create gif
  await new Promise((resolve, reject) => {
    try {
      const process = ffmpeg();
      process.addInput(input);
      process.addInput(paletteOutput);

      process.withOptions([
        '-lavfi paletteuse',
        `-loop ${gifLoopOptions}`
      ])
      process.fpsInput(30)
      process.fps(30)
      process.output(outputPath);

      process.on('end', () => {
        resolve()
      })
      process.run();

    } catch (e) {
      reject(e);
    }
  })

  fs.unlinkSync(paletteOutput);

  return outputPath;
}
