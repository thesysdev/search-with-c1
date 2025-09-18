import {
  Select as CrayonSelect,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@crayonai/react-ui";

import { useIsMobile } from "@/app/hooks/useIsMobile";

interface SelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
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
  const isMobile = useIsMobile();

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
          <SelectLabel className="text-xs">{label}</SelectLabel>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="flex items-center gap-xs flex-nowrap"
            >
              <span className="flex items-center gap-xs">
                {!isMobile && option.icon && option.icon}
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </CrayonSelect>
  );
};
