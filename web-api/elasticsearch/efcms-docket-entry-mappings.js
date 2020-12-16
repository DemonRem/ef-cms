module.exports = {
  properties: {
    'associatedJudge.S': {
      index: false,
      type: 'text',
    },
    case_relations: {
      relations: {
        case: 'document',
      },
      type: 'join',
    },
    'caseCaption.S': {
      type: 'text',
    },
    'contactPrimary.M.name.S': {
      type: 'text',
    },
    'contactSecondary.M.name.S': {
      type: 'text',
    },
    'docketEntryId.S': {
      index: false,
      type: 'text',
    },
    'docketNumber.S': {
      type: 'keyword',
    },
    'docketNumberSuffix.S': {
      index: false,
      type: 'text',
    },
    'docketNumberWithSuffix.S': {
      index: false,
      type: 'text',
    },
    'documentContents.S': {
      analyzer: 'ustc_analyzer',
      type: 'text',
    },
    'documentTitle.S': {
      analyzer: 'ustc_analyzer',
      type: 'text',
    },
    'documentType.S': {
      type: 'keyword',
    },
    'entityName.S': {
      index: false,
      type: 'keyword',
    },
    'eventCode.S': {
      type: 'keyword',
    },
    'filingDate.S': {
      type: 'date',
    },
    'indexedTimestamp.N': {
      index: false,
      type: 'integer',
    },
    'irsPractitioners.L.M.userId.S': {
      index: false,
      type: 'text',
    },
    'isLegacyServed.BOOL': {
      index: false,
      type: 'boolean',
    },
    'isSealed.BOOL': {
      type: 'boolean',
    },
    'isStricken.BOOL': {
      type: 'boolean',
    },
    'judge.S': {
      type: 'keyword',
    },
    'numberOfPages.N': {
      index: false,
      type: 'short',
    },
    'pending.BOOL': {
      index: false,
      type: 'boolean',
    },
    'pk.S': {
      type: 'keyword',
    },
    'privatePractitioners.L.M.userId.S': {
      index: false,
      type: 'text',
    },
    'receivedAt.S': {
      index: false,
      type: 'date',
    },
    'sealedDate.S': {
      index: false,
      type: 'date',
    },
    'servedAt.S': {
      type: 'date',
    },
    'signedJudgeName.S': {
      type: 'text',
    },
    'sk.S': {
      type: 'keyword',
    },
  },
};
