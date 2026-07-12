import { useEffect, useRef, useState } from 'react';
import { MapEditor, relativeCell } from '../editor/mapEditor';
import type { MapData } from '../editor/mapTypes';
import MapCanvas, { type EditorMode } from '../editor/MapCanvas';

export default function MapEditorPage() {
  const [map, setMap] = useState<MapData | null>(null);
  const [selectedType, setSelectedType] = useState('');
  const [mode, setMode] = useState<EditorMode>('place');
  const [version, setVersion] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<MapEditor | null>(null);

  const loadDefault = () => {
    fetch('map-default.json')
      .then((r) => r.json())
      .then((m: MapData) => {
        const first = Object.keys(m.itemTypes)[0] ?? '';
        editorRef.current = new MapEditor(m, first);
        setMap(m);
        setSelectedType(first);
        setVersion((v) => v + 1);
      });
  };

  useEffect(loadDefault, []);

  if (!map || !editorRef.current) {
    return (
      <div className="page">
        <h1>Map editor</h1>
        <p className="lede">loading…</p>
      </div>
    );
  }

  const editor = editorRef.current;
  const bump = () => {
    setVersion((v) => v + 1);
    setCopied(false);
  };

  const download = () => {
    const blob = new Blob([editor.toJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'map.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="page" style={{ maxWidth: 'none' }}>
      <h1>Map editor</h1>
      <p className="lede">
        <strong>Place</strong>: click a tile to place the selected item, click again to remove.{' '}
        <strong>Collision</strong>: click the cells around a placed item to paint its buffer zone —
        every instance of that type shares the shape. Export locks it all as JSON in the exact
        format the starter loads: drop the file into <code>starter/src/config/map.json</code> and
        walk around it.
      </p>
      <div className="editor-layout">
        <MapCanvas
          map={map}
          version={version}
          mode={mode}
          selectedType={selectedType}
          onTileClick={(tile) => {
            if (mode === 'place') {
              editor.toggle(tile.x, tile.y);
            } else {
              const cell = relativeCell(map, selectedType, tile.x, tile.y);
              if (cell) editor.toggleShapeCell(selectedType, cell[0], cell[1]);
            }
            bump();
          }}
        />
        <div className="editor-panel">
          <strong>Mode</strong>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={mode === 'place' ? 'primary' : ''}
              style={{ flex: 1 }}
              onClick={() => setMode('place')}
            >
              Place
            </button>
            <button
              className={mode === 'collision' ? 'primary' : ''}
              style={{ flex: 1 }}
              onClick={() => setMode('collision')}
            >
              Collision
            </button>
          </div>
          <strong>Item type</strong>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              editor.selectedType = e.target.value;
            }}
          >
            {Object.keys(map.itemTypes).map((t) => (
              <option key={t} value={t}>
                {t}
                {map.itemTypes[t].blocking ? ' (blocks movement)' : ''}
              </option>
            ))}
          </select>
          <span className="muted">
            {mode === 'place'
              ? `${editor.count(selectedType)} placed · ${map.items.length} total`
              : editor.count(selectedType) === 0
                ? `place a ${selectedType} first, then paint its cells`
                : `${editor.shapeOf(selectedType).length} collision cells on every ${selectedType}`}
          </span>
          <button
            className="primary"
            onClick={() => {
              navigator.clipboard?.writeText(editor.toJSON()).then(() => setCopied(true));
            }}
          >
            {copied ? 'copied ✓' : 'Copy JSON'}
          </button>
          <button onClick={download}>Download map.json</button>
          <button onClick={() => setShowImport((s) => !s)}>Import JSON…</button>
          {showImport && (
            <>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="paste a full map or a bare items array"
              />
              <button
                onClick={() => {
                  try {
                    editor.fromJSON(importText);
                    setShowImport(false);
                    setImportText('');
                    bump();
                  } catch {
                    setImportText('invalid JSON — expected a map object or items array');
                  }
                }}
              >
                Apply import
              </button>
            </>
          )}
          <button
            onClick={() => {
              if (mode === 'place') editor.clearType(selectedType);
              else editor.clearShape(selectedType);
              bump();
            }}
          >
            {mode === 'place' ? 'Clear this type' : 'Clear collision cells'}
          </button>
          <button onClick={loadDefault}>Reset to default map</button>
          <span className="muted">
            The circle marks the spawn point. Same editor lives inside the starter (?edit=1) where
            Save writes the file directly.
          </span>
        </div>
      </div>
    </div>
  );
}
