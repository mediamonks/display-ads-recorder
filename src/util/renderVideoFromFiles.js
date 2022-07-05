const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const cliProgress = require('cli-progress');

module.exports = async function renderVideoFromFiles(filesPath, fps = 30, output = 'video.mp4') {
  const screenshotExt = 'png';
  const input = `${filesPath}/screenshot_%06d.${screenshotExt}`

  const progressBar = new cliProgress.SingleBar({
    format: 'rendering video          [{bar}] {percentage}%'
  }, cliProgress.Presets.shades_classic);
  progressBar.start(100, 0);

  return new Promise((resolve, reject) => {
    try {
      const process = ffmpeg();
      process.addInput(input);
      process.fpsInput(fps)
      process.fps(fps)
      process.videoBitrate(10000)
      process.output(output);
      process.on('progress', (progress) => {
        progressBar.update(Math.round(progress.percentage));
      })
      process.on('end', () => {
        progressBar.stop();
        resolve(output)
      })

      process.run();

    } catch (e) {
      reject(e);
    }
  })
}
