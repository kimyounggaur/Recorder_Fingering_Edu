interface Segment<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface SegmentedControlProps<T extends string> {
  legend: string;
  value: T;
  options: readonly Segment<T>[];
  onChange: (value: T) => void;
  name: string;
}

export function SegmentedControl<T extends string>({
  legend,
  value,
  options,
  onChange,
  name,
}: SegmentedControlProps<T>) {
  return (
    <fieldset className="setting-fieldset">
      <legend>{legend}</legend>
      <div className="segmented-control">
        {options.map((option) => (
          <label
            key={option.value}
            className="segment-option"
            data-selected={value === option.value}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
            {option.description ? <small>{option.description}</small> : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
