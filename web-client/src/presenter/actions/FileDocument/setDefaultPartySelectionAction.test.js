import { runAction } from 'cerebral/test';
import { setDefaultPartySelectionAction } from './setDefaultPartySelectionAction';

describe('setDefaultPartySelectionAction', () => {
  it('sets form.partyPrimary to true if the user is a petitioner', async () => {
    const result = await runAction(setDefaultPartySelectionAction, {
      state: {
        form: {
          partyPrimary: false,
        },
        user: {
          role: 'petitioner',
        },
      },
    });

    expect(result.state.form.partyPrimary).toEqual(true);
  });
  it('does not set form.partyPrimary if the user is not a petitioner', async () => {
    const result = await runAction(setDefaultPartySelectionAction, {
      state: {
        form: {
          partyPrimary: false,
        },
        user: {
          role: 'practitioner',
        },
      },
    });

    expect(result.state.form.partyPrimary).toEqual(false);
  });
});