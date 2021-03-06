const {
  applicationContext,
  getFakeFile,
} = require('../../test/createTestApplicationContext');
const {
  parseLegacyDocumentsInteractor,
} = require('./parseLegacyDocumentsInteractor');
const { MOCK_CASE } = require('../../../test/mockCase');

describe('parseLegacyDocumentsInteractor', () => {
  const mockDocketEntryId = MOCK_CASE.docketEntries[0].docketEntryId;
  const mockDocketNumber = '101-20';
  const mockDocumentsBucketName = 'mock-documents';
  const mockPdfTextContents = 'Gotta have my bowl, gotta have cereal';
  const mockUniqueID = '5e8efb4f-898e-4b7a-993f-691a6ef56fc9';

  beforeAll(() => {
    applicationContext.environment.documentsBucketName = mockDocumentsBucketName;

    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockReturnValue(MOCK_CASE);

    applicationContext.getUniqueId.mockReturnValue(mockUniqueID);
  });

  beforeEach(() => {
    applicationContext.getStorageClient().getObject.mockReturnValue({
      promise: async () => ({
        Body: Buffer.from(getFakeFile()),
      }),
    });
    applicationContext
      .getUseCaseHelpers()
      .parseAndScrapePdfContents.mockImplementation(() =>
        Promise.resolve(mockPdfTextContents),
      );
  });

  it('should retrieve the docketEntry document from s3 using the provided docketEntryId', async () => {
    await parseLegacyDocumentsInteractor({
      applicationContext,
      docketEntryId: mockDocketEntryId,
      docketNumber: mockDocketNumber,
    });

    expect(
      applicationContext.getStorageClient().getObject.mock.calls[0][0],
    ).toEqual({
      Bucket: mockDocumentsBucketName,
      Key: mockDocketEntryId,
    });
  });

  it('should throw an error when unable to retrieve the docketEntry document from s3', async () => {
    applicationContext.getStorageClient().getObject.mockReturnValue({
      promise: async () => Promise.reject(),
    });

    await expect(
      parseLegacyDocumentsInteractor({
        applicationContext,
        docketEntryId: mockDocketEntryId,
        docketNumber: mockDocketNumber,
      }),
    ).rejects.toThrow(
      `Docket entry document not found in S3. ${mockDocketNumber} ${mockDocketEntryId}`,
    );
  });

  it('should retrieve the case from persistence using the provided docketNumber', async () => {
    await parseLegacyDocumentsInteractor({
      applicationContext,
      docketEntryId: mockDocketEntryId,
      docketNumber: mockDocketNumber,
    });

    expect(
      applicationContext.getPersistenceGateway().getCaseByDocketNumber.mock
        .calls[0][0].docketNumber,
    ).toBe(mockDocketNumber);
  });

  it('should throw an error when the case does not have a docketEntry matching the provided docketEntryId', async () => {
    await expect(
      parseLegacyDocumentsInteractor({
        applicationContext,
        docketEntryId: 'abc-123',
        docketNumber: mockDocketNumber,
      }),
    ).rejects.toThrow('Docket entry not found. 101-20 abc-123');
  });

  it('should get the text content from the document retrieved from s3', async () => {
    await parseLegacyDocumentsInteractor({
      applicationContext,
      docketEntryId: mockDocketEntryId,
      docketNumber: mockDocketNumber,
    });

    expect(
      applicationContext.getUseCaseHelpers().parseAndScrapePdfContents,
    ).toHaveBeenCalled();
  });

  it('should throw a helpful error if the document processing fails', async () => {
    applicationContext
      .getUseCaseHelpers()
      .parseAndScrapePdfContents.mockImplementation(() => {
        throw new Error('Process killed');
      });

    await expect(
      parseLegacyDocumentsInteractor({
        applicationContext,
        docketEntryId: mockDocketEntryId,
        docketNumber: mockDocketNumber,
      }),
    ).rejects.toThrow(
      'Error scraping PDF contents. 101-20 ' +
        mockDocketEntryId +
        '; Process killed',
    );
  });

  it('should save the text content from the document to s3', async () => {
    await parseLegacyDocumentsInteractor({
      applicationContext,
      docketEntryId: mockDocketEntryId,
      docketNumber: mockDocketNumber,
    });

    const saveParams = applicationContext.getPersistenceGateway()
      .saveDocumentFromLambda.mock.calls[0][0];

    expect(saveParams.key).toEqual(mockUniqueID);
    expect(saveParams.contentType).toEqual('application/json');
    expect(saveParams.document).toEqual(
      Buffer.from(JSON.stringify({ documentContents: mockPdfTextContents })),
    );
  });

  it("should set the docketEntry's documentContentsId to the generated unique ID", async () => {
    await parseLegacyDocumentsInteractor({
      applicationContext,
      docketEntryId: mockDocketEntryId,
      docketNumber: mockDocketNumber,
    });

    expect(
      applicationContext.getPersistenceGateway().updateDocketEntry.mock
        .calls[0][0].document,
    ).toEqual(
      expect.objectContaining({
        docketEntryId: mockDocketEntryId,
        documentContentsId: mockUniqueID,
      }),
    );
  });
});
