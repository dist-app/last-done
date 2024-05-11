// Meteor likes keeping subscriptions active to keep latency down when switching pages
// React likes promises being stable so that the new "Suspense" feature can be used
// Let's cache subscriptions and their promises in one place to satisfy things

import { Meteor } from "meteor/meteor";

const subCache = new Map<string,Meteor.SubscriptionHandle>();
const promiseCache = new Map<string,Promise<Meteor.SubscriptionHandle>>();

export function cachedSubscription(subName: string, subArgs: unknown[]) {
  const subKey = JSON.stringify([subName, ...subArgs]);

  const cachedPromise = promiseCache.get(subKey);
  if (cachedPromise) return cachedPromise;

  const promise = new Promise<Meteor.SubscriptionHandle>((ok, fail) => {
    const sub = Meteor.subscribe(subName, ...subArgs, {
      onStop(err: Meteor.Error) {
        if (err) fail(err);
        subCache.delete(subKey);
        promiseCache.delete(subKey);
      },
      onReady() {
        ok(sub);
      },
    });
  });
  promiseCache.set(subKey, promise);
  return promise;
}
