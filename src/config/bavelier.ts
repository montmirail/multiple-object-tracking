import {Config} from '../interfaces/config';

export const config: Config = {
  numDots: 16,
  straightProb: 0.4, // Probability that a dot will move in a straight line
  angSD: 0.2,        // Maximum deviation from a dot's current angle of motion in order to vary dot motion, if it is not moving in a straight line
};
