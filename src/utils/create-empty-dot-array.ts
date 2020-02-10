//create empty template for 2D array (2 x numTrials)
export const createEmptyDotArray = (trials: number, dots: number): Array<any> => {
  const emptyDotArray = [];

  for( let i = 0; i < trials; i++) {
    emptyDotArray[i] = [];

    for( let j = 0; j < dots; j++) {
      emptyDotArray[i][j] = -1;
    }
  }

  return emptyDotArray;
};
