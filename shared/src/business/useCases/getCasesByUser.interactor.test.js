const { getCasesByUser } = require('./getCasesByUser.interactor');
const { omit } = require('lodash');
const { MOCK_CASE } = require('../../test/mockCase');

describe('Send petition to IRS', () => {
  let applicationContext;

  it('throws an error if the entity returned from persistence is invalid', async () => {
    applicationContext = {
      getPersistenceGateway: () => {
        return {
          getCasesByUser: () => Promise.resolve([omit(MOCK_CASE, 'documents')]),
        };
      },
      environment: { stage: 'local' },
    };
    let error;
    try {
      await getCasesByUser({
        userId: 'petitionsclerk',
        applicationContext,
      });
    } catch (err) {
      error = err;
    }
    expect(error.message).toContain(
      'The Case entity was invalid ValidationError: child "documents" fails because ["documents" must contain at least 1 items]',
    );
  });
});
