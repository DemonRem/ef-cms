import { socketRouter } from './socketRouter';

let mockApp;
let mockSequence;
let mockCallback;

describe('socketRouter', () => {
  beforeEach(() => {
    mockSequence = jest.fn();
    mockCallback = jest.fn();

    mockApp = {
      getSequence: () => {
        return mockSequence;
      },
      getState: () => {
        return 'mockToken';
      },
    };
  });

  it('should call batchDownloadReadySequence and callback if present', async () => {
    socketRouter(
      mockApp,
      mockCallback,
    )({
      data: '{ "action": "batch_download_ready" }',
    });
    await socketRouter(mockApp)({
      data: '{ "action": "batch_download_ready" }',
    });
    expect(mockSequence.mock.calls.length).toBe(2);
    expect(mockCallback.mock.calls.length).toBe(1);
  });

  it('should call updateBatchDownloadProgressSequence if action is batch_download_docket_generated, batch_download_upload_start, or batch_download_progress', () => {
    socketRouter(mockApp)({
      data: '{ "action": "batch_download_docket_generated" }',
    });
    expect(mockSequence.mock.calls.length).toBe(1);
    socketRouter(mockApp)({
      data: '{ "action": "batch_download_upload_start" }',
    });
    expect(mockSequence.mock.calls.length).toBe(2);
    socketRouter(mockApp)({
      data: '{ "action": "batch_download_progress" }',
    });
    expect(mockSequence.mock.calls.length).toBe(3);
  });

  it('should call batchDownloadErrorSequence if action is batch_download_error', () => {
    socketRouter(mockApp)({
      data: '{ "action": "batch_download_error" }',
    });
    expect(mockSequence.mock.calls.length).toBe(1);
  });

  it('should call userContactUpdateInitialUpdateCompleteSequence if action is user_contact_initial_update_complete', () => {
    socketRouter(mockApp)({
      data: '{ "action": "user_contact_initial_update_complete" }',
    });
    expect(mockSequence.mock.calls.length).toBe(1);
  });

  it('should call userContactUpdateCompleteSequence if action is user_contact_full_update_complete', () => {
    socketRouter(mockApp)({
      data: '{ "action": "user_contact_full_update_complete" }',
    });
    expect(mockSequence.mock.calls.length).toBe(1);
  });

  it('should call userContactUpdateProgressSequence if action is user_contact_update_progress', () => {
    socketRouter(mockApp)({
      data: '{ "action": "user_contact_update_progress" }',
    });
    expect(mockSequence.mock.calls.length).toBe(1);
  });

  it('should call userContactUpdateErrorSequence if action is user_contact_update_error', () => {
    socketRouter(mockApp)({
      data: '{ "action": "user_contact_update_error" }',
    });
    expect(mockSequence.mock.calls.length).toBe(1);
  });

  it('should call noticeGenerationCompleteSequence if action is notice_generation_complete', () => {
    socketRouter(mockApp)({
      data: '{ "action": "notice_generation_complete" }',
    });
    expect(mockSequence.mock.calls.length).toBe(1);
  });

  it('should not call a sequence if action is an unknown action', () => {
    socketRouter(mockApp)({
      data: '{ "action": "unknown" }',
    });
    expect(mockSequence.mock.calls.length).toBe(0);
  });

  it('should not call a sequence if action is undefined', () => {
    socketRouter(mockApp)({
      data: '{ }',
    });
    expect(mockSequence.mock.calls.length).toBe(0);
  });
});
