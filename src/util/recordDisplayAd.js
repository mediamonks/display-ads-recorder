const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs-extra');

// records display ad at chosen FPS to a PNG sequence and returns array with screenshot filenames
module.exports = async function recordDisplayAd(target, fps) {
    console.log(`recording ${target}`);

    let screenshot_nr = 1;
    let nextFrame = 0;
    let adDetails = {};
    let rootPath = path.dirname(target);
    let screenshotBase = path.join(path.dirname(target), '.cache/screenshots/');
    let screenshotBaseFilename = 'screenshot_'
    const screenshotExt = 'png';

    if (!fs.existsSync(screenshotBase)) fs.mkdirSync(screenshotBase, { recursive: true });
    await fs.emptyDir(screenshotBase); // remove old screenshots

    return new Promise(async (resolve, reject) => {
        try {
            // console.log('starting browser')
            const browser = await puppeteer.launch({
                //executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                headless: true // headless to false for testing
            });

            // console.log('new page')
            const page = await browser.newPage();

            await page.exposeFunction('onCustomEvent', async (e) => {
                // console.log(`${e.type} fired`, e.detail || '');

                if (e.type === 'animation-info') {
                    adDetails = e.detail;

                    await page.evaluate( function() {
                        const event = new CustomEvent("animation-info-received");
                        document.dispatchEvent(event)
                    });
                };


                if (e.type === 'animation-record') {
                    process.stdout.clearLine();
                    process.stdout.cursorTo(0)
                    process.stdout.write(`Recording frame: ${screenshot_nr}, time(s): ${Math.round(nextFrame) / 1000}`);

                    await page.screenshot({
                        path: screenshotBase + screenshotBaseFilename + padLeadingZeros(screenshot_nr, 6) + '.' + screenshotExt,
                        clip: {
                            x: 0,
                            y: 0,
                            width: adDetails.width,
                            height: adDetails.height
                        }
                    });
                    screenshot_nr++;
                    nextFrame += (1000 / fps);

                    await page.evaluate( function(nextFrame){
                        const event = new CustomEvent("animation-gotoframe-request", { "detail": nextFrame });
                        document.dispatchEvent(event)
                    }, nextFrame);
                }


                if (e.type === 'animation-end') {
                    process.stdout.write('\n');
                    // console.log('stop recording')
                    await browser.close();

                    const result = fs.readdirSync(screenshotBase).filter(ss => {
                        return ss.indexOf(`.${screenshotExt}`) !== -1;
                    })

                    resolve({
                        baseDir: path.resolve(screenshotBase),
                        files: result
                    });
                }
            });

            function listenFor(type) {
                return page.evaluateOnNewDocument((type) => {
                    document.addEventListener(type, (e) => {
                        window.onCustomEvent({ type, detail: e.detail });
                    });
                }, type);
            }

            await listenFor('animation-record');
            await listenFor('animation-end');
            await listenFor('animation-info');

            await page.goto(path.resolve(target));

        } catch (e) {
            reject(e);
        }
    })
}

function padLeadingZeros(num, size) {
    let s = num+"";
    while (s.length < size) {
        s = "0" + s;
    }
    return s;
}