import json
import time
import serial
import datetime
import requests

dataset_ids = {}
global hostname
hostname = ""

def main():
        file = open("/etc/hostname")
        global hostname
        hostname = file.read().strip()
        s=serial.Serial(port='/dev/ttyUSB0')
        while 1:
                if(s.in_waiting):
                        temp=s.read(s.in_waiting)
                        temp=temp.decode("utf-8")
                        if(temp[-1] != "\n"):
                                temp+=s.readline().decode("utf-8")
                        pushPoints(temp)
                time.sleep(.75)

def pushPoints(values):
        tags = {}
        for line in values.split("\n"):
                if(line != ""):
#                        print(line)
                        line = json.loads(line)
                        sendData(line)

def sendData(pointInfo):
        global hostname
        print(dataset_ids)
        if pointInfo["name"] not in dataset_ids:
                data={
                "timestamp":'{0:%Y-%m-%dT%H:%M:%S.%fZ}'.format(datetime.datetime.utcnow()),
                "tagName":hostname+"_"+pointInfo["name"],
                "qualityCode":192,
                "value":pointInfo["value"]
                }
                res = requests.post("http://localhost:8080/api/data/store/point", json=data)
                response = json.loads(res.text)
#                print(data)
                dataset_ids[pointInfo["name"]] = response["dataSet_id"]
        else:
                data={
                "dataSet_id":dataset_ids[pointInfo["name"]],
                "timestamp":'{0:%Y-%m-%dT%H:%M:%S.%fZ}'.format(datetime.datetime.utcnow()),
                "tagName":hostname+pointInfo["name"],
                "qualityCode":192,
                "value":pointInfo["value"]
                }
                res = requests.post("http://localhost:8080/api/data/store/point", json=data)
#                print(data)
        return

main()
