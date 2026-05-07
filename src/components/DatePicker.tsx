import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  required?: boolean;
  showTimeSelect?: boolean;
  timeOnly?: boolean;
  timeIntervals?: number;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder,
  required,
  showTimeSelect = false,
  timeOnly = false,
  timeIntervals = 15,
}: DatePickerProps) {
  return (
    <ReactDatePicker
      selected={value}
      onChange={onChange}
      minDate={minDate}
      maxDate={maxDate}
      placeholderText={placeholder}
      required={required}
      showTimeSelect={showTimeSelect || timeOnly}
      showTimeSelectOnly={timeOnly}
      timeIntervals={timeIntervals}
      timeCaption="Time"
      dateFormat={
        timeOnly ? 'h:mm aa' : showTimeSelect ? 'dd MMM yyyy, h:mm aa' : 'dd MMM yyyy'
      }
      className="game-input w-full"
      calendarClassName="gc-calendar"
      popperClassName="gc-popper"
      autoComplete="off"
    />
  );
}
