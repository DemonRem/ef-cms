import { loginAs, setupTest, uploadPetition } from './helpers';
import { petitionerViewsDashboard } from './journey/petitionerViewsDashboard';
import petitionsClerkAddsCaseNote from './journey/petitionsClerkAddsCaseNote';
import petitionsClerkDeletesCaseNote from './journey/petitionsClerkDeletesCaseNote';

const test = setupTest();

describe('petitions clerk case notes journey', () => {
  beforeAll(() => {
    jest.setTimeout(30000);
  });

  loginAs(test, 'petitioner');
  it('Create case', async () => {
    await uploadPetition(test);
  });
  petitionerViewsDashboard(test);

  loginAs(test, 'petitionsclerk');
  petitionsClerkAddsCaseNote(test);
  petitionsClerkDeletesCaseNote(test);
});
