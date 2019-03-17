import json
import sys
import os

def main():
    rootDir = os.path.dirname(os.path.realpath(__file__))+"/../"
    settings = json.loads(sys.argv[1])
    file = open(rootDir+"equipment.json", "r")
    equipmentInfo = json.loads(file.read())
    code = open(rootDir+"arduinoCode/arduinoCode.ino", "w")
    for sensor in settings["sensors"]:
        code.write("int "+sensor["name"]+"value;\n")
    code.write("\nvoid setup()\n{\n\tSerial.begin(9600);\n}\nvoid loop()\n{\n")
    for sensor in settings["sensors"]:
        code.write("\t"+sensor["name"]+"value = analogRead("+str(sensor["pin"])+");\n")
    code.write("\n")
    for sensor in settings["sensors"]:
        code.write("\tSerial.println(\"{\\\"name\\\":\\\""+equipmentInfo["name"]+"_"+sensor["name"]+"\\\",\\\"value\\\":\"+String("+sensor["name"]+"value)+\"}\");\n")
    #write setup
    #write loop
    code.write("\n\tdelay(1000);\n}")
    code.close()

main()

'''
void getTime()
{
    Serial.println("T");
}

void parseTime(input)
{
    //utc time format: YYYY-MM-DDTHH:mm:ssZ
    year = toInt();
    month = toInt();
    day = toInt();
    hour = toInt();
    minute = toInt();
    second = toInt();
}
'''
