function createService (){
echo '[Unit]
Description=Sensor Node Webserver

[Service]
Type=simple
User=pi
WorkingDirectory=/opt/seniorProjectSensorNode/
ExecStart=/usr/local/bin/node /opt/seniorProjectSensorNode/index.js
Restart=on-failure
[Install]
WantedBy=multi-user.target' > sensorNode.service;
sudo mv sensorNode.service /etc/systemd/system/;
sudo systemctl enable sensorNode;
sudo systemctl start sensorNode;
}

function moveDir(){
sudo mkdir /opt/seniorProjectSensorNode/
sudo cp -r "$(dirname "$0")" /opt/seniorProjectSensorNode/
}

function getNodeFromPi(){
n=$(which node); \
n=${n%/bin/node}; \
chmod -R 755 $n/bin/*; \
sudo cp -r $n/{bin,lib,share} /usr/local
}


if [ ! -d "/home/pi/.nvm/versions/node/" ]; then
echo "run nvm install 10"
exit 1
fi


getNodeFromPi;
moveDir;
createService;
