import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Link } from 'react-router-dom';

import { Chore, isDueSoon, nextDueStr } from '/imports/api/chores';
import { groupEmoji } from "/imports/api/groups";

export function ChoreGridRow(props: {
  chore: Chore;
  lastActionCutoff: Date;
  withEmoji?: boolean;
}) {
  const {chore} = props;

  return (
    <tr className={[
      chore.archivedAt ? 'is-archived' : '',
      (chore.lastAction && chore.lastAction > props.lastActionCutoff) ? 'recently-done' : '',
      isDueSoon(chore) ? 'due-soon' : '',
    ].map(x => x).join(' ')}>
      <td className="title-cell">
        <Link to={`/chores/by-id/${chore._id}`}>
          {props.withEmoji ? (
            <span style={{fontSize: '1.25em', margin: '0 0.2em'}}>
              {groupEmoji(chore.group)}
            </span>
          ) : []}
          {chore.title}
        </Link>
      </td>
      {/* <td>
        {chore.intervalDays}d
      </td> */}
      {/* <td title={chore.lastAction?.toLocaleDateString() ?? 'Never'}>
        {lastDoneStr(chore)}
      </td> */}
      <td className="next-due-cell">
        {chore.archivedAt ? 'Archived' : nextDueStr(chore)}
      </td>
      <td>
        <button disabled={!!chore.archivedAt || (chore.lastAction && chore.lastAction > props.lastActionCutoff)} type="button" onClick={() => {
          Meteor.callAsync('chores/by-id/take-action', chore._id)
            .catch(err => {
              console.error(err);
              alert(`API call failed:\n\n${err.message}`);
            });
        }}>
          ✔️
        </button>
      </td>
    </tr>
  );
}
