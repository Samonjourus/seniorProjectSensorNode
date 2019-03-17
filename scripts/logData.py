
import time
import serial

s=serial.Serial(
port='/dev/ttyUSB0',
baudrate=9600,
parity=serial.PARITY_NONE,
stopbits=serial.STOPBITS_ONE,
bytesize=serial.EIGHTBITS,
timeout=1)

counter=0
while 1:
	if(s.in_waiting):
		x=s.read(s.in_waiting)
		x+=s.readline()
		x=x.decode("utf-8").split("\r\n")
		for line in x:
			if(line != ""):
				print(line + "<<")
	time.sleep(1)

