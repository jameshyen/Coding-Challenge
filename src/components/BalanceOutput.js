import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as utils from '../utils';

class BalanceOutput extends Component {
  render() {
    if (!this.props.userInput.format) {
      return null;
    }

    return (
      <div className='output'>
        <p>
          Total Debit: {this.props.totalDebit} Total Credit: {this.props.totalCredit}
          <br />
          Balance from account {this.props.userInput.startAccount || '*'}
          {' '}
          to {this.props.userInput.endAccount || '*'}
          {' '}
          from period {utils.dateToString(this.props.userInput.startPeriod)}
          {' '}
          to {utils.dateToString(this.props.userInput.endPeriod)}
        </p>
        {this.props.userInput.format === 'CSV' ? (
          <pre>{utils.toCSV(this.props.balance)}</pre>
        ) : null}
        {this.props.userInput.format === 'HTML' ? (
          <table className="table">
            <thead>
              <tr>
                <th>ACCOUNT</th>
                <th>DESCRIPTION</th>
                <th>DEBIT</th>
                <th>CREDIT</th>
                <th>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {this.props.balance.map((entry, i) => (
                <tr key={i}>
                  <th scope="row">{entry.ACCOUNT}</th>
                  <td>{entry.DESCRIPTION}</td>
                  <td>{entry.DEBIT}</td>
                  <td>{entry.CREDIT}</td>
                  <td>{entry.BALANCE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }
}

BalanceOutput.propTypes = {
  balance: PropTypes.arrayOf(
    PropTypes.shape({
      ACCOUNT: PropTypes.number.isRequired,
      DESCRIPTION: PropTypes.string.isRequired,
      DEBIT: PropTypes.number.isRequired,
      CREDIT: PropTypes.number.isRequired,
      BALANCE: PropTypes.number.isRequired
    })
  ).isRequired,
  totalCredit: PropTypes.number.isRequired,
  totalDebit: PropTypes.number.isRequired,
  userInput: PropTypes.shape({
    startAccount: PropTypes.number,
    endAccount: PropTypes.number,
    startPeriod: PropTypes.date,
    endPeriod: PropTypes.date,
    format: PropTypes.string
  }).isRequired
};

export default connect(state => {
  let balance = [];

  const { userInput: { startAccount, endAccount, startPeriod, endPeriod } } = state;

  balance = state.accounts.filter((account) => {
    return account.ACCOUNT >= startAccount && account.ACCOUNT <= endAccount;
  });

  balance = balance.map((account) => {
    const newAccount = Object.assign({}, account);
    newAccount.BALANCE = 0;
    newAccount.DEBIT = 0;
    newAccount.CREDIT = 0;
    newAccount.DESCRIPTION = account.LABEL;
    delete newAccount.LABEL;
    return newAccount;
  });

  state.journalEntries.forEach((journalEntry) => {
    console.log(startPeriod, !!startPeriod, startPeriod === 'Invalid Date');
    const start = isNaN(startPeriod) ? true : journalEntry.PERIOD >= startPeriod;
    const end = isNaN(endPeriod) ? true : journalEntry.PERIOD <= endPeriod;
    if (start && end) {
      balance.forEach((account) => {
        if (account.ACCOUNT === journalEntry.ACCOUNT) {
          if (journalEntry.DEBIT) {
            account.BALANCE += journalEntry.DEBIT;
            account.DEBIT += journalEntry.DEBIT;
          }
          if (journalEntry.CREDIT) {
            account.BALANCE -= journalEntry.CREDIT;
            account.CREDIT += journalEntry.CREDIT;
          }
        }
      });
    }
  });

  const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
  const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);

  console.log(balance);
  console.log(state);

  return {
    balance,
    totalCredit,
    totalDebit,
    userInput: state.userInput
  };
})(BalanceOutput);
