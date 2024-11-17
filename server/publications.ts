import { Meteor } from "meteor/meteor";

import { ChoreActionsCollection } from "/imports/api/chore-actions";
import { ChoresCollection } from "/imports/api/chores";
import { TasksCollection } from "/imports/api/tasks";

Meteor.publish("chores/all", function () {
  return ChoresCollection.find();
});

Meteor.publish("chores/by-id/details", function (choreName: string) {
  return [
    ChoresCollection.find({
      _id: choreName,
    }),
    ChoreActionsCollection.find({
      choreName: choreName,
    }, {
      sort: {
        createdAt: -1,
      },
      limit: 50,
    }),
  ];
});

Meteor.publish("tasks/active", function () {
  const relevancyCutoff = new Date;
  relevancyCutoff.setDate(relevancyCutoff.getDate() - 2);
  return TasksCollection.find({
    doneAt: {$not: {$lt: relevancyCutoff}},
  });
});
