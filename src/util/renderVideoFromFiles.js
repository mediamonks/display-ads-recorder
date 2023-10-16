const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = async function renderVideoFromFiles(
  filesPath,
  fps = 30,
  output = "video.mp4"
) {
  const screenshotExt = "jpg";
  const input = `${filesPath}/screenshot_%06d.${screenshotExt}`;

  return new Promise((resolve, reject) => {
    try {
      const process = ffmpeg();
      process.addInput(input);
      process.fpsInput(fps);
      process.fps(fps);
      process.videoBitrate(10000);
      process.output(output);
      process.on("end", () => {
        resolve(output);
      });

      process.run();
    } catch (e) {
      reject(e);
    }
  });
};
