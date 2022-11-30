module.exports = ({ duration, fps, instances }) => {
  let allFrames = [],
    splitArrays = [];

  for (let i = 0; i < duration * fps; i++) {
    allFrames.push({
      frameNr: i,
      frameTime: 1000 * (i / fps),
    });
  }

  let chunkSize = Math.ceil(allFrames.length / instances);
  for (let i = 0; i < allFrames.length; i += chunkSize) {
    splitArrays.push(allFrames.slice(i, i + chunkSize));
  }

  return splitArrays;
};
