import { clearAlertsAction } from '../actions/clearAlertsAction';
import { computeFormDateAction } from '../actions/computeFormDateAction';
import { setPractitionerDetailAction } from '../actions/setPractitionerDetailAction';
import { setShowModalFactoryAction } from '../actions/setShowModalFactoryAction';
import { setValidationAlertErrorsAction } from '../actions/setValidationAlertErrorsAction';
import { setValidationErrorsAction } from '../actions/setValidationErrorsAction';
import { setWaitingForResponseAction } from '../actions/setWaitingForResponseAction';
import { startShowValidationAction } from '../actions/startShowValidationAction';
import { startWebSocketConnectionAction } from '../actions/webSocketConnection/startWebSocketConnectionAction';
import { unsetWaitingForResponseAction } from '../actions/unsetWaitingForResponseAction';
import { updatePractitionerUserAction } from '../actions/updatePractitionerUserAction';
import { validateAddPractitionerAction } from '../actions/validateAddPractitionerAction';

export const submitUpdatePractitionerUserSequence = [
  clearAlertsAction,
  startShowValidationAction,
  computeFormDateAction,
  validateAddPractitionerAction,
  {
    error: [setValidationErrorsAction, setValidationAlertErrorsAction],
    success: [
      setWaitingForResponseAction,
      startWebSocketConnectionAction,
      {
        error: [
          unsetWaitingForResponseAction,
          setShowModalFactoryAction('WebSocketErrorModal'),
        ],
        success: [
          updatePractitionerUserAction,
          {
            error: [],
            success: [setPractitionerDetailAction],
          },
        ],
      },
    ],
  },
];
