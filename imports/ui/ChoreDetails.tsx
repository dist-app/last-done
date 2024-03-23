import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { useFind, useSubscribe, useTracker } from "meteor/react-meteor-data";
import { Meteor } from "meteor/meteor";

import { Chore, ChoresCollection, lastDoneStr, nextDueStr } from "/imports/api/chores";
import { ChoreActionsCollection } from "../api/chore-actions";

export const ChoreDetails = (props: {
  choreId: string;
}) => {
  const isLoading = useSubscribe("chores/by-id/details", props.choreId);

  const chore = useTracker(() => ChoresCollection
    .findOne({
      _id: props.choreId,
    })
  , [props.choreId]);

  const actions = useFind(() => ChoreActionsCollection
    .find({
      choreId: props.choreId,
    }, {
      sort: {
        createdAt: -1,
      },
    })
  , [props.choreId]);

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
      <Link to="/">back</Link>
      <hr />
      <table>
        <tbody>
          <tr><th>description</th><td>{chore.description}</td></tr>
          <tr><th>interval (days)</th><td>{chore.intervalDays}</td></tr>
          <tr><th>last done</th><td>{lastDoneStr(chore)}</td></tr>
          <tr><th>next due</th><td>{nextDueStr(chore)}</td></tr>
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
