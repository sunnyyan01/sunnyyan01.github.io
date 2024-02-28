#!python
import sys

curRangeStart = -1
curRangeEnd = -1
curRangeLen = 0
curRangeConsist = ""
for roster in sys.stdin:
    trainNo, consist = roster.strip().split("\t")
    
    if not trainNo[0].isnumeric():
        print(trainNo, consist)
        continue
    
    trainNo = int(trainNo)

    if consist != curRangeConsist:
        if curRangeConsist:
            print(curRangeStart, curRangeEnd, curRangeLen, curRangeConsist)
        curRangeStart = trainNo
        curRangeLen = 0
        curRangeConsist = consist

    curRangeEnd = trainNo
    curRangeLen += 1
