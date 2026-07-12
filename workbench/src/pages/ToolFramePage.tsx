export default function ToolFramePage(props: { title: string; lede: string; src: string }) {
  return (
    <div className="toolframe-wrap">
      <div className="toolframe-head">
        <h1>{props.title}</h1>
        <p>{props.lede}</p>
      </div>
      <iframe className="toolframe" src={props.src} title={props.title} />
    </div>
  );
}
