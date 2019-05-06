int loadCellvalue;
int temperatureSensorvalue;

void setup()
{
	Serial.begin(9600);
}
void loop()
{
	loadCellvalue = analogRead(3);
	temperatureSensorvalue = analogRead(4);

	Serial.println("{\"name\":\"VSU_EnvSens_01_loadCell\",\"value\":"+String(loadCellvalue)+"}");
	Serial.println("{\"name\":\"VSU_EnvSens_01_temperatureSensor\",\"value\":"+String(temperatureSensorvalue)+"}");

	delay(1000);
}