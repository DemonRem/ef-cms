import { connect } from '@cerebral/react';
import { state } from 'cerebral';
import React from 'react';

export const ClosedCases = connect(
  {
    formattedCases: state.formattedTrialSessionDetails.closedCases,
  },
  ({ formattedCases }) => {
    return (
      <React.Fragment>
        <div className="text-semibold push-right margin-bottom-2 margin-top-neg-205">
          Count: {formattedCases.length}
        </div>
        <table
          aria-describedby="closed-cases-tab"
          className="usa-table ustc-table trial-sessions subsection"
          id="closed-cases"
        >
          <thead>
            <tr>
              <th>Docket</th>
              <th>Case Caption</th>
              <th>Petitioner Counsel</th>
              <th>Respondent Counsel</th>
              <th>Disposition</th>
            </tr>
          </thead>
          {formattedCases.map((item, idx) => (
            <tbody key={idx}>
              <tr className="eligible-cases-row">
                <td>
                  <a href={`/case-detail/${item.docketNumber}`}>
                    {item.docketNumberWithSuffix}
                  </a>
                </td>
                <td>{item.caseCaptionNames}</td>
                <td>
                  {item.practitioners.map((practitioner, idx) => (
                    <div key={idx}>{practitioner.name}</div>
                  ))}
                </td>
                <td>
                  {item.respondents.map((respondent, idx) => (
                    <div key={idx}>{respondent.name}</div>
                  ))}
                </td>
                <td>{item.disposition}</td>
              </tr>
            </tbody>
          ))}
        </table>
      </React.Fragment>
    );
  },
);