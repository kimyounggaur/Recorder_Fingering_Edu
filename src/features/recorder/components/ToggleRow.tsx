interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  testId?: string;
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  testId,
}: ToggleRowProps) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        data-testid={testId}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
