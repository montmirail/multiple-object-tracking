# Multiple Object Tracking

This repo contain the task Multiple Object Tracking for the Online Visual Attention that you can be found here : https://github.com/montmirail/online-visual-attention 

## Pre-requisites

You need `node` installed on your computer to build the app. You can download node here: https://nodejs.org/en/

While in the folder, run
```cmd
npm install
```

to install the dependencies.

## Build 

After updating the source, run 
```cmd
npm run build
``` 
to build the distributable.

## Usage

At the current state, this is not a standalone app; it require the Online Visual Attention server to work.

After building the distributable, copy the `/dist/bundle.js` file into the `/MOT/dist` folder in the server. 


## Configuration

The task is configurable by updating `/src/config/bavelier.ts`

## Trials

The number of trial and the number of dots per trial is defined by `/src/trialorder.json`

# Support

If this procedure is incomplete or doesn't work for you, contact me at [pejoessel@gmail.com](mailto:pejoessel@gmail.com)
