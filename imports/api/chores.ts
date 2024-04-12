import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ChoreActionsCollection } from './chore-actions';

export interface Chore {
  _id: string;
  userId: string;

  group: string;
  title: string;
  description?: string;
  intervalDays: number;
  createdAt: Date;
  lastAction?: Date;
}

export const ChoresCollection = new Mongo.Collection<Chore>('Chores');

Meteor.methods({

  async 'chores/create'(group: unknown, title: unknown, description: unknown, intervalDays: unknown) {
    check(group, String);
    check(title, String);
    check(description, String);
    check(intervalDays, Number);

    const _id = await ChoresCollection.insertAsync({
      userId: 'dan',
      title,
      group,
      description: description || undefined,
      intervalDays,
      createdAt: new Date(),
    });
    return _id;
  },

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

    const nowDate = new Date;

    const n = await ChoresCollection.updateAsync({
      _id: choreId,
      lastAction: chore.lastAction,
    }, {
      $set: {
        lastAction: nowDate,
      },
    });
    if (!n) throw new Meteor.Error('race', `Database race occurred`);

    await ChoreActionsCollection.insertAsync({
      choreId: choreId,
      createdAt: nowDate,
      userId: chore.userId,
      goalIntervalDays: chore.intervalDays,
      prevActionDays: chore.lastAction
        ? ((nowDate.valueOf() - chore.lastAction.valueOf()) / 1000 / 60 / 60 / 24)
        : undefined,
    });
  },
})

export function lastDoneStr(chore: Chore) {
  if (!chore.lastAction) {
    return 'Never';
  }

  const hoursAgo = (Date.now() - chore.lastAction.valueOf()) / 1000 / 60 / 60;
  if (hoursAgo < 1) return `Now`;
  if (hoursAgo < 24) return `${Math.round(hoursAgo)}h ago`;
  return `${Math.round(hoursAgo / 24)}d ago`;
}

export function nextDueDate(chore: Chore) {
  if (!chore.lastAction) {
    return null;
  }

  const nextDue = new Date(chore.lastAction);
  nextDue.setDate(nextDue.getDate() + chore.intervalDays);
  return nextDue;
}

export function nextDueStr(chore: Chore) {
  const nextDue = nextDueDate(chore);
  if (!nextDue) {
    return 'N/A';
  }

  const hoursFromNow = (nextDue.valueOf() - Date.now()) / 1000 / 60 / 60;
  if (hoursFromNow < -24) return `${Math.round(hoursFromNow / -24)}d Late`;
  if (hoursFromNow < 0) return `Due Today`;
  if (hoursFromNow < 24) return `In ${Math.round(hoursFromNow)}h`;
  return `In ${Math.round(hoursFromNow / 24)}d`;
}

export function isDueSoon(chore: Chore) {
  if (!chore.lastAction) return false;

  const nextDue = new Date(chore.lastAction);
  nextDue.setDate(nextDue.getDate() + chore.intervalDays);

  const daysFromNow = (nextDue.valueOf() - Date.now()) / 1000 / 60 / 60 / 24;
  if (daysFromNow <= 0) return true;

  if (chore.intervalDays >= 7) {
    // console.log({daysFromNow, name: chore.title, days: chore.intervalDays})
    return daysFromNow < 2;
  } else {
    const fractionToDue = 1 - (daysFromNow / chore.intervalDays);
    // console.log({fractionToDue})
    return fractionToDue > 0.75;
  }
}

export function groupEmoji(group: string) {
  switch (group) {
    // TODO: duplicated with CreateChoreForm
    case 'Cleo': return '🐈‍⬛';
    case 'Ginger': return '🐈';
    case 'Household': return '🏠';
    case 'Trash': return '🚮';
    case 'Hygiene': return '🪥';
    case 'Cleaning': return '🧹';
  }
}
