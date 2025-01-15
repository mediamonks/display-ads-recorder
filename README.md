# Display Ads Recorder
[![npm version](https://badge.fury.io/js/%40mediamonks%2Fdisplay-ads-recorder.svg)](https://www.npmjs.com/package/@mediamonks/display-ads-recorder)
[![GitHub Actions Status](https://github.com/mediamonks/display-ads-recorder/workflows/Test%20and%20publish%20to%20NPM/badge.svg)](https://github.com/mediamonks/display-ads-recorder/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/node/v/@mediamonks/display-ads-recorder)](https://nodejs.org)
[![Dependencies Status](https://status.david-dm.org/gh/mediamonks/display-ads-recorder.svg)](https://david-dm.org/mediamonks/display-ads-recorder)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

The Display Ads Recorder is a powerful command-line tool designed to automate the recording of display ads and convert them into multiple formats (video, jpg, and animated gif).

## Features

- 📹 Multiple output formats support (MP4, GIF, JPG)
- 🎵 Audio integration capabilities
- ⚡ Parallel processing for better performance
- 🎨 Customizable FPS settings (15, 30, 60)
- 📦 Optimized file sizes
- 🚀 Easy integration with existing display ad projects

## Prerequisites

- Node.js >= 20.x
- NPM >= 8.x
- Display ads built with [@mediamonks/display-dev-server](https://www.github.com/mediamonks/display-dev-server)
- Ad's index.html must include `<meta name='ad.size'>` tag
- Integration with [@mediamonks/display-temple](https://www.github.com/mediamonks/display-temple)

## Installation

```bash
npm install @mediamonks/display-ads-recorder
```

## Basic Usage

```bash
display-ads-recorder
```

## Advanced Usage

### Command Line Options

```bash
display-ads-recorder [options]

Options:
  -c, --chunkSize      Define chunkSize (default: 10)
  -t, --targetDir      Set target dir
  -a, --all                  Record all ads
  -j, --jpg [size]          Output JPG with optional size in KB
  -g, --gif [loop]          Output animated GIF (once/loop)
  -m, --mp4                  Output MP4 video
  -au, --audio         Add audio file (relative path from target dir)
  -v, --volume       Specify audio volume
  -f, --fps <15|30|60>      Set FPS for recording
```

### Examples

```bash
# Record all ads in build directory
display-ads-recorder -t ./build -a

# Record specific ad with multiple outputs
display-ads-recorder -t ./build -m -g loop -j 40 -f 30

# Record with audio
display-ads-recorder -t ./build -m -au ./audio/background.mp3 -v 0.8
```

## Configuration

### Required Ad Structure

```html


```

### Integration with Display Temple

```javascript
import { enableAdsRecorder } from '@mediamonks/display-temple';

// In your ad's main script
enableAdsRecorder(timeline, config);
```

## Output Formats

### MP4 Video
- High-quality video output
- Customizable FPS
- Optional audio integration
- Optimized for web delivery

### Animated GIF
- Loop or single-play options
- Optimized color palette
- Configurable frame rate
- Balanced quality/size ratio

### JPG Backup
- Configurable file size limits
- Automatic quality optimization

## Contribute

View [CONTRIBUTING.md](./CONTRIBUTING.md)

## LICENSE

[MIT](./LICENSE) © MediaMonks
