import { connect } from '@cerebral/react';
import React from 'react';

import SuccessNotification from './SuccessNotification';
import ErrorNotification from './ErrorNotification';
import CaseList from './CaseList';

export default connect(
  {},
  function DashboardPetitioner() {
    return (
      <section className="usa-section usa-grid">
        <h1 tabIndex="-1">Dashboard</h1>
        <SuccessNotification />
        <ErrorNotification />
        <a className="usa-button" href="/start-a-case" id="init-file-petition">
          Start a case
        </a>
        <CaseList />
      </section>
    );
  },
);
