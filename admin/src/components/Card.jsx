// ===================================================================
// Card Component - Dashboard metric card
// ===================================================================

const Card = ({ title, value, icon, color = 'primary', onClick }) => {
  return (
    <div className={`simple-card simple-card-${color}`} onClick={onClick}>
      <div className='simple-card-header'>
        <span className='simple-card-title'>{title}</span>
        <span className='simple-card-icon'>{icon}</span>
      </div>
      <div className='simple-card-value'>{value}</div>
    </div>
  )
}

export default Card
