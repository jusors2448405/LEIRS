import EncoderIncidents from '../encoder/Incidents'

// Reuse the existing Incidents list component for incident admin
// The component already displays all incidents with search, filter, and pagination
const Incidents = () => {
  return <EncoderIncidents />
}

export default Incidents
