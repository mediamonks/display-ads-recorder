const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path
const ffmpeg = require("fluent-ffmpeg")
const fs = require('fs/promises')
ffmpeg.setFfmpegPath(ffmpegPath)

module.exports = async function addAudioToVideo(
  video,
  audio,
  volume = 1
) {
  const output = video.replace('.mp4', '-audio.mp4')

  return new Promise((resolve, reject) => {
    ffmpeg()
      .addInput(video)
      .addInput(audio)
      .withOptions([
        `-af volume=${volume}`,
        // '-filter:a loudnorm' // normalize audio volume
      ])
      .output(output)
      .outputOptions([
        '-map 0:v',
        '-map 1:a',
        '-c:v copy',
        '-shortest' // comment if your audio is shorter
      ])
      .on('error', reject)
      .on("end", async () => {
        // since we can't save to the same file we're working with - using tmp file
        await fs.copyFile(output, video)
        await fs.unlink(output)
        resolve(video);
      })
      .run()
  })
}
