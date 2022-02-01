![BrowserStack Logo](https://camo.githubusercontent.com/09765325129b9ca76d770b128dbe30665379b7f2915d9b60bf57fc44d9920305/68747470733a2f2f7777772e62726f77736572737461636b2e636f6d2f696d616765732f7374617469632f6865616465722d6c6f676f2e6a7067)

# BrowserStack XCUITest Logs Utility

BrowserStack XCUITest Logs Utility is a command line utility that helps you extract logs from XCUITest Builds on BrowserStack.

## Pre-requisites

- Identify your BrowserStack username and access key from the [BrowserStack Automate Dashboard](https://app-automate.browserstack.com/) and export them as environment variables using the below commands.
  - For \*nix based and Mac machines:
    ```
    export BROWSERSTACK_USERNAME=<browserstack-username> &&
    export BROWSERSTACK_ACCESS_KEY=<browserstack-access-key>
    ```
  - For Windows:
    ```
    set BROWSERSTACK_USERNAME=<browserstack-username>
    set BROWSERSTACK_ACCESS_KEY=<browserstack-access-key>
    ```
- Install [ffmpeg](https://ffmpeg.org/download.html) CLI utility on your machine/agent.

## Steps to run

1. Extract video logs for Builds

```
node extract_video_logs.js <build-id>
```
