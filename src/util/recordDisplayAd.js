const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs-extra");
const minimal_args = require("../data/minimalArgs");
const padLeadingZeros = require("./padLeadingZeros");
const getFramesArrays = require("./getFramesArrays");

const screenshotBaseFilename = "screenshot_";
const chromiumInstancesAmount = 1;

module.exports = async function recordDisplayAd({ target, url, fps }) {
  return new Promise(async (resolve) => {
    let screenshotBase = path.join(path.dirname(target), ".cache/screenshots/");

    if (!fs.existsSync(screenshotBase))
      fs.mkdirSync(screenshotBase, { recursive: true });
    await fs.emptyDir(screenshotBase); // remove old screenshots

    const browser = await puppeteer.launch({
      //executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // if we ever want to include video. but then the video needs to be controlled by the timeline..
      headless: true, // headless to false for testing
      args: minimal_args,
      ignoreHTTPSErrors: true,
      defaultViewport: null,
    });

    const page = await browser.newPage();

    let framesArray;
    let currentIndex = 0;

    async function recordFrame() {
      const screenshot_nr = framesArray[currentIndex].frameNr;
      await page.screenshot({
        path:
          screenshotBase +
          screenshotBaseFilename +
          padLeadingZeros(screenshot_nr, 6) +
          ".jpg",
        type: "jpeg",
        quality: 100,
      });

      currentIndex++;

      if (currentIndex < framesArray.length) {
        // request next frame
        await dispatchEventToPage(page, {
          name: "request-goto-frame",
          frame: framesArray[currentIndex].frameTime,
        });
      } else {
        // finish
        await browser.close();
        resolve();
      }
    }

    await page.exposeFunction("onMessageReceivedEvent", async (e) => {
      if (e.data.name === "animation-ready") {
        // init
        const animationInfo = e.data;

        const deviceScaleFactor = await page.evaluate('window.devicePixelRatio') // so the pixels are real, not blurred
        
        await page.setViewport({
          width: animationInfo.width,
          height: animationInfo.height,
          deviceScaleFactor,
        });
        
        framesArray = getFramesArrays({
          duration: animationInfo.duration,
          fps,
          instances: chromiumInstancesAmount,
        }).flat(1);

        // start frame capturing
        await dispatchEventToPage(page, {
          name: "request-goto-frame",
          frame: 0,
        });
      } else if (e.data.name === "current-frame") {
        await recordFrame();
      }
    });
    
    await listenFor(page, "message"); // Listen for "message" custom event on page load.
    
    await page.goto(url);

    async function dispatchEventToPage(page, data) {
      await page.evaluate(function (data) {
        window.postMessage(data);
      }, data);
    }

    function listenFor(page, type) {
      return page.evaluateOnNewDocument((type) => {
        window.addEventListener(type, (e) => {
          window.onMessageReceivedEvent({ type, data: e.data });
        });
      }, type);
    }
  });
};