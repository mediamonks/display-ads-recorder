const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = async function renderGifFromVideoFile(inputVideo, outputPath) {

    const input = inputVideo;
    const paletteOutput = './build/temp_palette.png';

    // create pallette
    await new Promise((resolve, reject) => {
        try {
            const process = ffmpeg();
            process.addInput(input);
            process.withOptions([
                '-vf palettegen',
            ])

            process.output(paletteOutput);
            // process.on('progress', (progress) => console.log(progress))
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
            ])
            process.fpsInput(30)
            process.fps(30)
            // process.videoBitrate(10000)
            process.output(outputPath);

            // process.on('progress', (progress) => console.log(progress))
            process.on('end', () => resolve())
            process.run();

        } catch (e) {
            reject(e);
        }
    })

    return outputPath;
}