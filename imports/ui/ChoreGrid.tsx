import React, { Fragment } from "react";
import { useFind, useSubscribe } from "meteor/react-meteor-data";
import { Chore, ChoresCollection } from "../api/chores";
import { Meteor } from "meteor/meteor";

function lastDoneStr(chore: Chore) {
  if (!chore.lastAction) {
    return 'Never';
  }

  const hoursAgo = (Date.now() - chore.lastAction.valueOf()) / 1000 / 60 / 60;
  if (hoursAgo < 1) return `Now`;
  if (hoursAgo < 24) return `${Math.round(hoursAgo)}h ago`;
  return `${Math.round(hoursAgo / 24)}d ago`;
}

function nextDueStr(chore: Chore) {
  if (!chore.lastAction) {
    return 'N/A';
  }

  const nextDue = new Date(chore.lastAction);
  nextDue.setDate(nextDue.getDate() + chore.intervalDays);

  const hoursFromNow = (nextDue.valueOf() - Date.now()) / 1000 / 60 / 60;
  if (hoursFromNow < 0) return `Past Due`;
  if (hoursFromNow < 24) return `In ${Math.round(hoursFromNow)}h`;
  return `In ${Math.round(hoursFromNow / 24)}d`;
}

export const ChoreGrid = () => {
  const isLoading = useSubscribe("chores/all");
  const chores = useFind(() => ChoresCollection.find());

  if (isLoading()) {
    return <div>Loading...</div>;
  }

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
          <th>Interval</th>
          <th>Last</th>
          <th>Due</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {[...byGroup.entries()].map(([group, list]) => (
          <Fragment key={group}>
            <tr>
              <th colSpan={5}>
                <h4>{group}</h4>
              </th>
            </tr>
            {list.map(chore => (
              <tr key={chore._id} className={[
                (chore.lastAction && chore.lastAction > lastActionCutoff) ? 'recently-done' : '',
              ].map(x => x).join(' ')}>
                <td className="title-cell">
                  {chore.title}
                </td>
                <td>
                  {chore.intervalDays}d
                </td>
                <td title={chore.lastAction?.toLocaleDateString() ?? 'Never'}>
                  {lastDoneStr(chore)}
                </td>
                <td>
                  {nextDueStr(chore)}
                </td>
                <td>
                  <button disabled={chore.lastAction && chore.lastAction > lastActionCutoff} type="button" onClick={() => {
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
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
};
