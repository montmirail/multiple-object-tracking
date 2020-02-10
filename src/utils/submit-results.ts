import axios from 'axios';
import {config} from '../config/bavelier';
import {Mot} from '../mot';
import {Ui} from '../ui';

//Once the subject is done with all the trials, send all the data at once to the database
//via the MOT/save.php script; data is passed with semicolons separating each trial's data
export const submitResults = (mot: Mot, ui: Ui, pxPerDeg: number) => {
  //get the subject's current local time
  const d = new Date();
  const localsec = Math.round(d.getTime() / 1000) - d.getTimezoneOffset() * 60;

  //send data asynchronously
  return axios.post('save.php', {
    trialStart: mot.trialStart.join(';'),       // trial numbers
    numAttendDots: mot.numAttendDots.join(';'), // number of dots attended for each trial
    probeTracked: ui.probeTracked.join(';'),   // if the queried dot for each trial was initially a cued dot
    response: mot.response.join(';'),           // the subject's response for each trial
    correct: mot.correct.join(';'),             // if the subject was correct for each trial
    rt: mot.rt.join(';'),                       // the subject's response time for each trial
    targetSeed: mot.targetSeed,                 // the seed used for dot setup in the RNG
    trialSeed: mot.trialSeed.join(';'),         // the seed used for each trial for target movement in the RNG
    numDrawCalls: mot.drawCounter.join(';'),    // the number of frames drawn for each trial
    canvasWidth: ui.canvas.width,              //the canvas's height (px)
    canvasHeight: ui.canvas.height, //the canvas's width (px)
    pxperdeg: pxPerDeg, //the pixels per degree used for determining stimuli size
    localsec: localsec,
  }); //once the script is done, then go to the end of the task
};
