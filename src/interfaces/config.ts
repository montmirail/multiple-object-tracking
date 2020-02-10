export interface Config {
  numDots: number;
  straightProb: number;
  angSD: number;
  speed: number; //length of time for each frame (ms/frame)
  durationCue: number; //duration of presentation of cue (ms)
  durationMove: number; //duration of dots moving (after the cue period) before asking about probed dot (ms)
  velocity: number; //velocity of dots in degrees/sec
}
