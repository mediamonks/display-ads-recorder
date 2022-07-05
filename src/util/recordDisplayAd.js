const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs-extra');
const cliProgress = require('cli-progress');

const padLeadingZeros = (num, size) => {
  let s = num + "";
  while (s.length < size) {
    s = "0" + s;
  }
  return s;
}

module.exports = async function recordDisplayAd(target, fps) {

  return new Promise(async (resolve, reject) => {

    // let rootPath = path.dirname(target);
    let screenshotBase = path.join(path.dirname(target), '.cache/screenshots/');
    let screenshotBaseFilename = 'screenshot_'
    const screenshotExt = 'png';
    let screenshot_nr = 0;
    let nextFrame = 0;
    let adDetails = {};

    const progressBar = new cliProgress.SingleBar({
      format: 'capturing screenshots    [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}'
    }, cliProgress.Presets.shades_classic);

    if (!fs.existsSync(screenshotBase)) fs.mkdirSync(screenshotBase, {recursive: true});
    await fs.emptyDir(screenshotBase); // remove old screenshots

    const browser = await puppeteer.launch({
      //executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // if we ever want to include video. but then the video needs to be controlled by the timeline..
      headless: true // headless to false for testing
    });

    const page = await browser.newPage();

    await page.exposeFunction('onCustomEvent', async ({type, detail}) => {
      switch (type) {
        case 'animation-info':
          await handleAnimationInfoReceived(detail);
          break;
        case 'animation-record':
          await recordFrame();
          break;
        case 'animation-end':
          await handleAnimationEnd();
          break;
      }
    });

    async function handleAnimationInfoReceived(detail) {
      adDetails = detail;
      progressBar.start(Math.ceil(adDetails.duration * fps), 0)
      await dispatchEventToPage("animation-info-received")
    }

    async function recordFrame() {
      await page.screenshot({
        path: screenshotBase + screenshotBaseFilename + padLeadingZeros(screenshot_nr, 6) + '.' + screenshotExt,
        clip: {
          x: 0,
          y: 0,
          width: adDetails.width,
          height: adDetails.height
        }
      });

      progressBar.update(screenshot_nr);

      screenshot_nr++;
      nextFrame += (1000 / fps);
      await dispatchEventToPage("animation-gotoframe-request", {"detail": nextFrame});
    }

    async function handleAnimationEnd() {
      await browser.close();
      progressBar.stop();

      const result = fs.readdirSync(screenshotBase).filter(ss => {
        return ss.indexOf(`.${screenshotExt}`) !== -1;
      })

      resolve({
        baseDir: path.resolve(screenshotBase),
        files: result
      });
    }

    async function dispatchEventToPage(evt, detail = {}) {
      await page.evaluate(function (evt, detail) {
        const event = new CustomEvent(evt, detail);
        document.dispatchEvent(event);
      }, evt, detail);
    }

    function listenFor(events) {
      events.forEach(type => {
        return page.evaluateOnNewDocument(type => {
          document.addEventListener(type, e => {
            window.onCustomEvent({type, detail: e.detail});
          });
        }, type);
      })
    }

    await listenFor(['animation-info', 'animation-record', 'animation-end']);


    const url = `file://${path.resolve(target)}`
    await page.goto(url);
  });
}
