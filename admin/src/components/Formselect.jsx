import Select from "react-select"

const FormSelect = ({
    options,
    value,
    onChange,
    placeholder,
    error,
}) => {
    return (
        <div className="col-md-6">
            <div className="floating-select">
                <Select
                    classNamePrefix="react-select"
                    options={options}


                    value={
                        options.find(opt => opt.value === value) || null
                    }


                    onChange={(selected) =>
                        onChange(selected.value)
                    }

                    placeholder={placeholder}

                    /* ✅ IMPORTANT */
                    menuPosition="absolute"
                    menuPlacement="bottom"

                    styles={{
                        menu: (base) => ({
                            ...base,
                            marginTop: 6,
                            zIndex: 50,
                        }),
                    }}
                />

                {error && <div className="error-text">{error}</div>}
            </div>
        </div>
    )
}

export default FormSelect
