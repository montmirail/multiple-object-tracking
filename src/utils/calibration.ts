/* Calibration/calibrationcode.js
 * This js code does the calculation for pixels/degree, based on the subject's screen size
 * and moves the subject along through each step. At the end, it sends the relevant calibration
 * information to a php script (addcalibration.php) so that the data can be added to the
 * database.
 */

const distance = 58; //cm, chosen distance from screen as this approximates to an arm's length
const pxDiagonal = Math.sqrt(Math.pow(screen.width,2) + Math.pow(screen.height,2)); //get the screen's diagonal size in pixels

//slider parameters for changing the displayed object's size
//the units are inches * 10 (the * 10 helps to elongate the slider's appearances)
const screenMin = 10; //minimum screen size allowed for the task
const screenMax = 40; //maximum screen size allowed for the task
const min = screenMin * 10;
const max = screenMax * 10;


/**
 * This function calculates pixels per degrees, based on the size of the monitor
 */
export const getCalibration = (screenSize: number = 24) => {
  // first pixels per inch is converted to pixels per centimeter (used for drawing the brightness/contrast grayscale rectangles)
  const pxPerInch = pxDiagonal / screenSize;
  const pxPerCm = Math.round(pxPerInch / 2.54);

  //then calculate pixels per degree
  const angle = Math.atan(screen.height / screen.width);
  const diagCM = ((max - (max - screenSize*10 + min) + min) / 10) * 2.54;
  const screenWidthCM = diagCM * Math.cos(angle);
  const pxPerDeg = Math.PI / 180 * screen.width * distance / screenWidthCM;
  //get the subject's current local time
  const date = new Date();
  const localSec = Math.round(date.getTime() / 1000) - date.getTimezoneOffset() * 60;

  debugger;

  return {
    pxWidth: screen.width, //screen width in pixels
    pxHeight: screen.height, //screen height in pixels
    pxPerDeg, //pixels per degree conversion value for this screen
    localSec, //subject's current time
  }
};
