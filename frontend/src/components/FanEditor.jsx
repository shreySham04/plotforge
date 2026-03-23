export default function FanEditor({ value, onChange, placeholder = "Write your fan theory..." }) {
  return (
    <textarea
      className="input min-h-60 resize-y"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required
    />
  );
}
