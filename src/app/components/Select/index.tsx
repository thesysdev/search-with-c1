import {
  Select as CrayonSelect,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@crayonai/react-ui";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  defaultValue?: string;
  label?: string;
}

export const Select = ({
  options,
  placeholder = "Select an option",
  value,
  onChange,
  disabled = false,
  defaultValue,
  label,
}: SelectProps) => {
  return (
    <CrayonSelect
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      defaultValue={defaultValue}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </CrayonSelect>
  );
};
