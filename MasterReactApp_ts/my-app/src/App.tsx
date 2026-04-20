import React, { useState, useMemo } from 'react';
import * as Y from 'yjs';
import './App.css';
import { Schema_v1 } from './1_Schema_CRDT/Schema/schema_v1';
import { baseSchema } from './1_Schema_CRDT/ExperimentHelper/baseSchema';
import { bon19SchemaDef } from './1_Schema_CRDT/ExperimentHelper/Bon19_Schema';
import { LiveSchemaDemo } from './1_Schema_CRDT/ExperimentHelper/LiveSchemaDemo';
import { LivePGDemo } from './3_PG_CRDT/0_Vizualization/LivePGDemo';
import { LiveLensDemo } from './2_LensLayer/ExperimentHelper/LiveLensDemo';

type Tab = 'schema' | 'lens' | 'raw';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('schema');

  // Shared Yjs state — one source of truth for all three tabs
  // Schema Editor (Client A & B) and Lens Layer read from the SAME schema doc - Client A.
  // Raw PG (Client A & B) and Lens Layer read from the SAME graph doc - CLient A.
  const { schemaDoc1, schemaDoc2, schema1, schema2, pgDoc1, pgDoc2 } = useMemo(() => {
    // Schema CRDT docs
    const sd1 = new Y.Doc(); sd1.clientID = 1;
    const sd2 = new Y.Doc(); sd2.clientID = 2;
    const s1 = new Schema_v1(bon19SchemaDef, sd1);
    const s2 = new Schema_v1({ nodes: [], relationships: [] }, sd2);

    // Property Graph docs
    const pd1 = new Y.Doc(); pd1.clientID = 6;
    const pd2 = new Y.Doc(); pd2.clientID = 7;

    return { schemaDoc1: sd1, schemaDoc2: sd2, schema1: s1, schema2: s2, pgDoc1: pd1, pgDoc2: pd2 };
  }, []);

  const tabStyle = (tabName: Tab) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    background: activeTab === tabName ? '#21262d' : '#0d1117',
    color: activeTab === tabName ? '#58a6ff' : '#c9d1d9',
    border: '1px solid #30363d',
    borderBottom: activeTab === tabName ? '1px solid transparent' : '1px solid #30363d',
    fontWeight: activeTab === tabName ? 'bold' : 'normal',
    borderRadius: '6px 6px 0 0',
    marginBottom: '-1px',
    zIndex: activeTab === tabName ? 2 : 1,
    position: 'relative' as const
  });

  return (
    <div className="App" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0d1117', color: '#c9d1d9' }}>

      <div style={{ padding: '20px 20px 0 20px', borderBottom: '1px solid #30363d' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          <div style={tabStyle('schema')} onClick={() => setActiveTab('schema')}>
            Schema Editor
          </div>
          <div style={tabStyle('lens')} onClick={() => setActiveTab('lens')}>
            Lens Layer
          </div>
          <div style={tabStyle('raw')} onClick={() => setActiveTab('raw')}>
            Raw Property Graph
          </div>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        <div style={{ display: activeTab === 'schema' ? 'flex' : 'none', height: '100%' }}>
          <LiveSchemaDemo doc1={schemaDoc1} doc2={schemaDoc2} schema1={schema1} schema2={schema2} />
        </div>

        <div style={{ display: activeTab === 'lens' ? 'flex' : 'none', height: '100%', width: '100%' }}>
          <LiveLensDemo pgDoc={pgDoc1} schemaDoc={schemaDoc1} schema={schema1} />
        </div>

        <div style={{ display: activeTab === 'raw' ? 'flex' : 'none', height: '100%', width: '100%' }}>
          <LivePGDemo doc1={pgDoc1} doc2={pgDoc2} />
        </div>

      </div>
    </div>
  );
}

export default App;
