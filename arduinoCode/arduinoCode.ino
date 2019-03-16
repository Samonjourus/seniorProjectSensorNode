int temperatureSensorvalue;
int loadCellvalue;

void setup()
{
	Serial.begin(9600);
}
void loop()
{
	temperatureSensorvalue = analogRead(2);
	loadCellvalue = analogRead(3);

	Serial.println(temperatureSensorvalue);
	Serial.println(loadCellvalue);

}