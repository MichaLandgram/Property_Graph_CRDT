import * as Y from 'yjs';

export function syncDocs(docFrom: Y.Doc, docTo: Y.Doc) {
  const update = Y.encodeStateAsUpdate(docFrom);
  Y.applyUpdate(docTo, update);
}