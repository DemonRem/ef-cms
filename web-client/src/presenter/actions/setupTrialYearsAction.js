import { state } from 'cerebral';

/**
 * sets the state.trialYears
 *
 * @param {object} providers the providers object
 * @param {object} providers.store the cerebral store used for setting state.users
 */
export const setupTrialYearsAction = ({ applicationContext, store }) => {
  const currentYearString = applicationContext.getUtilities().getCurrentYear();
  const currentYearInt = parseInt(currentYearString);
  const currentYearPlus1 = `${currentYearInt + 1}`;
  const currentYearPlus2 = `${currentYearInt + 2}`;

  store.set(state.trialYears, [
    currentYearString,
    currentYearPlus1,
    currentYearPlus2,
  ]);
};
