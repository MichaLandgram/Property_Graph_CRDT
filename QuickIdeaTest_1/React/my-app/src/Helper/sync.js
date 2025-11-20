import * as Y from 'yjs';

export function syncDocs(docFrom, docTo) {
  const update = Y.encodeStateAsUpdate(docFrom);
  Y.applyUpdate(docTo, update);
}