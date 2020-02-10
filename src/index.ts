// import $ from 'jquery';
import {config} from './config/bavelier';
import {Keys} from './enums/keys';
import {State} from './enums/state';
import {Mot} from './mot';
import './style.css';
import {Ui} from './ui';
import {getCalibration} from './utils/calibration';
import {closeFullscreen, openFullscreen} from './utils/fullscreen';
import {submitResults} from './utils/submit-results';

/**
 * This experience is calibrated to work on Viewpixx screen of 24 inch
 */
const monitorSize = 24;

const { pxPerDeg } = getCalibration(monitorSize);

const mot = new Mot(config, pxPerDeg);
const ui = new Ui(mot);

// *********************** DRAWING CONTROL ************************ //

// for efficient redraw calls (from Paul Irish - http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/)

// @ts-ignore
window.requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || function (callback: any) {
  window.setTimeout(callback, 1000 / 60);
};

//controls state/canvas update
const draw = () => {
  // @ts-ignore
  requestAnimFrame(draw);
  updateFrame();
};

const init = () => {
  const continueButton = $('#cButton');
  const reminderButton = $('#reminderButton');
  const reminderDialog = $('#reminder');

  //hide content before subject starts
  $('#postexpt').hide();

  /**
   * Set up the continue button that allows the subject to start the task
   */
  // @ts-ignore
  continueButton.button();

  continueButton.click(() => {
    openFullscreen();
    ui.init();
  });

  // @ts-ignore
  continueButton.button('option', 'disabled', true);

  /**
   * Set up the reminder button which brings up short instructions in a dialog box
   */
  // @ts-ignore
  reminderButton.button({
    icons: {primary: 'ui-icon-info'},
    text: false,
  });

  reminderButton.click(function () {
    // @ts-ignore
    reminderDialog.dialog('open');
  });

  /**
   * set up the reminder dialog that appears with short instructions
   */
  // @ts-ignore
  reminderDialog.dialog({
    autoOpen: false,
    modal: true,
    title: 'Instructions & Controls',
    width: 400,
  });

  //add keyboard listener to keep track of keys the subject presses
  window.addEventListener('keydown', keyboardResponse, true);

  //subject can now move on, now that everything is setup, so enable continue button
  // @ts-ignore
  continueButton.button('option', 'disabled', false);

  /**
   * Start the task
   */
  draw(); //start the task
};

// ************************* STATE UPDATES *************************** //

//At each frame, the frame is redrawn based on the current state
function updateFrame() {
  //check if dialog window for instructions is open
  // @ts-ignore
  mot.dialogOpen = !!$('#reminder').dialog('isOpen');

  if (mot.state === State.START || mot.state === State.FIX) { //start of task or start of trial
    if (mot.stateChange) {
      mot.stateChange = false; //turn off state change
      mot.trialSeed[mot.trial] = mot.trial; //set trial seed
      // @ts-ignore
      Math.seedrandom(mot.trial); //create random number generator based on seed
      ui.drawContent(); //draw updated content
    }
    //wait for space bar
  } else if (mot.state === State.BREAK) { //break between blocks
    if (mot.stateChange) {
      mot.stateChange = false; //turn off state change
      ui.drawContent(); //draw updated content
    }
    //wait for space bar
  } else if (mot.state === State.CUE) { //display dots that should be tracked while moving all dots around
    if (mot.stateChange) {
      mot.startWait = performance.now(); //get start time of cue period
      mot.stateChange = false; //turn off state change
      mot.initState = true; //note that the trial needs to be set up
      ui.drawContent(); //draw updated content
    }
    //check how much time has passed; if the full time for the cue period has passed, move onto the "move" state
    if (performance.now() >= mot.startWait + mot.tCue) {
      mot.state = State.MOVE;
      mot.stateChange = true;
    } else {
      //keep updating movement of dots
      ui.drawContent();
    }
  } else if (mot.state === State.MOVE) { //change the target dots to normal color (dots still moving)
    if (mot.stateChange) {
      mot.startWait = performance.now(); //get start time of move period
      mot.stateChange = false; //turn off state change
      ui.drawContent(); //draw updated content
    }
    //check how much time has passed; if the full time for the cue period has passed, move onto the "response" state
    if (performance.now() >= mot.startWait + mot.tMove) {
      mot.state = State.RESPONSE;
      mot.stateChange = true;
    } else {
      //keep updating movement of dots
      ui.drawContent();
    }
  } else if (mot.state === State.RESPONSE) { //wait for subject response to the probed dot
    if (mot.stateChange) {
      mot.startWait = performance.now(); //get start time of response period
      mot.stateChange = false; //turn off state change

      //choose randomly (~50/50) whether or not the dot selected will be an originally cued dot or not
      ui.probeTracked[mot.trial] = Math.round(mot.targetRandomizer());
      if (ui.probeTracked[mot.trial]) { //if it is, then randomly select one of the cued dots as the queried dot
        ui.probedDot[mot.trial] = Math.floor(mot.targetRandomizer() * mot.numAttendDots[mot.trial]);
      } else { //otherwise, choose any of the other dots as the queried dot
        ui.probedDot[mot.trial] = Math.floor(mot.targetRandomizer() * (mot.numDots - mot.numAttendDots[mot.trial])) + mot.numAttendDots[mot.trial];
      }

      ui.drawContent(); //update the content
    }
    //once the subject has given a response for the trial, then move on
    if (mot.response[mot.trial] !== -1) {
      mot.updateTrial(); //update trial data

      if (mot.done) { //if this was the last trial, then take the participant to the end of the task
        mot.state = State.DONE;

        submitResults(mot, ui, pxPerDeg)
          .then(() => {
            $('#exptCanvas').hide();
            const percentCorrect = Math.round(mot.blockCorrect / mot.trialsPerBlock * 100);
            const finalText = 'Done! You got ' + percentCorrect + '% correct for this final block.';
            $('#postexpt-result').text(finalText);
            $('#postexpt').show();
          }); //send data to database
      } else if (mot.trial % mot.trialsPerBlock === 0) { //if this was the last trial of a block, then let the subject take a break
        mot.state = State.BREAK;
      } else { //otherwise, move onto the next trial
        mot.state = State.FIX;
      }

      mot.stateChange = true;
    }
  }
}

export const keyboardResponse = (event: KeyboardEvent) => {
  //only respond to any key presses if the dialog window for instructions is not open
  if (mot.dialogOpen) return;

  //if we're in the response state and the subject has yet to give a response to the trial
  if (mot.state === State.RESPONSE && mot.response[mot.trial] === -1) {
    if (event.keyCode == Keys.NO) { //the subject has indicated that the queried dot was not a cued dot
      mot.rt[mot.trial] = performance.now() - mot.startWait; //get response time
      mot.response[mot.trial] = 0; //set response given by subject
    } else if (event.keyCode === Keys.YES) { //the subject has indicated the queried dot was a cued dot
      mot.rt[mot.trial] = performance.now() - mot.startWait; //get response time
      mot.response[mot.trial] = 1; //set response given by subject
    }

    //check if the subject was correct or not, and record this
    if (mot.response[mot.trial] === ui.probeTracked[mot.trial]) {
      mot.correct[mot.trial] = 1;
    } else {
      mot.correct[mot.trial] = 0;
    }

    //keep track of number of trials correct for the current block
    mot.blockCorrect = mot.blockCorrect + mot.correct[mot.trial];
  }

  //if the trial start key was pressed and it's the start of a trial, then start the trial
  if (event.keyCode === Keys.START && (mot.state === State.START || mot.state === State.FIX)) {
    mot.trialStart[mot.trial] = performance.now() - mot.startTime;
    mot.state = State.CUE;
    mot.stateChange = true;

    console.log('Start');
  }

  //if the break end key was pressed and it's currently a break, then start the next block
  if (event.keyCode === Keys.RESUME && mot.state === 'break') {
    mot.blockCorrect = 0; //reset number of correct trials for this block
    mot.state = State.FIX; //change state to start a new trial
    mot.stateChange = true;
  }

  if (event.keyCode === Keys.QUIT) {
    closeFullscreen();
  }
};


// *********************** INITIALIZATION ************************** //

//wait until the HTML5 page is ready before setting up all the widgets
init();
