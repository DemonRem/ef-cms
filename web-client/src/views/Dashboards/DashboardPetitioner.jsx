import { BigHeader } from '../BigHeader';
import { Button } from '../../ustc-ui/Button/Button';
import { CaseListPetitioner } from '../CaseListPetitioner';
import { ErrorNotification } from '../ErrorNotification';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SuccessNotification } from '../SuccessNotification';
import { WhatToExpect } from '../WhatToExpect';
import { connect } from '@cerebral/react';
import { state } from 'cerebral';
import React from 'react';
import howToPrepareYourDocuments from '../../pdfs/how-to-prepare-your-documents.pdf';

export const DashboardPetitioner = connect(
  { dashboardExternalHelper: state.dashboardExternalHelper, user: state.user },
  function DashboardPetitioner({ dashboardExternalHelper, user }) {
    return (
      <React.Fragment>
        <BigHeader text={`Welcome, ${user.name}`} />
        <section className="usa-section grid-container">
          <SuccessNotification />
          <ErrorNotification />
          <div className="grid-row grid-gap taxpayer-tools">
            <div className="tablet:grid-col-8">
              {dashboardExternalHelper.showWhatToExpect && <WhatToExpect />}
              {dashboardExternalHelper.showCaseList && <CaseListPetitioner />}
            </div>
            <div className="tablet:grid-col-4">
              <div className="card">
                <div className="content-wrapper gray">
                  <h3>Taxpayer Tools</h3>
                  <hr />
                  <p>
                    <FontAwesomeIcon
                      className="fa-icon-blue"
                      icon="file-pdf"
                      size="1x"
                    />
                    <a
                      href={howToPrepareYourDocuments}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      How to Create a Case
                    </a>
                  </p>
                  <p>
                    <a
                      className="usa-link--external"
                      href="https://www.ustaxcourt.gov/dpt_cities.htm"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Find a Court Location
                    </a>
                  </p>
                  <p>
                    <a
                      className="usa-link--external"
                      href="https://www.ustaxcourt.gov/forms.htm"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      View Forms
                    </a>
                  </p>
                </div>
              </div>
              <div className="card">
                {dashboardExternalHelper.showWhatToExpect && (
                  <div className="content-wrapper gray">
                    <h3>Other Filing Options</h3>
                    <hr />
                    <p>
                      <strong>To file by mail:</strong>
                      <br />
                      Send required forms and filing fee to:
                      <br />
                      United States Tax Court
                      <br />
                      400 Second Street, NW
                      <br />
                      Washington, DC 20217
                    </p>

                    <p>
                      <strong>To file in person:</strong>
                      <br />
                      Please bring your forms and filing fee to:
                      <br />
                      United States Tax Court
                      <br />
                      400 Second Street, NW
                      <br />
                      Washington, DC 20217
                    </p>
                  </div>
                )}

                {dashboardExternalHelper.showCaseList && (
                  <div className="content-wrapper gray">
                    <h3>Filing Fee Options</h3>
                    <hr />
                    <p>
                      <strong>Pay by debit/credit card</strong>
                      <br />
                      Copy your docket number(s) and pay online.
                      <br />
                      <Button
                        className="margin-bottom-3 margin-top-3"
                        id="pay_filing_fee"
                      >
                        Pay now
                      </Button>
                      <hr />
                      <p>
                        Other options
                        <span className="other-options-icon">
                          <FontAwesomeIcon icon={['fas', 'plus']} />
                        </span>
                      </p>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </React.Fragment>
    );
  },
);
