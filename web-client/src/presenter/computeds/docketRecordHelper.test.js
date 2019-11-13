import { User } from '../../../../shared/src/business/entities/User';
import { docketRecordHelper } from './docketRecordHelper';
import { getUserPermissions } from '../../../../shared/src/authorization/getUserPermissions';
import { runCompute } from 'cerebral/test';

const getBaseState = user => {
  return {
    permissions: getUserPermissions(user),
  };
};

describe('docket record helper', () => {
  it('should show direct download link and not document detail link if the user is a petitioner', () => {
    const user = {
      role: User.ROLES.petitioner,
      userId: '789',
    };
    const result = runCompute(docketRecordHelper, {
      state: {
        ...getBaseState(user),
        caseDetail: {},
        form: {},
      },
    });
    expect(result.showDirectDownloadLink).toEqual(true);
    expect(result.showDocumentDetailLink).toEqual(false);
  });

  it('should show direct download link and not document detail link if the user is a practitioner', () => {
    const user = {
      role: User.ROLES.practitioner,
      userId: '789',
    };
    const result = runCompute(docketRecordHelper, {
      state: {
        ...getBaseState(user),
        caseDetail: {},
        form: {},
      },
    });
    expect(result.showDirectDownloadLink).toEqual(true);
    expect(result.showDocumentDetailLink).toEqual(false);
  });

  it('should show direct download link and not document detail link if the user is a respondent', () => {
    const user = {
      role: User.ROLES.respondent,
      userId: '789',
    };
    const result = runCompute(docketRecordHelper, {
      state: {
        ...getBaseState(user),
        caseDetail: {},
        form: {},
      },
    });
    expect(result.showDirectDownloadLink).toEqual(true);
    expect(result.showDocumentDetailLink).toEqual(false);
  });

  it('should show document detail link and not direct download link if the user has UPDATE_CASE permission', () => {
    const result = runCompute(docketRecordHelper, {
      state: {
        caseDetail: {},
        form: {},
        permissions: {
          UPDATE_CASE: true,
        },
      },
    });
    expect(result.showDocumentDetailLink).toEqual(true);
    expect(result.showDirectDownloadLink).toEqual(false);
  });

  it('should show links for editing docket entries if user has DOCKET_ENTRY permission', () => {
    const result = runCompute(docketRecordHelper, {
      state: {
        caseDetail: {},
        form: {},
        permissions: {
          DOCKET_ENTRY: true,
        },
      },
    });
    expect(result.showEditDocketEntry).toEqual(true);
  });

  it('should not show links for editing docket entries if user does not have DOCKET_ENTRY permission', () => {
    const result = runCompute(docketRecordHelper, {
      state: {
        caseDetail: {},
        form: {},
        permissions: {
          DOCKET_ENTRY: false,
        },
      },
    });
    expect(result.showEditDocketEntry).toEqual(false);
  });

  it('should show file document button if user has FILE_EXTERNAL_DOCUMENT permission and the user is associated with the case', () => {
    const result = runCompute(docketRecordHelper, {
      state: {
        caseDetail: {},
        currentPage: 'CaseDetail',
        form: {},
        permissions: {
          FILE_EXTERNAL_DOCUMENT: true,
        },
        screenMetadata: { isAssociated: true },
      },
    });
    expect(result.showFileDocumentButton).toEqual(true);
  });

  it('should not show file document button if user does not have FILE_EXTERNAL_DOCUMENT permission', () => {
    const result = runCompute(docketRecordHelper, {
      state: {
        caseDetail: {},
        currentPage: 'CaseDetail',
        form: {},
        permissions: {
          FILE_EXTERNAL_DOCUMENT: false,
        },
        screenMetadata: { isAssociated: true },
      },
    });
    expect(result.showFileDocumentButton).toEqual(false);
  });

  it('should not show file document button if user has FILE_EXTERNAL_DOCUMENT permission but the user is not associated with the case', () => {
    const result = runCompute(docketRecordHelper, {
      state: {
        caseDetail: {},
        currentPage: 'CaseDetail',
        form: {},
        permissions: {
          FILE_EXTERNAL_DOCUMENT: true,
        },
        screenMetadata: { isAssociated: false },
      },
    });
    expect(result.showFileDocumentButton).toEqual(false);
  });
});
