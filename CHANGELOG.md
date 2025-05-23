# Changelog

## [3.6.0] - 2025-05-23

### Updated
- Minor version bump for maintenance update

## [3.5.0] - 2025-04-10

### Updated
- Upgraded Puppeteer from 19.2.2 to 24.6.1
- Improved browser launch configuration for better stability
- Enhanced error handling and recovery mechanisms

### Fixed
- Browser disconnection handling
- Frame capture timing issues
- Progress bar updates during recording
- Memory management in headless mode

### Technical Changes
- Updated browser launch options for Puppeteer 24.6.1
- Implemented proper cleanup on browser disconnection
- Added frame-by-frame progress reporting
- Improved error logging and debugging information

### Basic Configuration of PUPPETEER 24.6

``` 
headless: true 
```

- Purpose: Controls browser visibility

- Docs: [Headless Option](https://developer.chrome.com/docs/chromium/headless?hl=es-419)

## Chrome Arguments

`--no-sandbox:`
* Disables Chrome's sandbox
* Warning: Reduces security, use only in controlled environments
* Common for CI/CD environments

`--disable-setuid-sandbox:`
* Disables setuid sandbox (Linux)
* Used alongside --no-sandbox
* Helps prevent permission issues

`--disable-dev-shm-usage:`
* Prevents /dev/shm usage on Linux
* Fixes memory issues in containerized environments
* Forces Chrome to use /tmp instead

`--disable-gpu:`
* Disables GPU hardware acceleration
* Helps prevent graphics-related crashes
* Recommended for headless environments

`--disable-web-security:`
* Disables same-origin policy
* Warning: Security risk, use carefully
* Helpful for cross-origin frame access


## Additional Settings

`ignoreHTTPSErrors: true`
* Bypasses SSL/TLS certificate errors
* Useful for self-signed certificates
* Docs: [ignoreHTTPSErrors](https://pptr.dev/api/puppeteer.browserlaunchoptions#property-ignorehttpserrors)

`defaultViewport: null:`
* Disables default viewport settings
* Allows page to use full window size
* Docs: [defaultViewport](https://pptr.dev/api/puppeteer.browserlaunchoptions#property-defaultviewport)

`protocolTimeout: 30000`
* Sets timeout for protocol messages (30 seconds)
* Helps prevent hanging on slow operations
* Docs: [protocolTimeout](https://pptr.dev/api/puppeteer.browserlaunchoptions#property-protocoltimeout)