import sys
import time
import csv
import re

if len(sys.argv) == 1:
    dateObj = time.localtime()
else:
    dateObj = time.strptime(sys.argv[1], "%Y%m%d")
day = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"][dateObj.tm_wday]
serviceIds = set()
with open("gtfs/calendar.txt") as f:
    for line in csv.DictReader(f):
        if line[day] == "1":
            start = time.strptime(line["start_date"], "%Y%m%d")
            end = time.strptime(line["end_date"], "%Y%m%d")
            if start <= dateObj <= end:
                serviceIds.add(line["service_id"])

rosterToTripId = {}
rosterToTripNum = {}
with open("gtfs/trips.txt") as f:
    for line in csv.DictReader(f):
        if not line["service_id"] in serviceIds:
            continue
        result = re.match("([SLFB]?[0-9]+)-*([A-Z]+)", line["trip_id"][:4])
        if not result:
            continue
        runNum, rosterNum, tripNum = result.group(0, 1, 2)
        if re.match("[2345789][0-9]{2}", rosterNum):
            continue
        if rosterToTripNum.get(rosterNum, "ZZZ") > tripNum:
            rosterToTripNum[rosterNum] = tripNum
            rosterToTripId[rosterNum] = line["trip_id"]

tripIdToRoster = {tripId: roster for roster, tripId in rosterToTripId.items()}
rosterToStartTime = {}
rosterToStartLoc = {}
with open("gtfs/stop_times.txt") as f:
    for line in csv.DictReader(f):
        roster = tripIdToRoster.get(line["trip_id"])
        if not roster:
            continue
        if rosterToStartTime.get(roster, "99:00:00") > line["arrival_time"]:
            rosterToStartTime[roster] = line["arrival_time"]
            rosterToStartLoc[roster] = line["stop_id"]

startLocToRosters = {}
for roster, startLoc in rosterToStartLoc.items():
    if startLoc in startLocToRosters:
        startLocToRosters[startLoc].append(roster)
    else:
        startLocToRosters[startLoc] = [roster]

dateStr = time.strftime("%Y%m%d", dateObj)
outFile = open(f"startingLocs{dateStr}.txt", "w")
with open("gtfs/stops.txt") as f:
    for line in csv.DictReader(f):
        if line["stop_id"] in startLocToRosters:
            rosters = startLocToRosters[line["stop_id"]]
            print(line["stop_id"], line["stop_name"], len(rosters), file=outFile)
            print(rosters, file=outFile)
            print(file=outFile)
outFile.close()