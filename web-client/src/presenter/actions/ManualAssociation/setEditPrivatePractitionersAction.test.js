import { runAction } from 'cerebral/test';
import { setEditPrivatePractitionersAction } from './setEditPrivatePractitionersAction';

describe('setEditPrivatePractitionersAction', () => {
  it('should set the state.caseDetail.privatePractitioners on state.modal', async () => {
    const result = await runAction(setEditPrivatePractitionersAction, {
      state: {
        caseDetail: {
          privatePractitioners: [
            { name: 'Test Practitioner1', representing: [], userId: '1' },
            { name: 'Test Practitioner2', representing: [], userId: '2' },
          ],
        },
      },
    });

    expect(result.state.modal.privatePractitioners).toEqual([
      {
        name: 'Test Practitioner1',
        representing: [],
        representingPrimary: false,
        representingSecondary: false,
        userId: '1',
      },
      {
        name: 'Test Practitioner2',
        representing: [],
        representingPrimary: false,
        representingSecondary: false,
        userId: '2',
      },
    ]);
  });

  it('should set representingPrimary to true for practitioners representing the primary contact on the case', async () => {
    const CONTACT_ID = '998009a9-e5f0-4feb-8246-f88e35749b59';

    const result = await runAction(setEditPrivatePractitionersAction, {
      state: {
        caseDetail: {
          contactPrimary: { contactId: CONTACT_ID },
          privatePractitioners: [
            {
              name: 'Test Practitioner1',
              representing: [CONTACT_ID],
              userId: '1',
            },
            { name: 'Test Practitioner2', representing: [], userId: '2' },
          ],
        },
      },
    });

    expect(result.state.modal.privatePractitioners).toMatchObject([
      { representingPrimary: true },
      { representingPrimary: false },
    ]);
  });

  it('should set representingSecondary to true for practitioners representing the secondary contact on the case', async () => {
    const SECONDARY_CONTACT_ID = '998009a9-e5f0-4feb-8246-f88e35749b59';

    const result = await runAction(setEditPrivatePractitionersAction, {
      state: {
        caseDetail: {
          contactPrimary: { contactId: '6d51ca19-ae30-4647-ba84-3b98fe7f1df8' },
          contactSecondary: { contactId: SECONDARY_CONTACT_ID },
          privatePractitioners: [
            {
              name: 'Test Practitioner1',
              representing: [SECONDARY_CONTACT_ID],
              userId: '1',
            },
            { name: 'Test Practitioner2', representing: [], userId: '2' },
          ],
        },
      },
    });

    expect(result.state.modal.privatePractitioners).toMatchObject([
      { representingSecondary: true },
      { representingSecondary: false },
    ]);
  });
});
