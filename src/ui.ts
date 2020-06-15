// import $ from 'jquery';
import {State} from './enums/state';
import {Mot} from './mot';
import {createEmptyDotArray} from './utils/create-empty-dot-array';
import happyFace from './assets/images/happy_face.png';
import query from './assets/images/query.png';
import sadFace from './assets/images/sad_face.png';

export class Ui {
  mot: Mot;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  cx: number;
  cy: number;
  sprites: Array<HTMLImageElement>;
  dotPosX: Array<any>;
  dotPosY: Array<any>;
  dotMovAng: Array<any>;
  probeTracked: Array<any>;
  probedDot: Array<any>;

  constructor(mot: Mot) {
    this.mot = mot;
    this.canvas = document.querySelector('#exptCanvas');
    this.context = this.canvas.getContext("2d");
    this.dotPosX = createEmptyDotArray(mot.numTrials, mot.numDots); //stores X position of each dot per trial (updated at each frame)
    this.dotPosY = createEmptyDotArray(mot.numTrials, mot.numDots); //stores Y position of each dot per trial (updated at each frame)
    this.dotMovAng = []; //stores current angle of motion for each dot (updated at each frame)
    this.probeTracked = []; //store whether the trial asked if a dot that needed to be attended to (blue) was the dot that was queried about at the end of a trial
    this.probedDot = []; //store the identity of the probed dot (the one asked about at the end of the trial)
  }

  init() {
    $("#preexpt").hide();

    this.canvas.height = window.innerHeight; //set canvas height to full browser window size for content
    this.canvas.width = window.innerWidth; //make the canvas square
    this.context.fillStyle = "rgb(0, 0, 0)"; //set the canvas color to black
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.cx = Math.round(this.canvas.width / 2); //get center x coordinate of canvas
    this.cy = Math.round(this.canvas.height / 2); //get center y coordinate of canvas

    //setting up the stimuli images
    const baseUrl = '/public';
    const images = [
      './dist/assets/images/happy_face.png',
      './dist/assets/images/sad_face.png',
      './dist/assets/images/query.png'];
    this.sprites = images.map(src => {
      const image = new Image();
      image.src = src;
      return image;
    });

    this.mot.maxFix = Math.min(this.mot.maxFix, this.cy);
    this.mot.stateChange = true; //update the content to the current state
    this.mot.startTime = performance.now(); //get the task start time
  }

  drawContent() {
    //set the background to black
    this.context.fillStyle = "rgb(0, 0, 0)";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    //create the gray circle that the dots move within
    //(size is the extent of the canvas)
    this.context.fillStyle = "rgb(128, 128, 128)";
    this.context.beginPath();
    this.context.arc(this.cx, this.cy, Math.floor(this.mot.maxFix - 15), 0, 2 * Math.PI);
    this.context.fill();

    //draw on canvas based on state
    if (this.mot.state === State.START || this.mot.state === State.FIX) {
      this.mot.drawCounter[this.mot.trial] = 0; //reset counter for keeping track of number of frames drawn during a trial

      this.drawFix(); //draw fixation point

      //set font parameters
      this.context.fillStyle = "black";
      this.context.font = "12pt Arial";
      this.context.textAlign = "center";

      //set text displayed to subject
      this.context.fillText("Press the space bar to start the trial.", this.cx, this.cy + 25);
    } else if (this.mot.state === State.BREAK) {

      //set font parameters
      this.context.fillStyle = "black";
      this.context.font = "12pt Arial";
      this.context.textAlign = "center";

      //calculate percent correct for the block
      const percentCorrect = Math.round(this.mot.blockCorrect / this.mot.trialsPerBlock * 100);

      //set feedback text displayed
      const breakText1 = `You got ${percentCorrect}% correct for this block. Time to take a break!`;
      const breakText2 = "When you are ready to resume the task, press Enter.";

      this.context.fillText(breakText1, this.cx, this.cy + 25);
      this.context.fillText(breakText2, this.cx, this.cy + 50);
    } else if (this.mot.state === State.CUE || this.mot.state === State.MOVE) {
      this.mot.drawCounter[this.mot.trial]++; //increment frame counter

      this.drawFix(); //draw fixation point

      if (this.mot.initState) {

        //it's the initialization state, so set up all the dots
        $("#exptCanvas").css({cursor: 'none'}); //hide the cursor

        //Now draw target and distractor dots moving:
        //choose initial positions and velocities
        for (let i = 0; i < this.mot.numDots; i++) {
          let restart = 1; //keeps track if the initial dot position need to be recalculated

          while (restart) {
            restart = 0;

            //choose the initial x and y position for this dot (a valid position within the boundaries)
            this.dotPosX[this.mot.trial][i] = Math.random() * 2 * (this.mot.maxFix - this.mot.minEdge) + this.mot.minEdge + this.cx - this.mot.maxFix;
            this.dotPosY[this.mot.trial][i] = Math.random() * 2 * (this.mot.maxFix - this.mot.minEdge) + this.mot.minEdge + this.cy - this.mot.maxFix;


            // if the dot ended up outside of the boundaries, then refind a position for this dot
            let r2 = Math.pow(this.dotPosX[this.mot.trial][i] - this.cx, 2) + Math.pow(this.dotPosY[this.mot.trial][i] - this.cy, 2);
            if (r2 < Math.pow(this.mot.minFix, 2) || r2 > Math.pow(this.mot.maxFix - this.mot.minEdge, 2)) {
              restart = 1;

              continue;
            }

            //then check the distances between this dot and all previously positioned dots
            if (!restart && i >= 1) {
              for (let j = 0; j < i; j++) {
                //if it starts too close to another dot, then find a new position for this current dot
                if (Math.pow(this.dotPosX[this.mot.trial][i] - this.dotPosX[this.mot.trial][j], 2) + Math.pow(this.dotPosY[this.mot.trial][i] - this.dotPosY[this.mot.trial][j], 2) < Math.pow(this.mot.minSep, 2)) {
                  restart = 1;
                  break;
                }
              }
            }
          }
        }

        for (let i = 0; i < this.mot.numDots; i++) {
          //now randomly assign a starting angle of motion for each dot
          this.dotMovAng[i] = Math.random() * 2 * Math.PI;

          let faceType;
          //the first X dots in the array start as the cued dots (X = total number of dots to attend to during that trial)
          if (i < this.mot.numAttendDots[this.mot.trial]) {
            faceType = this.sprites[1];
          } else { //the rest are normal dots
            faceType = this.sprites[0];
          }

          //now draw the dot
          this.context.drawImage(
            faceType,
            this.dotPosX[this.mot.trial][i] - this.mot.dotRad,
            this.dotPosY[this.mot.trial][i] - this.mot.dotRad,
            this.mot.imageSize,
            this.mot.imageSize
          );
        }

        this.mot.initState = false; //turn off initialization state
      } else { //no longer the initialization state, so just keep the dots moving
        const posXNew = [];
        const posYNew = [];
        const randomize = [];

        //assign a random number to each dot
        for (let i = 0; i < this.mot.numDots; i++) {
          randomize[i] = Math.random();
        }

        for (let i = 0; i < this.mot.numDots; i++) {
          //if the dot's number is greater than the straight probability, then the dot's
          //current trajectory will change to a randomly selected angle within the maximum deviation
          if (randomize[i] > this.mot.straightProb) {
            let randomness = Math.random() * this.mot.angSD;

            if (Math.random() > 0.5) {
              randomness = -randomness;
            }

            this.dotMovAng[i] = this.dotMovAng[i] + randomness;
          }

          //predicted position change (calculated based on current position plus the calculated distance and direction based on angle and dot speed)
          posXNew[i] = this.dotPosX[this.mot.trial][i] + Math.cos(this.dotMovAng[i]) * this.mot.vel;
          posYNew[i] = this.dotPosY[this.mot.trial][i] - Math.sin(this.dotMovAng[i]) * this.mot.vel;

          //if the dot is past the inner or outer boundaries, then reflect the motion of the dot
          // (this makes it looks like it bounces off the boundary walls)
          let r2 = Math.pow(posXNew[i] - this.cx, 2) + Math.pow(posYNew[i] - this.cy, 2);
          if (r2 < Math.pow(this.mot.minFix, 2) || r2 > Math.pow(this.mot.maxFix - this.mot.minEdge, 2)) {
            let temp = this.dotMovAng[i];
            this.dotMovAng[i] =
              2 * Math.atan2(-(this.dotPosY[this.mot.trial][i] - this.cy), this.dotPosX[this.mot.trial][i] - this.cx) -
              this.dotMovAng[i] - Math.PI;
          }
        }

        // check if any of the dots collide with each other; if they do, then reflect their motion
        //(similar to billiard balls hitting each other)
        for (let i = 0; i < this.mot.numDots - 1; i++) {
          for (let j = i + 1; j < this.mot.numDots; j++) {
            if (Math.pow(posXNew[i] - posXNew[j], 2) + Math.pow(posYNew[i] - posYNew[j], 2) < Math.pow(this.mot.minSep, 2)) {
              let tempAngle = this.dotMovAng[i];
              this.dotMovAng[i] = this.dotMovAng[j];
              this.dotMovAng[j] = tempAngle;
            }
          }
        }

        //with these new positions, now update and draw the dots
        for (let i = 0; i < this.mot.numDots; i++) {
          this.dotPosX[this.mot.trial][i] = this.dotPosX[this.mot.trial][i] + Math.cos(this.dotMovAng[i]) * this.mot.vel;
          this.dotPosY[this.mot.trial][i] = this.dotPosY[this.mot.trial][i] - Math.sin(this.dotMovAng[i]) * this.mot.vel;

          //if we're in the cue state, then make sure the dots that need to be cued dots are displayed properly
          let faceType;
          if (this.mot.state === State.CUE && i < this.mot.numAttendDots[this.mot.trial]) {
            faceType = this.sprites[1];
          } else {
            faceType = this.sprites[0];
          }

          //draw the dot
          this.context.drawImage(
            faceType,
            this.dotPosX[this.mot.trial][i] - this.mot.dotRad,
            this.dotPosY[this.mot.trial][i] - this.mot.dotRad,
            this.mot.imageSize,
            this.mot.imageSize
          );
        }
      }
    } else if (this.mot.state === State.RESPONSE) {
      this.drawFix(); //draw the fixation point

      //now update and draw the dots (no longer moving)
      for (let i = 0; i < this.mot.numDots; i++) {
        let faceType;
        //if current dot is the dot to be queried, then change it to the queried dot stimulus
        if (i === this.probedDot[this.mot.trial]) {
          faceType = this.sprites[2];
        } else { //set all the other dots to the normal stimulus image
          faceType = this.sprites[0];
        }

        //draw the dot
        this.context.drawImage(
          faceType,
          this.dotPosX[this.mot.trial][i] - this.mot.dotRad,
          this.dotPosY[this.mot.trial][i] - this.mot.dotRad,
          this.mot.imageSize,
          this.mot.imageSize
        );
      }

      $("#exptCanvas").css({cursor: 'default'}); //reset the cursor to be visible
    }
  }

  //draw fixation point
  drawFix() {
    this.context.fillStyle = "white";
    this.context.fillRect(this.cx - 2, this.cy - 2, 5, 5);
    this.context.fillStyle = "black";
    this.context.fillRect(this.cx - 1, this.cy - 1, 3, 3);
  }

}
