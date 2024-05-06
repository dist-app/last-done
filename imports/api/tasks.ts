import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export interface Task {
  _id: string;
  userId: string;

  group: string;
  title: string;
  description?: string;

  createdAt: Date;
  doneAt?: Date;
}

export const TasksCollection = new Mongo.Collection<Task>('Tasks');

Meteor.methods({

  async 'tasks/create'(group: unknown, title: unknown, description: unknown) {
    check(group, String);
    check(title, String);
    check(description, String);

    const _id = await TasksCollection.insertAsync({
      userId: 'dan',
      title,
      group,
      description: description || undefined,
      createdAt: new Date(),
    });
    return _id;
  },

  async 'tasks/by-id/take-action'(taskId: unknown) {
    check(taskId, String);

    const task = await TasksCollection.findOneAsync({_id: taskId});
    if (!task) throw new Meteor.Error(404, 'task not found');

    // Prevent re-action
    if (task.doneAt) return;

    await TasksCollection.updateAsync({
      _id: taskId,
      doneAt: {$exists: false},
    }, {
      $set: {
        doneAt: new Date,
      },
    });
  },
});
