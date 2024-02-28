import sys
import csv

stopIdDict = {}
with open("gtfs/stops.txt") as f:
    for line in csv.DictReader(f):
        stopIdDict[line["stop_id"]] = line["stop_name"]

startingPoints = {}
with open(sys.argv[1]) as f:
    for line in f:
        roster, stopId = line.strip().split(" ")
        stopName = stopIdDict[stopId]
        if stopName in startingPoints:
            startingPoints[stopName].append(roster)
        else:
            startingPoints[stopName] = [roster]

for name, rosters in startingPoints.items():
    print(name, len(rosters), rosters)