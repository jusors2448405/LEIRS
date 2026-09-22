-- Normalize location for incident 1ac149f9-2075-4125-bb8c-5e321d115ba4
UPDATE incidents SET location = 'Zapote Road, Camarin' WHERE id = '1ac149f9-2075-4125-bb8c-5e321d115ba4';

-- Replace test data in incidents.description for record e6739a11-71fc-481f-b38f-94ff0d3f0b9b
-- Current: test test test 222111333...
-- TODO: UPDATE incidents SET description = 'REALISTIC_VALUE_HERE' WHERE id = 'e6739a11-71fc-481f-b38f-94ff0d3f0b9b';

-- Normalize location for incident e6739a11-71fc-481f-b38f-94ff0d3f0b9b
UPDATE incidents SET location = 'Zapote Road, Camarin' WHERE id = 'e6739a11-71fc-481f-b38f-94ff0d3f0b9b';

-- Replace test data in incidents.description for record 900ea09f-f08b-4632-9377-345006336dae
-- Current: test test 112233...
-- TODO: UPDATE incidents SET description = 'REALISTIC_VALUE_HERE' WHERE id = '900ea09f-f08b-4632-9377-345006336dae';

-- Normalize location for incident 900ea09f-f08b-4632-9377-345006336dae
UPDATE incidents SET location = 'Zapote Road, Camarin' WHERE id = '900ea09f-f08b-4632-9377-345006336dae';

-- Replace test data in incidents.description for record 7f74efc7-d8ac-4016-b586-14b3d227a738
-- Current: test test...
-- TODO: UPDATE incidents SET description = 'REALISTIC_VALUE_HERE' WHERE id = '7f74efc7-d8ac-4016-b586-14b3d227a738';

-- Replace test data in incidents.description for record 6daa0103-92bb-4b09-b862-38a42dce6687
-- Current: test 4...
-- TODO: UPDATE incidents SET description = 'REALISTIC_VALUE_HERE' WHERE id = '6daa0103-92bb-4b09-b862-38a42dce6687';

-- Replace test data in incidents.location for record 6daa0103-92bb-4b09-b862-38a42dce6687
-- Current: kiko camarin
-- TODO: UPDATE incidents SET location = 'REALISTIC_VALUE_HERE' WHERE id = '6daa0103-92bb-4b09-b862-38a42dce6687';

-- Normalize location for incident 6daa0103-92bb-4b09-b862-38a42dce6687
UPDATE incidents SET location = 'Camarin, Caloocan City' WHERE id = '6daa0103-92bb-4b09-b862-38a42dce6687';

-- Replace test data in incidents.description for record 2192f73b-3058-4902-a25b-bd4b2154f3ca
-- Current: test 3...
-- TODO: UPDATE incidents SET description = 'REALISTIC_VALUE_HERE' WHERE id = '2192f73b-3058-4902-a25b-bd4b2154f3ca';

-- Replace test data in incidents.description for record fcdcb46b-e661-43b6-ad5d-981daf34278a
-- Current: test 2...
-- TODO: UPDATE incidents SET description = 'REALISTIC_VALUE_HERE' WHERE id = 'fcdcb46b-e661-43b6-ad5d-981daf34278a';

-- Normalize location for incident fcdcb46b-e661-43b6-ad5d-981daf34278a
UPDATE incidents SET location = 'Zapote Road, Camarin' WHERE id = 'fcdcb46b-e661-43b6-ad5d-981daf34278a';

-- Replace test data in incidents.description for record f42bf754-1f55-4ee5-aaa3-bbdf46b99279
-- Current: test 1...
-- TODO: UPDATE incidents SET description = 'REALISTIC_VALUE_HERE' WHERE id = 'f42bf754-1f55-4ee5-aaa3-bbdf46b99279';

-- Normalize location for incident f42bf754-1f55-4ee5-aaa3-bbdf46b99279
UPDATE incidents SET location = 'Camarin, Caloocan City' WHERE id = 'f42bf754-1f55-4ee5-aaa3-bbdf46b99279';

-- Replace test data in incidents.description for record 0a4602a2-22f2-4c14-a603-b207c21d75b4
-- Current: TEST...
-- TODO: UPDATE incidents SET description = 'REALISTIC_VALUE_HERE' WHERE id = '0a4602a2-22f2-4c14-a603-b207c21d75b4';

-- Normalize location for incident 0a4602a2-22f2-4c14-a603-b207c21d75b4
UPDATE incidents SET location = 'Camarin' WHERE id = '0a4602a2-22f2-4c14-a603-b207c21d75b4';

-- Replace test data in case_documentations.case_notes for record 0a4602a2-22f2-4c14-a603-b207c21d75b4
-- Current: Case is under investigation

[8/28/2026, 10:59:43 ...
-- TODO: UPDATE case_documentations SET case_notes = 'REALISTIC_VALUE_HERE' WHERE incident_id = '0a4602a2-22f2-4c14-a603-b207c21d75b4';

-- Replace test data in case_documentations.case_notes for record fcdcb46b-e661-43b6-ad5d-981daf34278a
-- Current: test...
-- TODO: UPDATE case_documentations SET case_notes = 'REALISTIC_VALUE_HERE' WHERE incident_id = 'fcdcb46b-e661-43b6-ad5d-981daf34278a';

-- Replace test data in evidence.evidence_name for record eb85e11f-992f-498f-9e48-c4d763773ebe
-- Current: test
-- TODO: UPDATE evidence SET evidence_name = 'REALISTIC_VALUE_HERE' WHERE id = 'eb85e11f-992f-498f-9e48-c4d763773ebe';

-- Replace test data in police_stations.station_name for record 60f98e22-1aad-45c5-957c-1a5c61559972
-- Current: Test Police Station Alpha
-- TODO: UPDATE police_stations SET station_name = 'REALISTIC_VALUE_HERE' WHERE id = '60f98e22-1aad-45c5-957c-1a5c61559972';

-- Replace test data in police_stations.address for record 60f98e22-1aad-45c5-957c-1a5c61559972
-- Current: Mock Address - North Caloocan (Test Data)
-- TODO: UPDATE police_stations SET address = 'REALISTIC_VALUE_HERE' WHERE id = '60f98e22-1aad-45c5-957c-1a5c61559972';

-- Replace test data in police_stations.station_name for record 9429ff11-f986-4552-8523-f2b943f3221b
-- Current: Test Police Station Bravo
-- TODO: UPDATE police_stations SET station_name = 'REALISTIC_VALUE_HERE' WHERE id = '9429ff11-f986-4552-8523-f2b943f3221b';

-- Replace test data in police_stations.address for record 9429ff11-f986-4552-8523-f2b943f3221b
-- Current: Mock Address - Camarin Central (Test Data)
-- TODO: UPDATE police_stations SET address = 'REALISTIC_VALUE_HERE' WHERE id = '9429ff11-f986-4552-8523-f2b943f3221b';

-- Replace test data in police_stations.station_name for record e1f2991b-ea4f-449b-96df-d87f10653ecb
-- Current: Test Police Station Charlie
-- TODO: UPDATE police_stations SET station_name = 'REALISTIC_VALUE_HERE' WHERE id = 'e1f2991b-ea4f-449b-96df-d87f10653ecb';

-- Replace test data in police_stations.address for record e1f2991b-ea4f-449b-96df-d87f10653ecb
-- Current: Mock Address - East Camarin (Test Data)
-- TODO: UPDATE police_stations SET address = 'REALISTIC_VALUE_HERE' WHERE id = 'e1f2991b-ea4f-449b-96df-d87f10653ecb';