import React from 'react';

/**
 * Reusable form input component with validation
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.name - Input name
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Whether the input is required
 * @param {string} props.label - Input label
 * @returns {JSX.Element} FormInput component
 */
function FormInput({ 
  type, 
  name, 
  value, 
  onChange, 
  placeholder, 
  error, 
  required = false,
  label,
  ...rest
}) {
  return (
    <div className="mb-4">
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`appearance-none rounded-md relative block w-full px-3 py-2 border ${
          error ? 'border-red-300' : 'border-gray-300'
        } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary-light focus:z-10 transition-colors duration-200 ${
          rest.className || ''
        }`}
        {...rest}
      />
      {error && (
        <div className="mt-1 text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}

export default FormInput; 