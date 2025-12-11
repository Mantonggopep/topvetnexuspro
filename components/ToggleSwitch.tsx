
import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, label, disabled }) => {
  return (
    <div className={`flex items-center justify-between cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => !disabled && onChange(!checked)}>
      {label && <span className="text-sm font-medium text-slate-700 mr-3 select-none">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`
          relative w-[51px] h-[31px] rounded-full transition-colors duration-300 ease-[cubic-bezier(0.4,0.0,0.2,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 shadow-inner
          ${checked ? 'bg-green-500' : 'bg-slate-200'}
        `}
      >
        <span
          className={`
            absolute top-[2px] left-[2px] inline-block w-[27px] h-[27px] bg-white rounded-full shadow-md transform transition-transform duration-300 ease-[cubic-bezier(0.4,0.0,0.2,1)]
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;
