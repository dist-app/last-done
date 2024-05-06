import React, { Fragment } from "react";
import { useFind, useSubscribe } from "meteor/react-meteor-data";

import { TasksCollection } from "/imports/api/tasks";
import { TaskGridRow } from "./TaskGridRow";
import { TaskGridCreateRow } from "./TaskGridCreateRow";

export const TaskGrid = () => {
  const isLoading = useSubscribe("tasks/active");
  const tasks = useFind(() => TasksCollection.find({}));

  if (isLoading()) {
    return <div>Loading...</div>;
  }

  const tasksByAdded = tasks
    .sort((a,b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return a.createdAt.valueOf() - b.createdAt.valueOf();
    });

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
        {tasksByAdded.map(task => (
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
