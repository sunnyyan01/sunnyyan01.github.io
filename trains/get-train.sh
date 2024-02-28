read apikey < gtfs/api_key.txt
curl -H "Authorization: apikey $apikey" -o gtfs/gtfs.zip "https://api.transport.nsw.gov.au/v1/gtfs/schedule/sydneytrains"
unzip gtfs/gtfs.zip -d gtfs