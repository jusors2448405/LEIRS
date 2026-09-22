import Reporting from '../encoder/Reporting'

// Reuse the existing Reporting component for incident admin
// The component already handles incident creation with all required fields
const NewIncident = () => {
  return <Reporting />
}

export default NewIncident
