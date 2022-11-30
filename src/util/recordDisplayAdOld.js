const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs-extra");
const cliProgress = require("cli-progress");

const padLeadingZeros = (num, size) => {
  let s = num + "";
  while (s.length < size) {
    s = "0" + s;
  }
  return s;
};

const minimal_args = [
  "--autoplay-policy=user-gesture-required",
  "--disable-background-networking",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-breakpad",
  "--disable-client-side-phishing-detection",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-dev-shm-usage",
  "--disable-domain-reliability",
  "--disable-extensions",
  "--disable-features=AudioServiceOutOfProcess",
  "--disable-hang-monitor",
  "--disable-ipc-flooding-protection",
  "--disable-notifications",
  "--disable-offer-store-unmasked-wallet-cards",
  "--disable-popup-blocking",
  "--disable-print-preview",
  "--disable-prompt-on-repost",
  "--disable-renderer-backgrounding",
  "--disable-setuid-sandbox",
  "--disable-speech-api",
  "--disable-sync",
  "--hide-scrollbars",
  "--ignore-gpu-blacklist",
  "--metrics-recording-only",
  "--mute-audio",
  "--no-default-browser-check",
  "--no-first-run",
  "--no-pings",
  "--no-sandbox",
  "--no-zygote",
  "--password-store=basic",
  "--use-gl=swiftshader",
  "--use-mock-keychain",
];

module.exports = async function recordDisplayAd(target, fps) {
  return new Promise(async (resolve, reject) => {
    let screenshotBase = path.join(path.dirname(target), ".cache/screenshots/");
    let screenshotBaseFilename = "screenshot_";
    const screenshotExt = "jpg";
    let screenshot_nr = 0;
    let nextFrame = 0;
    let adDetails = {};
    const url = `file://${path.resolve(target)}`;

    const progressBar = new cliProgress.SingleBar(
      {
        format:
          "capturing screenshots    [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}",
      },
      cliProgress.Presets.shades_classic
    );

    console.log("old");
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
      switch (e.data.name) {
        case "animation-ready":
          await handleAnimationInfoReceived(e.data);
          break;
        case "current-frame":
          await recordFrame();
          break;
      }
    });

    async function handleAnimationInfoReceived(data) {
      adDetails = data;
      progressBar.start(Math.ceil(adDetails.duration * fps), 0);

      page.setViewport({
        width: adDetails.width,
        height: adDetails.height,
      });

      await dispatchEventToPage({
        name: "request-goto-frame",
        frame: nextFrame,
      });
    }

    async function recordFrame() {
      await page.screenshot({
        path:
          screenshotBase +
          screenshotBaseFilename +
          padLeadingZeros(screenshot_nr, 6) +
          "." +
          screenshotExt,
        type: "jpeg",
        quality: 100,
      });

      screenshot_nr++;
      progressBar.update(screenshot_nr);
      nextFrame += 1000 / fps;

      if (nextFrame < adDetails.duration * 1000) {
        await dispatchEventToPage({
          name: "request-goto-frame",
          frame: nextFrame,
        });
      } else {
        handleAnimationEnd();
      }
    }

    async function handleAnimationEnd() {
      await browser.close();
      progressBar.stop();

      const result = fs.readdirSync(screenshotBase).filter((ss) => {
        return ss.indexOf(`.${screenshotExt}`) !== -1;
      });

      resolve({
        baseDir: path.resolve(screenshotBase),
        files: result,
      });
    }

    async function dispatchEventToPage(data) {
      await page.evaluate(function (data) {
        window.postMessage(data);
      }, data);
    }

    function listenFor(type) {
      return page.evaluateOnNewDocument((type) => {
        window.addEventListener(type, (e) => {
          window.onMessageReceivedEvent({ type, data: e.data });
        });
      }, type);
    }

    await listenFor("message"); // Listen for "message" custom event on page load.

    console.log("minimal args");

    await page.goto(url);
  });
};
