import React from 'react';
import { Meteor } from 'meteor/meteor';

import { useForm } from 'react-hook-form';

export function TaskGridCreateRow(props: {
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState,
  } = useForm();

  async function onSubmit(data: {
    group: string;
    title: string;
  }) {
    try {
      const id = await Meteor.callAsync('tasks/create', data.group, data.title, "");
      reset();
    } catch (err) {
      alert(`Creation failed: ${(err as Error).message}`);
    }
  }

  return (
    <tr
      className={[
      // (task.lastAction && task.lastAction > props.lastActionCutoff) ? 'recently-done' : '',
      // isDueSoon(task) ? 'due-soon' : '',
    ].map(x => x).join(' ')}>
      <td className="title-cell">
        <form id="task-create" onSubmit={handleSubmit(d => onSubmit(d as any))}>
          <select {...register('group', { required: true })} required style={{
              width: '100%',
              height: '2.5em',
              fontSize: '0.85em',
              boxSizing: 'border-box',
            }}>
            <option value="Cleo">🐈‍⬛ Cleo</option>
            <option value="Ginger">🐈 Ginger</option>
            <option value="Household">🏠 Household</option>
            <option value="Trash">🚮 Trash</option>
            <option value="Hygiene">🪥 Hygiene</option>
            <option value="Cleaning">🧹 Cleaning</option>
            <option value="Financial">💸 Financial</option>
          </select>
        </form>
      </td>
      <td className="next-due-cell">
        <input form="task-create" {...register('title', { required: true })} required style={{
              width: '100%',
              height: '2.5em',
              fontSize: '1.2em',
              boxSizing: 'border-box',
            }} />
      </td>
      <td>
        <button form="task-create" type="submit" disabled={formState.isSubmitting}>
          ➕
        </button>
      </td>
    </tr>
  );
}
