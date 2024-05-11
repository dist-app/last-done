import React, { Fragment } from "react";
import { useFind, useSubscribe } from "meteor/react-meteor-data";

import { TasksCollection } from "/imports/api/tasks";
import { TaskGridRow } from "./TaskGridRow";
import { TaskGridCreateRow } from "./TaskGridCreateRow";

export const TaskGrid = () => {
  const tasks = useFind(() => TasksCollection.find({}, {
    sort: {
      createdAt: 1,
    }
  }));

  return (<Fragment>
    <table className="chore-grid">
      <thead>
        <tr>
          <th>Task</th>
          <th>Added</th>
          <th style={{width: '2em'}}></th>
        </tr>
      </thead>
      <tbody>
        {tasks.map(task => (
          <TaskGridRow key={task._id} task={task} withEmoji={true} />
        ))}
      </tbody>
    </table>
    <table className="chore-grid">
      <tbody>
        <TaskGridCreateRow />
      </tbody>
    </table>
  </Fragment>);
};
