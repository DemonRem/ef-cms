import { fileCourtIssuedDocketEntryInteractor } from './fileCourtIssuedDocketEntryInteractor';
const { Case } = require('../../entities/cases/Case');
const { ContactFactory } = require('../../entities/contacts/ContactFactory');
const { User } = require('../../entities/User');

describe('fileCourtIssuedDocketEntryInteractor', () => {
  let updateCaseMock;
  let createUserInboxRecordMock;
  let createSectionInboxRecordMock;
  let applicationContext;
  let caseRecord;
  let getCaseDeadlinesByCaseIdMock;

  beforeEach(() => {
    updateCaseMock = jest.fn(() => caseRecord);
    createUserInboxRecordMock = jest.fn();
    createSectionInboxRecordMock = jest.fn();
    getCaseDeadlinesByCaseIdMock = jest.fn().mockReturnValue([]);

    applicationContext = {
      environment: { stage: 'local' },
      getCurrentUser: () => {
        return {
          name: 'Olivia Jade',
          userId: 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
        };
      },
      getPersistenceGateway: () => ({
        createSectionInboxRecord: createSectionInboxRecordMock,
        createUserInboxRecord: createUserInboxRecordMock,
        getCaseByCaseId: async () => caseRecord,
        getCaseDeadlinesByCaseId: getCaseDeadlinesByCaseIdMock,
        getUserById: async () => {
          return applicationContext.getCurrentUser();
        },
        updateCase: updateCaseMock,
      }),
      getUniqueId: () => 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
    };

    caseRecord = {
      caseCaption: 'Caption',
      caseId: 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
      caseType: 'Deficiency',
      contactPrimary: {
        name: 'Guy Fieri',
      },
      createdAt: '',
      docketNumber: '45678-18',
      docketRecord: [
        {
          description: 'first record',
          documentId: '8675309b-18d0-43ec-bafb-654e83405411',
          eventCode: 'P',
          filingDate: '2018-03-01T00:01:00.000Z',
          index: 1,
        },
      ],
      documents: [
        {
          docketNumber: '45678-18',
          documentId: 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
          documentTitle: 'Answer',
          documentType: 'Answer',
          eventCode: 'A',
          userId: 'respondent',
        },
        {
          docketNumber: '45678-18',
          documentId: 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
          documentTitle: 'Answer',
          documentType: 'Answer',
          eventCode: 'A',
          userId: 'respondent',
        },
        {
          docketNumber: '45678-18',
          documentId: 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
          documentTitle: 'Answer',
          documentType: 'Answer',
          eventCode: 'A',
          userId: 'respondent',
        },
        {
          docketNumber: '45678-18',
          documentId: 'c54ba5a9-b37b-479d-9201-067ec6e335ba',
          documentTitle: 'Order',
          documentType: 'Order',
          eventCode: 'O',
          userId: 'respondent',
        },
        {
          docketNumber: '45678-18',
          documentId: 'c54ba5a9-b37b-479d-9201-067ec6e335bc',
          documentTitle: 'Order to Show Cause',
          documentType: 'Order to Show Cause',
          eventCode: 'OSC',
          userId: 'respondent',
        },
      ],
      filingType: 'Myself',
      partyType: ContactFactory.PARTY_TYPES.petitioner,
      preferredTrialCity: 'Fresno, California',
      procedureType: 'Regular',
      role: User.ROLES.petitioner,
      userId: 'petitioner',
    };
  });

  it('should throw an error if not authorized', async () => {
    let error;
    try {
      await fileCourtIssuedDocketEntryInteractor({
        applicationContext,
        documentMeta: {
          caseId: caseRecord.caseId,
          documentId: 'c54ba5a9-b37b-479d-9201-067ec6e335bc',
          documentType: 'Memorandum in Support',
        },
      });
    } catch (err) {
      error = err;
    }
    expect(error.message).toContain('Unauthorized');
  });

  it('should throw an error if the document is not found on the case', async () => {
    let error;
    applicationContext.getCurrentUser = () => ({
      name: 'Olivia Jade',
      role: User.ROLES.docketClerk,
      userId: 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
    });

    try {
      await fileCourtIssuedDocketEntryInteractor({
        applicationContext,
        documentMeta: {
          caseId: caseRecord.caseId,
          documentId: 'c54ba5a9-b37b-479d-9201-067ec6e335bd',
          documentType: 'Order',
        },
      });
    } catch (err) {
      error = err;
    }

    expect(error.message).toContain('Document not found');
  });

  it('should call updateCase, createUserInboxRecord, and createSectionInboxRecord', async () => {
    applicationContext.getCurrentUser = () => ({
      name: 'Olivia Jade',
      role: User.ROLES.docketClerk,
      section: 'docket',
      userId: 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
    });

    await fileCourtIssuedDocketEntryInteractor({
      applicationContext,
      documentMeta: {
        caseId: caseRecord.caseId,
        documentId: 'c54ba5a9-b37b-479d-9201-067ec6e335ba',
        documentTitle: 'Order',
        documentType: 'Order',
        eventCode: 'O',
        generatedDocumentTitle: 'Generated Order Document Title',
      },
    });

    expect(updateCaseMock).toHaveBeenCalled();
    expect(createUserInboxRecordMock).toHaveBeenCalled();
    expect(createSectionInboxRecordMock).toHaveBeenCalled();
  });

  it('should call updateCase and set the case as automatic blocked if the document is a tracked document', async () => {
    applicationContext.getCurrentUser = () => ({
      name: 'Olivia Jade',
      role: User.ROLES.docketClerk,
      section: 'docket',
      userId: 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
    });

    await fileCourtIssuedDocketEntryInteractor({
      applicationContext,
      documentMeta: {
        caseId: caseRecord.caseId,
        documentId: 'c54ba5a9-b37b-479d-9201-067ec6e335bc',
        documentTitle: 'Order to Show Cause',
        documentType: 'Order to Show Cause',
        eventCode: 'OSC',
        generatedDocumentTitle: 'Generated Order Document Title',
      },
    });

    expect(updateCaseMock).toHaveBeenCalled();
    expect(updateCaseMock.mock.calls[0][0].caseToUpdate).toMatchObject({
      automaticBlocked: true,
      automaticBlockedDate: expect.anything(),
      automaticBlockedReason: Case.AUTOMATIC_BLOCKED_REASONS.pending,
    });
  });

  it('should call updateCase and set the case as automatic blocked with deadlines if the document is a tracked document and the case has deadlines', async () => {
    getCaseDeadlinesByCaseIdMock = jest.fn().mockReturnValue([
      {
        deadlineDate: 'sometime',
      },
    ]);
    applicationContext.getCurrentUser = () => ({
      name: 'Olivia Jade',
      role: User.ROLES.docketClerk,
      section: 'docket',
      userId: 'c54ba5a9-b37b-479d-9201-067ec6e335bb',
    });

    await fileCourtIssuedDocketEntryInteractor({
      applicationContext,
      documentMeta: {
        caseId: caseRecord.caseId,
        documentId: 'c54ba5a9-b37b-479d-9201-067ec6e335bc',
        documentTitle: 'Order to Show Cause',
        documentType: 'Order to Show Cause',
        eventCode: 'OSC',
        generatedDocumentTitle: 'Generated Order Document Title',
      },
    });

    expect(updateCaseMock).toHaveBeenCalled();
    expect(updateCaseMock.mock.calls[0][0].caseToUpdate).toMatchObject({
      automaticBlocked: true,
      automaticBlockedDate: expect.anything(),
      automaticBlockedReason: Case.AUTOMATIC_BLOCKED_REASONS.pendingAndDueDate,
    });
  });
});
