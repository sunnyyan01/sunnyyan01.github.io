if [ "$1" ]; then
  date=$1
else
  date=$(date -I"date" | tr -d "-")
fi
echo "Finding starting locations for date $date"

service_ids=$(./date_to_calendar.py $date | tr -d "\r")

rosters=$(cut -d"," -f3 "gtfs/trips.txt" |
    grep -e "$service_ids" |
    cut -d"." -f1,2,3,4 |
    tr -d "\"" |
    grep -E "^[BLS]?[0-9]+-*[A-Z]+\." |
    grep -E -o "^[BLS]?[0-9]+" |
    uniq
)

temp1=$(mktemp)
for roster in $rosters;
do
    stopId=$(grep -P "^\"$roster[\-A-Z]+\." "gtfs/stop_times.txt" |
        cut -d, -f2,4 |
        sort |
        head -1 |
        cut -d, -f2 |
        tr -d "\""
    )
    echo "$roster $stopId" >> "$temp1"
done

mv "$temp1" "startingLocs$date.txt"

# outFile="startingLocs$date.txt"
# rm "$outFile"

# result=$(echo "$rosters" | paste temp - | sort > $outFile)


# s1=$(cut -f1 <<< "$result")
# num=0
# for line in "$result"
# do
#     s2=$(cut -f1 <<< "$line")
#     echo "$s1"
#     echo "$s2"
#     if [ "$s1" != "$s2" ]; then
#         stopName=$(grep "$s1" "gtfs/stops.txt" | cut -d, -f3)
#         echo "$s1 $stopName $num\n" >> $outFile
#         num=0
#         s1="$s2"
#     fi

#     cut -f2 <<< "$line" >> $outFile
#     let num++
# done