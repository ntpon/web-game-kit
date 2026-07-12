import PageHead from '../components/PageHead';

export default function ToolFramePage(props: {
  title: string;
  lede: string;
  artifact: string;
  src: string;
}) {
  return (
    <>
      <PageHead title={props.title} lede={props.lede} artifact={props.artifact} />
      <iframe className="toolframe" src={`${props.src}?embed=1`} title={props.title} />
    </>
  );
}
