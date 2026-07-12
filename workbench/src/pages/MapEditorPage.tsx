import { useEffect, useRef, useState } from 'react';
import { MapEditor } from '../editor/mapEditor';
import type { MapData } from '../editor/mapTypes';
import MapCanvas from '../editor/MapCanvas';

export default function MapEditorPage() {
  const [map, setMap] = useState<MapData | null>(null);
  const [selectedType, setSelectedType] = useState('');
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
        Click a tile to place the selected item — click an occupied tile to remove. Export locks
        the layout as JSON in the exact format the starter loads: drop the file into{' '}
        <code>starter/src/config/map.json</code> and walk around it.
      </p>
      <div className="editor-layout">
        <MapCanvas map={map} editor={editor} version={version} onEdit={bump} />
        <div className="editor-panel">
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
            {editor.count(selectedType)} placed · {map.items.length} total
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
              editor.clearType(selectedType);
              bump();
            }}
          >
            Clear this type
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
