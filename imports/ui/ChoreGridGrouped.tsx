import React, { Fragment } from "react";
import { useFind } from "meteor/react-meteor-data";

import { Chore, ChoresCollection } from "/imports/api/chores";
import { ChoreGridRow } from "./ChoreGridRow";
import { groupEmoji } from "/imports/api/groups";

export const ChoreGridGrouped = () => {
  const chores = useFind(() => ChoresCollection.find({}, {
    sort: {
      group: 1,
      title: 1,
    },
  }));

  const byGroup = chores.reduce((map, x) => {
    let list = map.get(x.group);
    if (!list) {
      list = [];
      map.set(x.group, list);
    }
    list.push(x);
    return map;
  }, new Map<string,Array<Chore>>());

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
          <th style={{width: '2em'}}></th>
        </tr>
      </thead>
      <tbody>
        {[...byGroup.entries()].map(([group, list]) => (
          <Fragment key={group}>
            <tr>
              <th colSpan={3}>
                <h4>
                  <span style={{fontSize: '1.5em', margin: '0 0.2em'}}>
                    {groupEmoji(group)}
                  </span>
                  {group}
                </h4>
              </th>
            </tr>
            {list.map(chore => (
              <ChoreGridRow key={chore._id} chore={chore} lastActionCutoff={lastActionCutoff} />
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
};
