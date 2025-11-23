import './App.css';
import * as Y from 'yjs';
import { syncDocs } from './Helper/sync';
import GraphEditor from './Visualization/Version1/GraphEditor';


const graph = new Y.Doc();
const graph2 = new Y.Doc();

function App() {
  return (
    <div className="App">
      <>
      <button onClick={() => { syncDocs(graph, graph2); }}>Sync User 1 → User 2</button>
      <button onClick={() => { syncDocs(graph2, graph); }}>Sync User 2 → User 1</button>
      <button onClick={() => { syncDocs(graph, graph2); syncDocs(graph2, graph); }}>Bidirectional Sync</button>
      </>
      <div style={{ 
          display: 'flex',
          flexDirection: 'row',
          height: '100vh',
          width: '100%' 
      }}>
        

        <div style={{ 
            flex: 1,
            borderRight: '2px solid #ccc',
            position: 'relative'
        }}>
          <GraphEditor ydoc={graph} />
        </div>

        <div style={{ 
            flex: 1,
            position: 'relative',
            backgroundColor: '#f4f4f4'
        }}>

          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, background: 'white', padding: '5px' }}>
            User 2 (Simulation)
          </div>
          
          <GraphEditor ydoc={graph2} />
        </div>

      </div>
    </div>
  );
}

export default App;
