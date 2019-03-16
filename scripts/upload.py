import json
import sys
import os

def main():
    currentDir = os.path.dirname(os.path.realpath(__file__))+"/../arduinoCode/"
    settings = json.loads(sys.argv[1])
    code = open(currentDir+"arduinoCode.ino", "w")
    code.write("void setup()\n{\n\tSerial.begin(9600);\n}\nvoid loop()\n{\n")
    for sensor in settings["sensors"]:
        code.write("\t"+sensor["name"]+"value = analogRead("+str(sensor["pin"])+");\n")
    code.write("\n")
    for sensor in settings["sensors"]:
        code.write("\tSerial.println("+sensor["name"]+"value);\n")
    #write setup
    #write loop
    code.write("\n}")
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