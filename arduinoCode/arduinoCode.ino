int temperatureSensorvalue;
int loadCellvalue;

void setup()
{
	Serial.begin(9600);
}
void loop()
{
	temperatureSensorvalue = analogRead(4);
	loadCellvalue = analogRead(3);

	Serial.println("{\"name\":\"VSU_EnvSens_01_temperatureSensor\",\"value\":"+String(temperatureSensorvalue)+"}");
	Serial.println("{\"name\":\"VSU_EnvSens_01_loadCell\",\"value\":"+String(loadCellvalue)+"}");

}