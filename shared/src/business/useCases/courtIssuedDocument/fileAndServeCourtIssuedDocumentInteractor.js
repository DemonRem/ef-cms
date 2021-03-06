const {
  aggregatePartiesForService,
} = require('../../utilities/aggregatePartiesForService');
const {
  createISODateString,
  formatDateString,
} = require('../../utilities/DateHandler');
const {
  ENTERED_AND_SERVED_EVENT_CODES,
  GENERIC_ORDER_DOCUMENT_TYPE,
} = require('../../entities/courtIssuedDocument/CourtIssuedDocumentConstants');
const {
  isAuthorized,
  ROLE_PERMISSIONS,
} = require('../../../authorization/authorizationClientService');
const {
  saveFileAndGenerateUrl,
} = require('../../useCaseHelper/saveFileAndGenerateUrl');
const { addServedStampToDocument } = require('./addServedStampToDocument');
const { Case } = require('../../entities/cases/Case');
const { DOCKET_SECTION } = require('../../entities/EntityConstants');
const { DocketEntry } = require('../../entities/DocketEntry');
const { NotFoundError, UnauthorizedError } = require('../../../errors/errors');
const { omit } = require('lodash');
const { TRANSCRIPT_EVENT_CODE } = require('../../entities/EntityConstants');
const { TrialSession } = require('../../entities/trialSessions/TrialSession');
const { WorkItem } = require('../../entities/WorkItem');

/**
 * fileAndServeCourtIssuedDocumentInteractor
 *
 * @param {object} providers the providers object
 * @param {object} providers.applicationContext the application context
 * @param {string} providers.documentMeta the document metadata
 * @returns {object} the url of the document that was served
 */
exports.fileAndServeCourtIssuedDocumentInteractor = async ({
  applicationContext,
  documentMeta,
}) => {
  const authorizedUser = applicationContext.getCurrentUser();

  const hasPermission =
    (isAuthorized(authorizedUser, ROLE_PERMISSIONS.DOCKET_ENTRY) ||
      isAuthorized(
        authorizedUser,
        ROLE_PERMISSIONS.CREATE_ORDER_DOCKET_ENTRY,
      )) &&
    isAuthorized(authorizedUser, ROLE_PERMISSIONS.SERVE_DOCUMENT);

  if (!hasPermission) {
    throw new UnauthorizedError('Unauthorized');
  }

  const { docketEntryId, docketNumber } = documentMeta;

  const caseToUpdate = await applicationContext
    .getPersistenceGateway()
    .getCaseByDocketNumber({
      applicationContext,
      docketNumber,
    });

  let caseEntity = new Case(caseToUpdate, { applicationContext });

  const docketEntry = caseEntity.getDocketEntryById({
    docketEntryId,
  });

  if (!docketEntry) {
    throw new NotFoundError('Docket entry not found');
  }

  const user = await applicationContext
    .getPersistenceGateway()
    .getUserById({ applicationContext, userId: authorizedUser.userId });

  let secondaryDate;
  if (documentMeta.eventCode === TRANSCRIPT_EVENT_CODE) {
    secondaryDate = documentMeta.date;
  }

  const numberOfPages = await applicationContext
    .getUseCaseHelpers()
    .countPagesInDocument({ applicationContext, docketEntryId });

  // Serve on all parties
  const servedParties = aggregatePartiesForService(caseEntity);

  const docketEntryEntity = new DocketEntry(
    {
      ...omit(docketEntry, 'filedBy'),
      attachments: documentMeta.attachments,
      date: documentMeta.date,
      documentTitle: documentMeta.generatedDocumentTitle,
      documentType: documentMeta.documentType,
      editState: JSON.stringify(documentMeta),
      eventCode: documentMeta.eventCode,
      filedBy: undefined,
      filingDate: createISODateString(),
      freeText: documentMeta.freeText,
      isDraft: false,
      isFileAttached: true,
      isOnDocketRecord: true,
      judge: documentMeta.judge,
      numberOfPages,
      scenario: documentMeta.scenario,
      secondaryDate,
      serviceStamp: documentMeta.serviceStamp,
      userId: user.userId,
    },
    { applicationContext },
  );

  docketEntryEntity.setAsServed(servedParties.all);

  const servedDocketEntryWorkItem = new WorkItem(
    {
      assigneeId: null,
      assigneeName: null,
      associatedJudge: caseToUpdate.associatedJudge,
      caseIsInProgress: caseEntity.inProgress,
      caseStatus: caseToUpdate.status,
      caseTitle: Case.getCaseTitle(Case.getCaseCaption(caseEntity)),
      docketEntry: {
        ...docketEntryEntity.toRawObject(),
        createdAt: docketEntryEntity.createdAt,
      },
      docketNumber: caseToUpdate.docketNumber,
      docketNumberWithSuffix: caseToUpdate.docketNumberWithSuffix,
      hideFromPendingMessages: true,
      inProgress: true,
      section: DOCKET_SECTION,
      sentBy: user.name,
      sentByUserId: user.userId,
    },
    { applicationContext },
  );

  if (docketEntry.workItem) {
    await applicationContext.getPersistenceGateway().deleteWorkItemFromInbox({
      applicationContext,
      workItem: docketEntry.workItem,
    });
  }

  servedDocketEntryWorkItem.setAsCompleted({ message: 'completed', user });
  docketEntryEntity.setWorkItem(servedDocketEntryWorkItem);
  caseEntity.updateDocketEntry(docketEntryEntity);

  servedDocketEntryWorkItem.assignToUser({
    assigneeId: user.userId,
    assigneeName: user.name,
    section: user.section,
    sentBy: user.name,
    sentBySection: user.section,
    sentByUserId: user.userId,
  });

  await applicationContext.getPersistenceGateway().putWorkItemInUsersOutbox({
    applicationContext,
    section: user.section,
    userId: user.userId,
    workItem: servedDocketEntryWorkItem.validate().toRawObject(),
  });

  // SERVE
  const { PDFDocument } = await applicationContext.getPdfLib();

  const { Body: pdfData } = await applicationContext
    .getStorageClient()
    .getObject({
      Bucket: applicationContext.environment.documentsBucketName,
      Key: docketEntryId,
    })
    .promise();

  let serviceStampType = 'Served';

  if (docketEntryEntity.documentType === GENERIC_ORDER_DOCUMENT_TYPE) {
    serviceStampType = docketEntryEntity.serviceStamp;
  } else if (
    ENTERED_AND_SERVED_EVENT_CODES.includes(docketEntryEntity.eventCode)
  ) {
    serviceStampType = 'Entered and Served';
  }

  const serviceStampDate = formatDateString(
    docketEntryEntity.servedAt,
    'MMDDYY',
  );

  const newPdfData = await addServedStampToDocument({
    applicationContext,
    pdfData,
    serviceStampText: `${serviceStampType} ${serviceStampDate}`,
  });

  await applicationContext.getPersistenceGateway().saveDocumentFromLambda({
    applicationContext,
    document: newPdfData,
    key: docketEntryId,
  });

  caseEntity = await applicationContext
    .getUseCaseHelpers()
    .updateCaseAutomaticBlock({
      applicationContext,
      caseEntity,
    });

  if (ENTERED_AND_SERVED_EVENT_CODES.includes(docketEntryEntity.eventCode)) {
    caseEntity.closeCase();

    await applicationContext
      .getPersistenceGateway()
      .deleteCaseTrialSortMappingRecords({
        applicationContext,
        docketNumber: caseEntity.docketNumber,
      });

    if (caseEntity.trialSessionId) {
      const trialSession = await applicationContext
        .getPersistenceGateway()
        .getTrialSessionById({
          applicationContext,
          trialSessionId: caseEntity.trialSessionId,
        });

      const trialSessionEntity = new TrialSession(trialSession, {
        applicationContext,
      });

      if (trialSessionEntity.isCalendared) {
        trialSessionEntity.removeCaseFromCalendar({
          disposition: 'Status was changed to Closed',
          docketNumber,
        });
      } else {
        trialSessionEntity.deleteCaseFromCalendar({
          docketNumber: caseEntity.docketNumber,
        });
      }

      await applicationContext.getPersistenceGateway().updateTrialSession({
        applicationContext,
        trialSessionToUpdate: trialSessionEntity.validate().toRawObject(),
      });
    }
  }

  await applicationContext.getPersistenceGateway().updateCase({
    applicationContext,
    caseToUpdate: caseEntity.validate().toRawObject(),
  });

  await applicationContext.getUseCaseHelpers().sendServedPartiesEmails({
    applicationContext,
    caseEntity,
    docketEntryId: docketEntryEntity.docketEntryId,
    servedParties,
  });

  if (servedParties.paper.length > 0) {
    const courtIssuedOrderDoc = await PDFDocument.load(newPdfData);

    let newPdfDoc = await PDFDocument.create();

    await applicationContext
      .getUseCaseHelpers()
      .appendPaperServiceAddressPageToPdf({
        applicationContext,
        caseEntity,
        newPdfDoc,
        noticeDoc: courtIssuedOrderDoc,
        servedParties,
      });

    const paperServicePdfData = await newPdfDoc.save();
    const { url } = await saveFileAndGenerateUrl({
      applicationContext,
      file: paperServicePdfData,
      useTempBucket: true,
    });

    return { pdfUrl: url };
  }
};
