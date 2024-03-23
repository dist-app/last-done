import React, { Fragment } from "react";
import { useFind, useSubscribe } from "meteor/react-meteor-data";

import { Chore, ChoresCollection, groupEmoji, nextDueDate } from "/imports/api/chores";
import { ChoreGridRow } from "./ChoreGridRow";

export const ChoreGrid = () => {
  const isLoading = useSubscribe("chores/all");
  const chores = useFind(() => ChoresCollection.find({}));

  if (isLoading()) {
    return <div>Loading...</div>;
  }

  const choresByDue = chores
    .map(x => ({...x, nextDue: nextDueDate(x)}))
    .sort((a,b) => {
      if (!a.nextDue) return 1;
      if (!b.nextDue) return -1;
      return a.nextDue.valueOf() - b.nextDue.valueOf();
    });

  // Prevent rapid re-action
  const lastActionCutoff = new Date();
  lastActionCutoff.setHours(lastActionCutoff.getHours() - 4);

  return (
    <table className="chore-grid">
      <thead>
        <tr>
          <th>Chore</th>
          {/* <th>Interval</th> */}
          {/* <th>Last</th> */}
          <th>Due</th>
          <th></th>
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
