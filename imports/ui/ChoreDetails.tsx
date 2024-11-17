import React from "react";
import { Link } from "react-router-dom";
import { useFind, useSubscribe, useTracker } from "meteor/react-meteor-data";

import { ChoresCollection, lastDoneStr, nextDueStr } from "/imports/api/chores";
import { ChoreActionsCollection } from "../api/chore-actions";

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
      <Link to="/chores">back</Link>
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
