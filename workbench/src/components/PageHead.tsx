/**
 * Shared page header. The chip is the kit's signature: every tool states the
 * artifact it produces for your AI agent, because that's what these tools are
 * for — you tune by feel here, your agent gets exact data.
 */
export default function PageHead(props: { title: string; lede: string; artifact?: string }) {
  return (
    <div className="page-head">
      <div>
        <h1>{props.title}</h1>
        <p className="lede">{props.lede}</p>
      </div>
      {props.artifact && (
        <span className="chip" title="What this page produces for your AI agent">
          <span className="lbl">hand your AI</span>
          <span className="art">{props.artifact}</span>
        </span>
      )}
    </div>
  );
}
