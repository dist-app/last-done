import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ChoreActionsCollection } from './chore-actions.ts';

export interface Chore {
  _id: string;
  userId: string;

  group: string;
  title: string;
  description?: string;
  intervalDays: number;
  createdAt: Date;
  archivedAt?: Date | null;
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

  async 'chores/by-id/edit-interval-days'(choreName: unknown, intervalDays: unknown) {
    check(choreName, String);
    check(intervalDays, Number);

    const n = await ChoresCollection.updateAsync({
      _id: choreName,
    }, {
      $set: { intervalDays },
    });
    return n > 0;
  },

  async 'chores/by-id/edit-description'(choreName: unknown, description: unknown) {
    check(choreName, String);
    check(description, String);

    const n = await ChoresCollection.updateAsync({
      _id: choreName,
    }, {
      $set: { description },
    });
    return n > 0;
  },

  async 'chores/by-id/archive'(choreName: unknown) {
    check(choreName, String);

    const chore = await ChoresCollection.findOneAsync({_id: choreName});
    if (!chore) throw new Meteor.Error(404, 'chore not found');

    const n = await ChoresCollection.updateAsync({
      _id: choreName,
      archivedAt: null,
    }, {
      $set: {
        archivedAt: new Date,
      },
    });
    return n > 0;
  },

  async 'chores/by-id/take-action'(choreName: unknown) {
    check(choreName, String);

    const chore = await ChoresCollection.findOneAsync({_id: choreName});
    if (!chore) throw new Meteor.Error(404, 'chore not found');

    // Prevent rapid re-action
    const lastActionCutoff = new Date();
    lastActionCutoff.setHours(lastActionCutoff.getHours() - 4);
    if (chore.lastAction && chore.lastAction > lastActionCutoff) {
      throw new Meteor.Error(400, 'too soon since last action');
    }

    const nowDate = new Date;

    const n = await ChoresCollection.updateAsync({
      _id: choreName,
      lastAction: chore.lastAction,
    }, {
      $set: {
        lastAction: nowDate,
      },
    });
    if (!n) throw new Meteor.Error('race', `Database race occurred`);

    await ChoreActionsCollection.insertAsync({
      choreName: choreName,
      createdAt: nowDate,
      userId: chore.userId,
      goalIntervalDays: chore.intervalDays,
      prevActionDays: chore.lastAction
        ? ((nowDate.valueOf() - chore.lastAction.valueOf()) / 1000 / 60 / 60 / 24)
        : undefined,
    });
  },
});

export function lastDoneStr(chore: Chore) {
  if (!chore.lastAction) {
    return 'Never';
  }
  return timeAgoStr(chore.lastAction);
}

export function timeAgoStr(time: Date) {
  const hoursAgo = (Date.now() - time.valueOf()) / 1000 / 60 / 60;
  if (hoursAgo < 1) return `Now`;
  if (hoursAgo < 24) return `${Math.round(hoursAgo)}h ago`;
  return `${Math.round(hoursAgo / 24)}d ago`;
}

export function nextDueDate(chore: Chore) {
  if (!chore.lastAction) return null;
  if (chore.archivedAt) return null;

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
  if (chore.archivedAt) return false;

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
