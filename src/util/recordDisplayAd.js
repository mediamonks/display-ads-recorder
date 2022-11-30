const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs-extra");
const cliProgress = require("cli-progress");
const minimal_args = require("../data/minimalArgs");
const padLeadingZeros = require("./padLeadingZeros");
const getFramesArrays = require("./getFramesArrays");

const progressBar = new cliProgress.SingleBar(
  {
    format:
      "capturing screenshots    [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}",
  },
  cliProgress.Presets.shades_classic
);

const screenshotBaseFilename = "screenshot_";
const screenshotExt = "jpg";
const chromiumInstancesAmount = 8;

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
    });

    const page = await browser.newPage();

    await page.exposeFunction("onMessageReceivedEvent", async (e) => {
      if (e.data.name === "animation-ready") {
        await browser.close();
        await handleAnimationInfoReceived(e.data);
      }
    });

    async function handleAnimationInfoReceived(animationInfo) {
      let totalScreenshotsRecorded = 0;
      const framesArrays = getFramesArrays({
        duration: animationInfo.duration,
        fps,
        instances: chromiumInstancesAmount,
      });

      progressBar.start(Math.ceil(animationInfo.duration * fps), 0);
      const startTime = new Date().getTime();

      await Promise.all(
        framesArrays.map((framesArray) => {
          return new Promise(async (resolve) => {
            const browser = await puppeteer.launch({
              headless: true, // headless to false for testing
              args: minimal_args,
            });

            const page = await browser.newPage();

            await page.setViewport({
              width: animationInfo.width,
              height: animationInfo.height,
            });

            await page.exposeFunction("onMessageReceivedEvent", async (e) => {
              switch (e.data.name) {
                case "animation-ready":
                  await dispatchEventToPage(page, {
                    name: "request-goto-frame",
                    frame: framesArray[0].frameTime,
                  });
                  break;
                case "current-frame":
                  await recordFrame();
                  break;
              }
            });

            let currentIndex = 0;
            async function recordFrame() {
              const screenshot_nr = framesArray[currentIndex].frameNr;
              const ssPath = await page.screenshot({
                path:
                  screenshotBase +
                  screenshotBaseFilename +
                  padLeadingZeros(screenshot_nr, 6) +
                  ".jpg",
                type: "jpeg",
                quality: 100,
              });

              currentIndex++;
              totalScreenshotsRecorded++;
              progressBar.update(totalScreenshotsRecorded);

              if (currentIndex < framesArray.length) {
                await dispatchEventToPage(page, {
                  name: "request-goto-frame",
                  frame: framesArray[currentIndex].frameTime,
                });
              } else {
                await browser.close();
                resolve();
              }
            }

            await listenFor(page, "message"); // Listen for "message" custom event on page load.

            await page.goto(url);
          });
        })
      );

      progressBar.stop();

      console.log(
        `done in ${(new Date().getTime() - startTime) / 1000} seconds`
      );

      const result = fs.readdirSync(screenshotBase).filter((ss) => {
        return ss.indexOf(`.${screenshotExt}`) !== -1;
      });

      resolve({
        baseDir: path.resolve(screenshotBase),
        files: result,
      });
    }

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

    await listenFor(page, "message"); // Listen for "message" custom event on page load.

    await page.goto(url);
  });
};
