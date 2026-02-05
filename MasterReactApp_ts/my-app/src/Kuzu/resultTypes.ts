
export type KuzuMessage = 
  | { type: 'INIT' }
  | { type: 'QUERY', cypher: string, id: string }
  | { type: 'CLOSE' };

export type KuzuResponse =
  | { type: 'INIT_SUCCESS' }
  | { type: 'QUERY_RESULT', id: string, result: any }
  | { type: 'ERROR', id?: string, error: string };
