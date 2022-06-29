const sharp = require('sharp');

module.exports = async function getBackupImage(sourceImg, outputImg) {
    const backupImg = await sharp(sourceImg).jpeg({ mozjpeg: true }).toFile(outputImg);
    return outputImg;
}