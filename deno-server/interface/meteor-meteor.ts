import { ApiKindEntity } from "../../../dist-app-deno/lib/portable/types";
import { emitToSub, renderEventStream, filterEventStream } from "../../../dist-app-deno/lib/ddp/reusables/livedata";

import { DistInterface, getEngineOrThrow, EngineStorage, CollectionQuery, CollectionEntityApiMapping, RandomStorage } from "./registry";
import { DocumentFields } from "../../../dist-app-deno/lib/ddp/server/publications";

export const Meteor = {

  Error: class MeteorError extends Error {
    constructor(public readonly code: string, public readonly message: string) {
      super(`${message} [${code}]`);
    }
  },

  methods(methodMap: Record<string, (...args: unknown[]) => unknown>) {
    for (const [name, handler] of Object.entries(methodMap)) {
      DistInterface.addMethod(name, async (socket, params, random) => {

        const engine = getEngineOrThrow(socket);
        const result = await EngineStorage.run(engine, () =>
          RandomStorage.run(random, () => handler.apply(null, params)));
        console.log('method', name, 'result:', result);
        return result;
        // const choresApi = new ChoreListApi(engine);
      });
    }
  },
  publish(name: string, handler: (...args: unknown[]) => unknown) {
    // console.log(`TODO: Meteor.publish`, args);
    DistInterface.addPublication(name, async (sub, params) => {
      const engine = getEngineOrThrow(sub.connection);
      const result = await EngineStorage.run(engine, () => handler.apply(null, params));
      // console.log('publish', name, 'result:', result);

      const items = Array.isArray(result) ? result : result ? [result] : [];
      // async function publishItem(item: CollectionQuery<unknown>) {
      for (const item of items) {
        if (item instanceof CollectionQuery) {
          const apiCoords = CollectionEntityApiMapping.get(item.collectionName);
          if (!apiCoords) throw new Error(`Unknown collection "${item.collectionName}"`);
          const stream = item.engine.observeEntities<ApiKindEntity>(
            apiCoords.apiVersion,
            apiCoords.kind,
            { signal: sub.signal });
          emitToSub(sub, [
            renderEventStream(
              filterEventStream(stream, entity => item.filters.every(filter => filter({
                ...(entity.spec as Record<string,unknown>),
                _id: entity.metadata.name,
              }))),
              item.collectionName,
              x => x.metadata.name,
              x => x.spec as DocumentFields),
          ]);
          continue;
        }
        throw new Error(`published weird thing`);
      }


      // return result;
      // const stream = new ChoreListApi(engine).observeChores(sub.signal);
      // emitToSub(sub, [
      //   renderEventStream(
      //     stream,
      //     'Chores',
      //     x => x.metadata.name,
      //     x => x.spec),
      // ]);
    });

  },
}
