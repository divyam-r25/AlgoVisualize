export default function SplitPane({ left, right }) {
  return (
    <section className="split-pane">
      <div className="split-pane-left">{left}</div>
      <div className="split-pane-right">{right}</div>
    </section>
  );
}
