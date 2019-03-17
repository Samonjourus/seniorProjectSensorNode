import json
import time
import serial
import datetime

dataset_ids = {}

def main():
        s=serial.Serial(port='/dev/ttyUSB0')
        while 1:
                if(s.in_waiting):
                        temp=s.read(s.in_waiting)
                        temp=temp.decode("utf-8")
                        if(temp[-1] != "\n"):
                                temp+=s.readline().decode("utf-8")
                        pushPoints(temp)
                time.sleep(.75)

def aggregate(values):
        tags = {}
        for line in x:
                if(line != ""):
                        line = json.loads(line)
                        sendData(line)

def sendData(pointInfo):
        print(dataset_ids)
        if pointInfo["tagName"] not in dataset_ids:
                data={
                "timestamp":datetime.datetime.utcnow(),
                "tagName":pointInfo["name"],
                "qualityCode":192,
                "value":pointInfo["value"]
                }
                res = requests.post("http://localhost:8080/api/data/store/point", json=data)
                response = json.loads(res.text)
                dataset_ids[pointInfo["tagName"]] = response["dataSet_id"]
        else:
                data={
                "dataSet_id":dataset_ids[pointInfo["tagName"]],
                "timestamp":datetime.datetime.utcnow(),
                "tagName":pointInfo["name"],
                "qualityCode":192,
                "value":pointInfo["value"]
                }
                res = requests.post("http://localhost:8080/api/data/store/point", json=data)
        return

main()