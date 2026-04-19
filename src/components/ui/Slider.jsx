export default function Slider({ id, min, max, step, value, onChange, label }) {
  return (
    <label className="slider-control" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="slider-value">{value.toFixed(2)}x</span>
    </label>
  );
}
