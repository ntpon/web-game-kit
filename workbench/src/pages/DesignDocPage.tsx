import { useEffect, useState } from 'react';

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
    <div className="page">
      <h1>Design doc template</h1>
      <p className="lede">
        One page you fill in before asking AI to write any code. If you can answer these, your
        prompts stop being vague — copy it into your project as <code>DESIGN.md</code>.
      </p>
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
  );
}
