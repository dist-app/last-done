import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Link } from 'react-router-dom';

import { Task } from '/imports/api/tasks';
import { groupEmoji, timeAgoStr } from '../api/chores';

export function TaskGridRow(props: {
  task: Task;
  withEmoji?: boolean;
}) {
  const {task} = props;

  return (
    <tr className={[
      task.doneAt ? 'recently-done' : '',
      // isDueSoon(task) ? 'due-soon' : '',
    ].map(x => x).join(' ')}>
      <td className="title-cell">
        <Link to={`/tasks/by-id/${task._id}`}>
          {props.withEmoji ? (
            <span style={{fontSize: '1.25em', margin: '0 0.2em'}}>
              {groupEmoji(task.group)}
            </span>
          ) : []}
          {task.title}
        </Link>
      </td>
      <td className="next-due-cell">
        {timeAgoStr(task.createdAt)}
      </td>
      <td>
        <button type="button" disabled={!!task.doneAt} onClick={() => {
          Meteor.callAsync('tasks/by-id/take-action', task._id)
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
