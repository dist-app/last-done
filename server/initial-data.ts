import { Meteor } from 'meteor/meteor';
import { ChoresCollection } from '/imports/api/chores';

Meteor.startup(async () => {

  if (await ChoresCollection.find().countAsync() > 0) {
    return;
  }


  await ChoresCollection.insertAsync({
    userId: 'dan',
    title: 'Take out Restmüll',
    group: 'Trash',
    intervalDays: 4,
    createdAt: new Date(),
  });

  await ChoresCollection.insertAsync({
    userId: 'dan',
    title: 'Take out Wertstoff',
    group: 'Trash',
    intervalDays: 7,
    createdAt: new Date(),
  });

  await ChoresCollection.insertAsync({
    userId: 'dan',
    title: 'Take out Bio',
    group: 'Trash',
    intervalDays: 3,
    createdAt: new Date(),
  });

  await ChoresCollection.insertAsync({
    userId: 'dan',
    title: 'Take out Paper',
    group: 'Trash',
    intervalDays: 7,
    createdAt: new Date(),
  });


  await ChoresCollection.insertAsync({
    userId: 'dan',
    title: 'Cat litter',
    group: 'Cat',
    intervalDays: 2,
    createdAt: new Date(),
  });

  await ChoresCollection.insertAsync({
    userId: 'dan',
    title: 'Cat food before bed',
    group: 'Cat',
    intervalDays: 1,
    createdAt: new Date(),
  });

  await ChoresCollection.insertAsync({
    userId: 'dan',
    title: 'Weigh cat',
    group: 'Cat',
    intervalDays: 30,
    createdAt: new Date(),
  });

  await ChoresCollection.insertAsync({
    userId: 'dan',
    title: 'Trim front claws',
    group: 'Cat',
    intervalDays: 14,
    createdAt: new Date(),
  });

  await ChoresCollection.insertAsync({
    userId: 'dan',
    title: 'Brush hair',
    group: 'Cat',
    intervalDays: 7,
    createdAt: new Date(),
  });


  await ChoresCollection.insertAsync({
    userId: 'dan',
    title: 'Shower',
    group: 'Hygiene',
    intervalDays: 2,
    createdAt: new Date(),
  });

  await ChoresCollection.insertAsync({
    userId: 'dan',
    title: 'Trim fingernails',
    group: 'Hygiene',
    intervalDays: 7,
    createdAt: new Date(),
  });

  await ChoresCollection.insertAsync({
    userId: 'dan',
    title: 'Trim toenails',
    group: 'Hygiene',
    intervalDays: 14,
    createdAt: new Date(),
  });

  await ChoresCollection.insertAsync({
    userId: 'dan',
    title: 'Cut hair',
    group: 'Hygiene',
    intervalDays: 45,
    createdAt: new Date(),
  });


  await ChoresCollection.insertAsync({
    userId: 'dan',
    title: 'Sweep kitchen',
    group: 'Cleaning',
    intervalDays: 2,
    createdAt: new Date(),
  });

  await ChoresCollection.insertAsync({
    userId: 'dan',
    title: 'Sweep apartment',
    group: 'Cleaning',
    intervalDays: 7,
    createdAt: new Date(),
  });

  await ChoresCollection.insertAsync({
    userId: 'dan',
    title: 'Mopping',
    group: 'Cleaning',
    intervalDays: 30,
    createdAt: new Date(),
  });

  await ChoresCollection.insertAsync({
    userId: 'dan',
    title: 'Tidy office desk',
    group: 'Cleaning',
    intervalDays: 7,
    createdAt: new Date(),
  });


});
