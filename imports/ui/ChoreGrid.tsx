import React from "react";
import { useFind } from "meteor/react-meteor-data";

import { ChoresCollection, nextDueDate } from "/imports/api/chores";
import { ChoreGridRow } from "./ChoreGridRow";

export const ChoreGrid = (props: {
  showCompleted: boolean;
}) => {
  const chores = useFind(() => ChoresCollection.find({}));

  // Prevent rapid re-action
  const lastActionCutoff = new Date();
  lastActionCutoff.setHours(lastActionCutoff.getHours() - 4);
  // Allow hiding things in the future
  const nextActionCutoff = new Date();
  nextActionCutoff.setHours(nextActionCutoff.getHours() + 24);

  const choresByDue = chores
    .map(x => ({...x, nextDue: nextDueDate(x)}))
    .filter(x => props.showCompleted ? true : (
      !x.archivedAt && (!x.nextDue || x.nextDue < nextActionCutoff)
    ))
    .sort((a,b) => {
      if (!a.nextDue) return 1;
      if (!b.nextDue) return -1;
      return a.nextDue.valueOf() - b.nextDue.valueOf();
    });

  return (
    <table className="chore-grid">
      <thead>
        <tr>
          <th>Chore</th>
          {/* <th>Interval</th> */}
          {/* <th>Last</th> */}
          <th>Due</th>
          <th style={{width: '2em'}}></th>
        </tr>
      </thead>
      <tbody>
        {choresByDue.map(chore => (
          <ChoreGridRow key={chore._id} chore={chore} lastActionCutoff={lastActionCutoff} withEmoji={true} />
        ))}
      </tbody>
    </table>
  );
};
