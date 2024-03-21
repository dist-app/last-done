import { Meteor } from "meteor/meteor";

import { ChoreActionsCollection } from "/imports/api/chore-actions";
import { ChoresCollection } from "/imports/api/chores";

Meteor.publish("chores/all", function () {
  return ChoresCollection.find();
});

Meteor.publish("chores/by-id/details", function (choreId: string) {
  return [
    ChoresCollection.find({
      _id: choreId,
    }),
    ChoreActionsCollection.find({
      choreId: choreId,
    }, {
      sort: {
        createdAt: -1,
      },
      limit: 50,
    }),
  ];
});
