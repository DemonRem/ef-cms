import { state } from 'cerebral';
import moment from 'moment';

export default async ({ applicationContext, get, path, props }) => {
  const useCases = applicationContext.getUseCases();

  const irsSendDate = await useCases.sendPetitionToIRS({
    caseId: get(state.caseDetail).caseId,
    userId: get(state.user.token),
    applicationContext,
  });
  props.docketNumber = get(state.caseDetail).docketNumber;
  return path.success({
    alertSuccess: {
      title: 'Successfully served to IRS',
      message: moment(irsSendDate).format('L LT'),
    },
  });
};