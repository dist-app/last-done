import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ChoreActionsCollection } from './chore-actions';

export interface Chore {
  _id: string;
  userId: string;

  group: string;
  title: string;
  intervalDays: number;
  createdAt: Date;
  lastAction?: Date;
}

export const ChoresCollection = new Mongo.Collection<Chore>('Chores');

Meteor.methods({
  async 'chores/by-id/take-action'(choreId: unknown) {
    check(choreId, String);

    const chore = await ChoresCollection.findOneAsync({_id: choreId});
    if (!chore) throw new Meteor.Error(404, 'chore not found');

    // Prevent rapid re-action
    const lastActionCutoff = new Date();
    lastActionCutoff.setHours(lastActionCutoff.getHours() - 4);
    if (chore.lastAction && chore.lastAction > lastActionCutoff) {
      throw new Meteor.Error(400, 'too soon since last action');
    }

    await ChoreActionsCollection.insertAsync({
      choreId: choreId,
      createdAt: new Date,
      userId: chore.userId,
    });

    await ChoresCollection.updateAsync({_id: choreId}, {
      $set: {
        lastAction: new Date,
      },
    });
  },
})
