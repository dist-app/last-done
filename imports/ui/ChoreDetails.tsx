import React from "react";
import { Link } from "react-router-dom";
import { useFind, useSubscribe, useTracker } from "meteor/react-meteor-data";

import { ChoresCollection, lastDoneStr, nextDueStr } from "/imports/api/chores";
import { ChoreActionsCollection } from "../api/chore-actions";
import { Meteor } from "meteor/meteor";

export const ChoreDetails = (props: {
  choreName: string;
}) => {
  const isLoading = useSubscribe("chores/by-id/details", props.choreName);

  const chore = useTracker(() => ChoresCollection
    .findOne({
      _id: props.choreName,
    })
  , [props.choreName]);

  const actions = useFind(() => ChoreActionsCollection
    .find({
      choreName: props.choreName,
    }, {
      sort: {
        createdAt: -1,
      },
    })
  , [props.choreName]);

  if (isLoading()) {
    return <div>Loading...</div>;
  }
  if (!chore) {
    return <div>Not found</div>;
  }

  return (
    <div className="chore-details">
      <h2>{chore.group}</h2>
      <h1>{chore.title}</h1>
      <div><Link to="/chores">back</Link></div>
      <button style={{height: '2em', fontSize: '0.85em'}} onClick={() => {
        if (!confirm(`Really archive chore?`)) return;
        Meteor.callAsync('chores/by-id/archive', chore._id);
      }} disabled={chore.archivedAt ? true : false}>move to archive</button>
      <hr />
      <table style={{width: '100%'}}>
        <tbody>
          <tr>
            <th>description</th>
            <td>
              <button style={{height: '1.5em'}} onClick={() => {
                const newDesc = prompt(`New description:`, `${chore.description}`);
                if (!newDesc) return;
                Meteor.callAsync('chores/by-id/edit-description', chore._id, newDesc);
              }}>✏</button>
            </td>
            <td style={{width: '65%'}}>{chore.description}</td>
          </tr>
          <tr>
            <th>interval (days)</th>
            <td>
              <button style={{height: '1.5em'}} onClick={() => {
                const newDaysStr = prompt(`New interval in days:`, `${chore.intervalDays}`);
                if (!newDaysStr) return;
                const newDays = parseInt(newDaysStr, 10);
                if (!newDays) return;
                Meteor.callAsync('chores/by-id/edit-interval-days', chore._id, newDays);
              }}>✏</button>
            </td>
            <td>{chore.intervalDays}</td>
          </tr>
          <tr>
            <th>last done</th>
            <td></td>
            <td>{lastDoneStr(chore)}</td>
          </tr>
          <tr>
            <th>next due</th>
            <td></td>
            <td>{nextDueStr(chore)}</td>
          </tr>
        </tbody>
      </table>
      <hr />
      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Days since previous</th>
            <th>Goal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {actions.map(action => (
            <tr key={action._id}>
              <td>{action.createdAt.toDateString()}</td>
              <td>{action.prevActionDays}</td>
              <td>{action.goalIntervalDays}</td>
              <td>{(action.prevActionDays && action.goalIntervalDays)
                ? (action.prevActionDays < action.goalIntervalDays)
                  ? 'good'
                  : 'too slow'
                : 'first time'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
