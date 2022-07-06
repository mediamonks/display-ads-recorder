const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const cliProgress = require("cli-progress");
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = async function renderGifFromVideoFile(inputVideo, outputPath, gifLoopOptions) {

  const input = inputVideo;
  const paletteOutput = './build/temp_palette.png';

  const progressBar = new cliProgress.SingleBar({
    format: 'rendering gif            [{bar}] {percentage}%'
  }, cliProgress.Presets.shades_classic);
  progressBar.start(100, 0);

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
  // console.log('created palette')

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

      process.on('progress', (progress) => {
        progressBar.update(Math.round(progress.percentage));
      })
      process.on('end', () => {
        progressBar.stop();
        resolve()
      })
      process.run();

    } catch (e) {
      reject(e);
    }
  })

  return outputPath;
}
