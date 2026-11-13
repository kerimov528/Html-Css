import { RigFigure } from '../src/rig.jsx';
import { ANIMS } from '../src/data/anims.js';
import { EX } from '../src/data/exercises.js';
import { Anatomy } from '../src/anatomy.jsx';
function Sheet() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, padding: 8 }}>
      
      
      {Object.entries(ANIMS).map(([id, spec]) => (
        <div key={id} style={{ border: '1px solid #ccd', borderRadius: 6, padding: 2 }}>
          <div style={{ font: '10px sans-serif' }}>{id}</div>
          <div style={{ display: 'flex' }}>
            <RigFigure spec={spec} primary={EX[id].p} secondary={EX[id].s} still stillU={0} />
            <RigFigure spec={spec} primary={EX[id].p} secondary={EX[id].s} still stillU={1} />
          </div>
        </div>
      ))}
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<Sheet />);
