import React from 'react'
import PropTypes from 'prop-types'

const PageHeader = ({ title, subtitle, icon, actions }) => {
    return (
        <div className='card-header bg-white border-0 px-4 py-3'>
            <div className='d-flex justify-content-between align-items-center'>
                <div>
                    <h5 className='fw-bold mb-1'>
                        {icon && <span className='text-primary me-2'>{icon}</span>}
                        {title}
                    </h5>
                    {subtitle && <small className='text-muted'>{subtitle}</small>}
                </div>
                {actions && <div className='header-actions'>{actions}</div>}
            </div>
        </div>
    )
}

PageHeader.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    icon: PropTypes.node,
    actions: PropTypes.node,
}

export default PageHeader
