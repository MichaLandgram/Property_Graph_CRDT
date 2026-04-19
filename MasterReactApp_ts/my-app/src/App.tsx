import './App.css';
// import * as Y from 'yjs';
// import { syncDocs } from './Helper/YJS_helper/sync';
// import GraphEditor from './Visualization/Version1/GraphEditor';
// import GraphEditor2 from './Visualization/Version2/GraphEditor2';
// import { GraphErrorBoundary } from './Helper/Vizuals/GraphErrorBoundary';
// import { KuzuTestComponent } from './Kuzu/KuzuTestComponent';
// import { getGraphInstance } from './VersionSelector';
import { LiveSchemaDemo } from './1_Schema_CRDT/ExperimentHelper/LiveSchemaDemo';

// const graph = new Y.Doc();
// const graph2 = new Y.Doc();

function App() {
  // const graphInstance = getGraphInstance();
  return (
    <div className="App" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ margin: '10px' }}>Dynamic Schema Topology Viewer</h1>
        <div style={{ flex: 1, position: 'relative' }}>
            <LiveSchemaDemo />
        </div>
    </div>
  );
}
export default App;
