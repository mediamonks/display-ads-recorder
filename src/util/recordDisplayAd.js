const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs-extra");
const minimal_args = require("../data/minimalArgs");
const padLeadingZeros = require("./padLeadingZeros");
const getFramesArrays = require("./getFramesArrays");

const screenshotBaseFilename = "screenshot_";
const chromiumInstancesAmount = 1;

module.exports = async function recordDisplayAd({ target, url, fps }) {
  let browser = null;

  return new Promise(async (resolve, reject) => {

    let screenshotBase = path.join(path.dirname(target), ".cache/screenshots/");

    if (!fs.existsSync(screenshotBase))
      fs.mkdirSync(screenshotBase, { recursive: true });
    await fs.emptyDir(screenshotBase); // remove old screenshots

    const launchOptions = {
      headless: true, // Using new headless mode
      args: [
        ...minimal_args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security'
      ],
      ignoreHTTPSErrors: true,
      defaultViewport:null,
      protocolTimeout: 30000
    };

    // console.log('[Debug] Launching browser with options:', launchOptions);
    console.log('[Debug] Launching browser');
    browser = await puppeteer.launch(launchOptions).catch(err => {
      console.error('[Error] Browser launch failed:', err);
      throw err;
    });

    let isClosing = false;  // Add flag to track intentional closure

    // Add browser event handlers with proper error handling
    browser.on('disconnected', () => {
      console.log('[Debug] Browser disconnected');
      if (!isClosing && page && !page.isClosed()) {
        reject(new Error('Browser unexpectedly disconnected'));
      }
    });

    console.log('[Debug] Creating new page');
    const page = await browser.newPage();

    // Add page event handlers
    page.on('error', err => {
      console.error('[Error] Page crashed:', err);
      reject(err);
    });

    page.on('pageerror', err => {
      console.error('[Error] Page error:', err);
    });

    page.on('console', msg => {
      // console.log(`[Page Console] ${msg.type()}: ${msg.text()}`);
    });

    let framesArray;
    let currentIndex = 0;

    async function recordFrame() {
      try {
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

      // Calculate progress percentage
      const progress = (currentIndex / framesArray.length) * 100;
      process.stdout.write(`\rCapturing frame ${currentIndex}/${framesArray.length} (${progress.toFixed(1)}%)`);

      if (currentIndex < framesArray.length) {
        await dispatchEventToPage(page, {
          name: "request-goto-frame",
          frame: framesArray[currentIndex].frameTime,
        });
      } else {
        process.stdout.write('\n'); // New line after completion
        isClosing = true;
        await browser.close();
        resolve();
      }
    } catch (error) {
      process.stdout.write('\n'); // New line in case of error
      console.error(`[Error] Failed to record frame:`, error);
      if (!isClosing) {
          isClosing = true;
          await browser.close();
      }
      reject(error);
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