import 'core-js/stable';
import 'regenerator-runtime/runtime';

module.exports = {
  addCaseToTrialSessionLambda: require('./trialSessions/addCaseToTrialSessionLambda')
    .handler,
  batchDownloadTrialSessionLambda: require('./trialSessions/batchDownloadTrialSessionLambda')
    .handler,
  createTrialSessionLambda: require('./trialSessions/createTrialSessionLambda')
    .handler,
  getCalendaredCasesForTrialSessionLambda: require('./trialSessions/getCalendaredCasesForTrialSessionLambda')
    .handler,
  getEligibleCasesForTrialSessionLambda: require('./trialSessions/getEligibleCasesForTrialSessionLambda')
    .handler,
  getTrialSessionDetailsLambda: require('./trialSessions/getTrialSessionDetailsLambda')
    .handler,
  getTrialSessionWorkingCopyLambda: require('./trialSessions/getTrialSessionWorkingCopyLambda')
    .handler,
  getTrialSessionsLambda: require('./trialSessions/getTrialSessionsLambda')
    .handler,
  removeCaseFromTrialLambda: require('./trialSessions/removeCaseFromTrialLambda')
    .handler,
  setTrialSessionAsSwingSessionLambda: require('./trialSessions/setTrialSessionAsSwingSessionLambda')
    .handler,
  setTrialSessionCalendarLambda: require('./trialSessions/setTrialSessionCalendarLambda')
    .handler,
  updateTrialSessionWorkingCopyLambda: require('./trialSessions/updateTrialSessionWorkingCopyLambda')
    .handler,
};
