import { AsyncLocalStorage } from 'node:async_hooks';

import { EntityEngine } from "../../../dist-app-deno/lib/portable/engine";
import { DdpInterface, DdpSocket } from "../../../dist-app-deno/lib/ddp/server/ddp-impl";
import { registerOtlpMethods } from "../../../dist-app-deno/lib/ddp/reusables/otlp";
import { RandomStream } from '../../../dist-app-deno/lib/ddp/random';


export const DistInterface = new DdpInterface;
registerOtlpMethods(DistInterface);

export const SignedOutDistInterface = new DdpInterface();
registerOtlpMethods(SignedOutDistInterface);


export const userNameMap = new WeakMap<DdpSocket, EntityEngine>();
export function getEngineOrThrow(connection: DdpSocket) {
  const engine = userNameMap.get(connection);
  if (!engine) throw new Error('no engine');
  return engine;
}

export const EngineStorage = new AsyncLocalStorage<EntityEngine>();
export const RandomStorage = new AsyncLocalStorage<RandomStream|null>();

export class CollectionQuery<T> {
  constructor(
    public readonly engine: EntityEngine,
    public readonly collectionName: string,
  ) {}
  public readonly filters = new Array<(entity: T) => boolean>;
}

export const CollectionEntityApiMapping = new Map<string,{apiVersion: string, kind: string}>();
