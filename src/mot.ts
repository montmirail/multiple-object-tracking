import {State} from './enums/state';
import {Config} from './interfaces/config';
import trialOrder from './trialorder.json';

export class Mot {
  targetSeed: number;
  targetRandomizer: any;
  done: boolean;
  trialSeed: Array<number>;
  drawCounter: Array<number>;
  numDots: number;
  minSep: number;
  minFix: number;
  maxFix: number;
  minEdge: number;
  trial: number;
  trialStart: Array<number>;
  response: Array<number>;
  correct: Array<number>;
  rt: Array<number>;
  state: State;
  numTrials: number;
  stateChange: boolean;
  dialogOpen: boolean;
  initState: boolean;
  speed: number;
  tCue: number;
  tMove: number;
  dotVel: number;
  vel: number;
  startWait: number;
  numBlocks: number;
  blockCorrect: number;
  trialsPerBlock: number;
  dotRad: number;
  imageSize: number;
  straightProb: number;
  angSD: number;
  numAttendDots: Array<number>;
  startTime: number;
  pxPerDeg: number;

  constructor(config: Config, pxPerDeg: number, dots?: number[]) {
    /**
     * Value from config
     */
    this.pxPerDeg = pxPerDeg;
    this.numDots = config.numDots;
    this.straightProb = config.straightProb;
    this.angSD = config.angSD;
    this.numAttendDots = dots || trialOrder; //number of dots to attend to per trial (obtained from MOT/code.php)

    /**
     * Trial variables
     */
    this.targetSeed = new Date().getTime(); //stores seed used for the randon number generator used for initial dot setup
    // @ts-ignore
    this.targetRandomizer = new Math.seedrandom(this.targetSeed); //set RNG with seed
    this.trialSeed = []; //stores what seed was used for each trial
    this.drawCounter = []; //stores how many frames were drawn per trial
    this.numTrials = this.numAttendDots.length; // total number of trials

    /**
     * Timing variables
     */
    this.speed = 16; //length of time for each frame (ms/frame)
    this.tCue = 2000; //duration of presentation of cue (ms)
    this.tMove = 4000; //duration of dots moving (after the cue period) before asking about probed dot (ms)
    this.dotVel = 5; //velocity of dots in degrees/sec
    this.vel = Math.ceil(this.dotVel * pxPerDeg / (1 / (this.speed / 1000))); //velocity of dots in pixels/frame
    this.startWait = 0; //keeps track of timer start

    /**
     * Image config
     */
    this.dotRad = Math.round(0.4 * pxPerDeg); //dot radius (deg * ppd)
    this.imageSize = this.dotRad * 2; //dot size (diameter, in pixels)

    /**
     *  Stimuli movement Limits
     */
    this.minSep = Math.round(1.5 * pxPerDeg); //minimum distance allowed between dots (deg*ppd)
    this.minFix = Math.round(3 * pxPerDeg); //minimum distance allowed from fixation (deg*ppd)
    this.maxFix = Math.round(10 * pxPerDeg); //maximum distance allowed from fixation (deg*ppd)
    this.minEdge = Math.ceil(2 * Math.sqrt(2) * (this.vel + 1)) + this.dotRad + 4; //minimum distance from edge

    /**
     * Counters and data arrays
     */
    this.trial = 0; //current trial
    this.trialStart = []; //stores start time of each trial
    this.response = [];  //stores subject's responses per trial
    this.correct = []; //stores if subject was correct per trial
    this.rt = []; //response time per trial

    /**
     * Initial first trial values
     */
    this.response[0] = -1;
    this.correct[0] = -1;
    this.rt[0] = -1;

    /**
     * State control
     */
    this.state = State.START;
    this.done = false;
    this.stateChange = false; //keeps track if the state changed during the trial
    this.dialogOpen = false; //keeps track of whether dialog window is open or not
    this.initState = false; //keeps track if the current trial needs to be initialized

    /**
     * Trial config
     */
    this.numBlocks = 3; //total number of blocks
    this.blockCorrect = 0; //stores number of correct trials in a block
    this.trialsPerBlock = Math.round(this.numTrials / this.numBlocks); //number of trials per block, should be equal for all blocks

  }

  // ***************** TRIAL UPDATE ********************* //

  /**
   * this function prepares the state of the next trial
   */
  updateTrial() {
    this.trial++;

    if (this.trial >= this.numTrials) {
      this.done = true;
    } else {
      this.response[this.trial] = -1;
    }
  }
}
