# Display Ads Recorder
The Display Ads Recorder is a command line tool meant to record display ads and output these to separate formats, like video, jpg and gif (animated).

## Installation

```sh
npm i @mediamonks/display-ads-recorder
```

## Basic Usage

```js
display-ads-recorder
```

## Requirements
- You must pre-build the ads (display-ads-recorder will ask you for the directory where it will search for the ads), see display-dev-server
- Your ad's index.html must include a <meta name='ad.size'> tag. otherwise, display-ads-recorder will not recognize it as a ad.
- The ad must include the function that dispatches and listens to critical events for display-ads-recorder to work. see example here: http://www.github.com/mirkovw/display-record-template
  - This function is included in @mediamonks/display-temple

## Documentation

View the [documentation](https://mediamonks.github.io/display-advertising-docs/).

## Contribute

View [CONTRIBUTING.md](./CONTRIBUTING.md)

## LICENSE

[MIT](./LICENSE) © MediaMonks
