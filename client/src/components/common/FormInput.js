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
    <div className="form-group">
      {label && <label htmlFor={name}>{label}</label>}
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={error ? 'input-error' : ''}
        {...rest}
      />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default FormInput; 