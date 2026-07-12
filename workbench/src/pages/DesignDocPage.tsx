import { useEffect, useState } from 'react';
import PageHead from '../components/PageHead';

export default function DesignDocPage() {
  const [text, setText] = useState('loading…');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('design-doc-template.md')
      .then((r) => r.text())
      .then(setText)
      .catch(() => setText('failed to load design-doc-template.md'));
  }, []);

  return (
    <>
      <PageHead
        title="Design doc template"
        lede="One page you fill in before asking AI to write any code. If you can answer these, your prompts stop being vague."
        artifact="DESIGN.md"
      />
      <div className="page">
        <p>
          <button
            className="primary"
            onClick={() => {
              navigator.clipboard?.writeText(text).then(() => setCopied(true));
            }}
          >
            {copied ? 'copied ✓' : 'Copy template'}
          </button>
        </p>
        <pre>
          <code>{text}</code>
        </pre>
      </div>
    </>
  );
}
