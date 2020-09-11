import { INITIAL_DOCUMENT_TYPES } from '../business/entities/EntityConstants';

exports.MOCK_DOCUMENTS = [
  {
    createdAt: '2018-11-21T20:49:28.192Z',
    docketNumber: '101-18',
    documentId: 'c6b81f4d-1e47-423a-8caf-6d2fdc3d3859',
    documentTitle: 'Petition',
    documentType: 'Petition',
    eventCode: 'P',
    filedBy: 'Test Petitioner',
    filingDate: '2018-03-01T00:01:00.000Z',
    index: 1,
    isFileAttached: true,
    isOnDocketRecord: true,
    processingStatus: 'complete',
    userId: '7805d1ab-18d0-43ec-bafb-654e83405416',
  },
  {
    createdAt: '2018-11-21T20:49:28.192Z',
    docketNumber: '101-18',
    documentId: 'abc81f4d-1e47-423a-8caf-6d2fdc3d3859',
    documentTitle: 'Statement of Taxpayer Identification',
    documentType: INITIAL_DOCUMENT_TYPES.stin.documentType,
    eventCode: INITIAL_DOCUMENT_TYPES.stin.eventCode,
    isFileAttached: true,
    processingStatus: 'pending',
    userId: '7805d1ab-18d0-43ec-bafb-654e83405416',
  },
  {
    createdAt: '2018-11-21T20:49:28.192Z',
    docketNumber: '101-18',
    documentId: 'e6b81f4d-1e47-423a-8caf-6d2fdc3d3859',
    documentTitle: 'Answer',
    documentType: 'Answer',
    eventCode: 'A',
    filedBy: 'Test Petitioner',
    isFileAttached: true,
    processingStatus: 'pending',
    userId: '7805d1ab-18d0-43ec-bafb-654e83405416',
  },
  {
    createdAt: '2018-11-21T20:49:28.192Z',
    docketNumber: '101-18',
    documentId: 'def81f4d-1e47-423a-8caf-6d2fdc3d3859',
    documentTitle: 'Proposed Stipulated Decision',
    documentType: 'Proposed Stipulated Decision',
    eventCode: 'PSDE',
    filedBy: 'Test Petitioner',
    isFileAttached: true,
    processingStatus: 'pending',
    userId: '7805d1ab-18d0-43ec-bafb-654e83405416',
  },
];
