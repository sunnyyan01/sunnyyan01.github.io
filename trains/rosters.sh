if [ "$1" ]; then
  date=$1
else
  date=$(date -I"date" | tr -d "-")
fi
echo "Finding rosters for date $date"

service_ids=$(./date_to_calendar.py $date | tr -d "\r")

rosters=$(cut -d"," -f3 "gtfs/trips.txt" |
    grep -e "$service_ids" |
    cut -d"." -f1,6,5 |
    tr -d "\"" |
    grep -E "^[BLS]?[0-9]+-*[A-Z]+\." |
    sed -E "s/^([BLS]?[0-9]+)-*[A-Z]+\.([A-Z])\.([0-9])$/\1\t\3\2/" |
    uniq |
    sort -h
)

echo "$rosters" > "rostersFull$date.txt"

./find_roster_ranges.py < "rostersFull$date.txt" > "rosterRanges$date.txt"