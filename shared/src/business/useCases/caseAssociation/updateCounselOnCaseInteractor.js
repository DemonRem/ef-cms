const {
  isAuthorized,
  ROLE_PERMISSIONS,
} = require('../../../authorization/authorizationClientService');
const {
  ROLES,
  SERVICE_INDICATOR_TYPES,
} = require('../../entities/EntityConstants');
const { Case } = require('../../entities/cases/Case');
const { UnauthorizedError } = require('../../../errors/errors');

/**
 * updateCounselOnCaseInteractor
 *
 * @param {object} providers the providers object
 * @param {object} providers.applicationContext the application context
 * @param {string} providers.docketNumber the docket number of the case the user is attached to
 * @param {object} providers.userData the data being updated on the user
 * @param {string} providers.userId the id of the user to be updated on the case
 * @returns {Promise} the promise of the update case call
 */
exports.updateCounselOnCaseInteractor = async ({
  applicationContext,
  docketNumber,
  userData,
  userId,
}) => {
  const user = applicationContext.getCurrentUser();

  const editableFields = {
    representingPrimary: userData.representingPrimary,
    representingSecondary: userData.representingSecondary,
    serviceIndicator: userData.serviceIndicator,
  };

  if (!isAuthorized(user, ROLE_PERMISSIONS.ASSOCIATE_USER_WITH_CASE)) {
    throw new UnauthorizedError('Unauthorized');
  }

  const caseToUpdate = await applicationContext
    .getPersistenceGateway()
    .getCaseByDocketNumber({
      applicationContext,
      docketNumber,
    });

  const userToUpdate = await applicationContext
    .getPersistenceGateway()
    .getUserById({
      applicationContext,
      userId,
    });

  const caseEntity = new Case(caseToUpdate, { applicationContext });

  if (userToUpdate.role === ROLES.privatePractitioner) {
    const representing = [];
    if (editableFields.representingPrimary) {
      representing.push(caseEntity.contactPrimary.contactId);
    }
    if (editableFields.representingSecondary) {
      representing.push(caseEntity.contactSecondary.contactId);
    }

    caseEntity.updatePrivatePractitioner({
      representing,
      userId,
      ...editableFields,
    });
    if (userData.representingPrimary) {
      caseEntity.contactPrimary.serviceIndicator =
        SERVICE_INDICATOR_TYPES.SI_NONE;
    }
    if (caseEntity.contactSecondary && userData.representingSecondary) {
      caseEntity.contactSecondary.serviceIndicator =
        SERVICE_INDICATOR_TYPES.SI_NONE;
    }
  } else if (userToUpdate.role === ROLES.irsPractitioner) {
    caseEntity.updateIrsPractitioner({
      userId,
      ...editableFields,
    });
  } else {
    throw new Error('User is not a practitioner');
  }

  const updatedCase = await applicationContext
    .getPersistenceGateway()
    .updateCase({
      applicationContext,
      caseToUpdate: caseEntity.validate().toRawObject(),
    });

  return new Case(updatedCase, { applicationContext }).validate().toRawObject();
};
