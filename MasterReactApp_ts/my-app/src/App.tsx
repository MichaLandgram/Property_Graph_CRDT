import React, { useState } from 'react';
import './App.css';
import { LiveSchemaDemo } from './1_Schema_CRDT/ExperimentHelper/LiveSchemaDemo';

type Tab = 'schema' | 'lens' | 'raw';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('schema');

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
      
      {/* Header & Tabs */}
      <div style={{ padding: '20px 20px 0 20px', borderBottom: '1px solid #30363d' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          <div style={tabStyle('schema')} onClick={() => setActiveTab('schema')}>
            Schema Editor
          </div>
          <div style={tabStyle('lens')} onClick={() => setActiveTab('lens')}>
            Lens Result (Dummy)
          </div>
          <div style={tabStyle('raw')} onClick={() => setActiveTab('raw')}>
            Raw Data (Dummy)
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {activeTab === 'schema' && (
          <LiveSchemaDemo />
        )}
        
        {activeTab === 'lens' && (
          <div style={{ padding: '30px', textAlign: 'center', color: '#8b949e', height: '100%', boxSizing: 'border-box' }}>
            <h2>Lens Result - TODO :D</h2>
          </div>
        )}
        
        {activeTab === 'raw' && (
          <div style={{ padding: '30px', textAlign: 'center', color: '#8b949e', height: '100%', boxSizing: 'border-box' }}>
            <h2>Raw CRDT Data - TODO :D</h2>
          </div>
        )}
      </div>

    </div>
  );
}

export default App;
