#!python
import csv
import sys
import time

_, date = sys.argv
dateObj = time.strptime(date, "%Y%m%d")
day = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"][dateObj.tm_wday]

with open("gtfs/calendar.txt") as f:
    for line in csv.DictReader(f):
        if line[day] == "1":
            start = time.strptime(line["start_date"], "%Y%m%d")
            end = time.strptime(line["end_date"], "%Y%m%d")
            if start <= dateObj <= end:
                print(line["service_id"])