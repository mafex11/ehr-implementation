import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  id?: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ id, options, value, onChange, placeholder }) => {
  const [open, setOpen] = React.useState(false);

  const handleToggle = () => setOpen((o) => !o);
  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="relative" id={id}>
      <button
        type="button"
        className="w-full border rounded px-3 py-2 text-left bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={handleToggle}
      >
        {value.length === 0
          ? <span className="text-gray-400">{placeholder || 'Select...'}</span>
          : options.filter(o => value.includes(o.value)).map(o => o.label).join(', ')
        }
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <label key={option.value} className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => handleSelect(option.value)}
                className="mr-2"
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}; 