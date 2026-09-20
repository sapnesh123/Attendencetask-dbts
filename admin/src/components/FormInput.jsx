const FormInput = ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    col = 'col-md-6',
    disabled = false,
    required = false,
    error,
    max,
    min,
}) => {
    return (
        <div className={col}>
            <div className="form-floating custom-input">
                <input
                    type={type}
                    className="form-control"
                    id={name}
                    placeholder={label}
                    name={name}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    required={required}
                    max={max}
                    min={min}
                />
                <label htmlFor={name}>{label}  {required && <span className="text-danger mb-1">*</span>}</label>
                {error && <div className="error-text">{error}</div>}
            </div>
        </div>
    )
}

export default FormInput
