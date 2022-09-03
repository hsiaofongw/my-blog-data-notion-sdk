export const slowDown = (ms: number): Promise<null> => {
  return new Promise((resolve) => {
    // console.log(`Sleeping for ${ms} miliseconds...`);
    setTimeout(() => resolve(null), ms);
  });
};
