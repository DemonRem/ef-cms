const {
  COURT_ISSUED_DOCUMENT_TYPES,
  DOCUMENT_NOTICE_EVENT_CODES,
  DOCUMENT_PROCESSING_STATUS_OPTIONS,
  EXTERNAL_DOCUMENT_TYPES,
  PRACTITIONER_ASSOCIATION_DOCUMENT_TYPES,
  TRACKED_DOCUMENT_TYPES,
} = require('./EntityConstants');
const {
  DOCKET_ENTRY_VALIDATION_RULES,
} = require('./EntityValidationConstants');
const {
  joiValidationDecorator,
  validEntityDecorator,
} = require('../../utilities/JoiValidationDecorator');
const { createISODateString } = require('../utilities/DateHandler');
const { User } = require('./User');
const { WorkItem } = require('./WorkItem');

DocketEntry.validationName = 'DocketEntry';
/**
 * constructor
 *
 * @param {object} rawDocketEntry the raw docket entry data
 * @constructor
 */
function DocketEntry() {
  this.entityName = 'DocketEntry';
}

DocketEntry.prototype.init = function init(
  rawDocketEntry,
  { applicationContext, filtered = false },
) {
  if (!applicationContext) {
    throw new TypeError('applicationContext must be defined');
  }
  if (
    !filtered ||
    User.isInternalUser(applicationContext.getCurrentUser().role)
  ) {
    this.editState = rawDocketEntry.editState;
    this.draftOrderState = rawDocketEntry.draftOrderState;
    this.isDraft = rawDocketEntry.isDraft || false;
    this.judge = rawDocketEntry.judge;
    this.pending =
      rawDocketEntry.pending === undefined
        ? DocketEntry.isPendingOnCreation(rawDocketEntry)
        : rawDocketEntry.pending;
    if (rawDocketEntry.previousDocument) {
      this.previousDocument = {
        docketEntryId: rawDocketEntry.previousDocument.docketEntryId,
        documentTitle: rawDocketEntry.previousDocument.documentTitle,
        documentType: rawDocketEntry.previousDocument.documentType,
      };
    }
    this.processingStatus = rawDocketEntry.processingStatus || 'pending';
    this.qcAt = rawDocketEntry.qcAt;
    this.qcByUserId = rawDocketEntry.qcByUserId;
    this.signedAt = rawDocketEntry.signedAt;
    this.signedByUserId = rawDocketEntry.signedByUserId;
    this.signedJudgeName = rawDocketEntry.signedJudgeName;
    this.userId = rawDocketEntry.userId;
    this.workItem = rawDocketEntry.workItem
      ? new WorkItem(rawDocketEntry.workItem, { applicationContext })
      : undefined;
  }

  this.action = rawDocketEntry.action;
  this.additionalInfo = rawDocketEntry.additionalInfo;
  this.additionalInfo2 = rawDocketEntry.additionalInfo2;
  this.addToCoversheet = rawDocketEntry.addToCoversheet;
  this.archived = rawDocketEntry.archived;
  this.attachments = rawDocketEntry.attachments;
  this.certificateOfService = rawDocketEntry.certificateOfService;
  this.certificateOfServiceDate = rawDocketEntry.certificateOfServiceDate;
  this.createdAt = rawDocketEntry.createdAt || createISODateString();
  this.date = rawDocketEntry.date;
  this.docketEntryId =
    rawDocketEntry.docketEntryId || applicationContext.getUniqueId();
  this.docketNumber = rawDocketEntry.docketNumber;
  this.docketNumbers = rawDocketEntry.docketNumbers;
  this.documentContentsId = rawDocketEntry.documentContentsId;
  this.documentIdBeforeSignature = rawDocketEntry.documentIdBeforeSignature;
  this.documentTitle = rawDocketEntry.documentTitle;
  this.documentType = rawDocketEntry.documentType;
  this.eventCode = rawDocketEntry.eventCode;
  this.filedBy = rawDocketEntry.filedBy;
  this.filingDate = rawDocketEntry.filingDate || createISODateString();
  this.freeText = rawDocketEntry.freeText;
  this.freeText2 = rawDocketEntry.freeText2;
  this.hasOtherFilingParty = rawDocketEntry.hasOtherFilingParty;
  this.hasSupportingDocuments = rawDocketEntry.hasSupportingDocuments;
  this.index = rawDocketEntry.index;
  this.isAutoGenerated = rawDocketEntry.isAutoGenerated;
  this.isFileAttached = rawDocketEntry.isFileAttached;
  this.isLegacy = rawDocketEntry.isLegacy;
  this.isLegacySealed = rawDocketEntry.isLegacySealed;
  this.isLegacyServed = rawDocketEntry.isLegacyServed;
  this.isMinuteEntry = rawDocketEntry.isMinuteEntry || false;
  this.isOnDocketRecord = rawDocketEntry.isOnDocketRecord || false;
  this.isPaper = rawDocketEntry.isPaper;
  this.isSealed = rawDocketEntry.isSealed;
  this.isStricken = rawDocketEntry.isStricken || false;
  this.lodged = rawDocketEntry.lodged;
  this.mailingDate = rawDocketEntry.mailingDate;
  this.numberOfPages = rawDocketEntry.numberOfPages;
  this.objections = rawDocketEntry.objections;
  this.ordinalValue = rawDocketEntry.ordinalValue;
  this.otherFilingParty = rawDocketEntry.otherFilingParty;
  this.partyIrsPractitioner = rawDocketEntry.partyIrsPractitioner;
  this.partyPrimary = rawDocketEntry.partyPrimary;
  this.partySecondary = rawDocketEntry.partySecondary;
  this.receivedAt = rawDocketEntry.receivedAt || createISODateString();
  this.relationship = rawDocketEntry.relationship;
  this.scenario = rawDocketEntry.scenario;
  this.secondaryDate = rawDocketEntry.secondaryDate;
  this.secondaryDocument = rawDocketEntry.secondaryDocument;
  this.servedAt = rawDocketEntry.servedAt;
  this.servedPartiesCode = rawDocketEntry.servedPartiesCode;
  this.serviceDate = rawDocketEntry.serviceDate;
  this.serviceStamp = rawDocketEntry.serviceStamp;
  this.strickenAt = rawDocketEntry.strickenAt;
  this.strickenBy = rawDocketEntry.strickenBy;
  this.strickenByUserId = rawDocketEntry.strickenByUserId;
  this.supportingDocument = rawDocketEntry.supportingDocument;
  this.trialLocation = rawDocketEntry.trialLocation;

  // only share the userId with an external user if it is the logged in user
  if (applicationContext.getCurrentUser().userId === rawDocketEntry.userId) {
    this.userId = rawDocketEntry.userId;
  }

  // only use the privatePractitioner name
  if (Array.isArray(rawDocketEntry.privatePractitioners)) {
    this.privatePractitioners = rawDocketEntry.privatePractitioners.map(
      item => {
        return {
          name: item.name,
          partyPrivatePractitioner: item.partyPrivatePractitioner,
        };
      },
    );
  }

  if (Array.isArray(rawDocketEntry.servedParties)) {
    this.servedParties = rawDocketEntry.servedParties.map(item => {
      return {
        email: item.email,
        name: item.name,
        role: item.role,
      };
    });
  } else {
    this.servedParties = rawDocketEntry.servedParties;
  }

  if (DOCUMENT_NOTICE_EVENT_CODES.includes(rawDocketEntry.eventCode)) {
    this.signedAt = createISODateString();
  }

  this.generateFiledBy(rawDocketEntry);
};

DocketEntry.isPendingOnCreation = rawDocketEntry => {
  const isPending = Object.values(TRACKED_DOCUMENT_TYPES).some(trackedType => {
    return (
      (rawDocketEntry.category &&
        trackedType.category === rawDocketEntry.category) ||
      (rawDocketEntry.eventCode &&
        trackedType.eventCode === rawDocketEntry.eventCode)
    );
  });
  return isPending;
};

joiValidationDecorator(DocketEntry, DOCKET_ENTRY_VALIDATION_RULES);

/**
 *
 * @param {WorkItem} workItem the work item to add to the document
 */
DocketEntry.prototype.setWorkItem = function (workItem) {
  this.workItem = workItem;
};

/**
 * sets the document as archived (used to hide from the ui)
 *
 */
DocketEntry.prototype.archive = function () {
  this.archived = true;
};

DocketEntry.prototype.setAsServed = function (servedParties = null) {
  this.servedAt = createISODateString();
  this.draftOrderState = null;

  if (servedParties) {
    this.servedParties = servedParties;
  }
};

/**
 * generates the filedBy string from parties selected for the document
and contact info from the case detail
 *
 * @param {object} caseDetail the case detail
 */
DocketEntry.prototype.generateFiledBy = function (caseDetail) {
  if (!this.filedBy) {
    let partiesArray = [];
    this.partyIrsPractitioner && partiesArray.push('Resp.');

    Array.isArray(this.privatePractitioners) &&
      this.privatePractitioners.forEach(practitioner => {
        practitioner.partyPrivatePractitioner &&
          partiesArray.push(`Counsel ${practitioner.name}`);
      });

    if (
      this.partyPrimary &&
      !this.partySecondary &&
      caseDetail.contactPrimary
    ) {
      partiesArray.push(`Petr. ${caseDetail.contactPrimary.name}`);
    } else if (
      this.partySecondary &&
      !this.partyPrimary &&
      caseDetail.contactSecondary
    ) {
      partiesArray.push(`Petr. ${caseDetail.contactSecondary.name}`);
    } else if (
      this.partyPrimary &&
      this.partySecondary &&
      caseDetail.contactPrimary &&
      caseDetail.contactSecondary
    ) {
      partiesArray.push(
        `Petrs. ${caseDetail.contactPrimary.name} & ${caseDetail.contactSecondary.name}`,
      );
    }

    const filedByArray = [];
    if (partiesArray.length) {
      filedByArray.push(partiesArray.join(' & '));
    }
    if (this.otherFilingParty) {
      filedByArray.push(this.otherFilingParty);
    }

    const filedByString = filedByArray.join(', ');
    if (filedByString) {
      this.filedBy = filedByString;
    }
  }
};
/**
 * attaches a signedAt date to the document
 *
 * @param {string} signByUserId the user id of the user who signed the document
 * @param {string} signedJudgeName the judge's signature for the document
 *
 */
DocketEntry.prototype.setSigned = function (signByUserId, signedJudgeName) {
  this.signedByUserId = signByUserId;
  this.signedJudgeName = signedJudgeName;
  this.signedAt = createISODateString();
};

/**
 * attaches a qc date and a user to the document
 *
 * @param {object} user the user completing QC process
 */
DocketEntry.prototype.setQCed = function (user) {
  this.qcByUserId = user.userId;
  this.qcAt = createISODateString();
};

DocketEntry.prototype.unsignDocument = function () {
  this.signedAt = null;
  this.signedJudgeName = null;
  this.signedByUserId = null;
};

DocketEntry.prototype.setAsProcessingStatusAsCompleted = function () {
  this.processingStatus = DOCUMENT_PROCESSING_STATUS_OPTIONS.COMPLETE;
};

DocketEntry.prototype.isAutoServed = function () {
  const isExternalDocumentType = EXTERNAL_DOCUMENT_TYPES.includes(
    this.documentType,
  );
  const isPractitionerAssociationDocumentType = PRACTITIONER_ASSOCIATION_DOCUMENT_TYPES.includes(
    this.documentType,
  );
  //if fully concatenated document title includes the word Simultaneous, do not auto-serve
  const isSimultaneous = (this.documentTitle || this.documentType).includes(
    'Simultaneous',
  );

  return (
    (isExternalDocumentType || isPractitionerAssociationDocumentType) &&
    !isSimultaneous
  );
};

DocketEntry.prototype.isCourtIssued = function () {
  return COURT_ISSUED_DOCUMENT_TYPES.includes(this.documentType);
};

/**
 * sets the number of pages for the docket entry
 *
 * @param {Number} numberOfPages the number of pages
 */
DocketEntry.prototype.setNumberOfPages = function (numberOfPages) {
  this.numberOfPages = numberOfPages;
};

/**
 * strikes this docket entry
 *
 * @param {object} obj param
 * @param {string} obj.name user name
 * @param {string} obj.userId user id
 */
DocketEntry.prototype.strikeEntry = function ({ name, userId }) {
  if (this.isOnDocketRecord) {
    this.isStricken = true;
    this.strickenBy = name;
    this.strickenByUserId = userId;
    this.strickenAt = createISODateString();
  } else {
    throw new Error(
      'Cannot strike a document that is not on the docket record.',
    );
  }
};

exports.DocketEntry = validEntityDecorator(DocketEntry);
