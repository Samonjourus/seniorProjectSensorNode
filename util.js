function isObject(item) {
    return (!!item) && (item.constructor === Object);
};

async function programArduino(settings){
    let result = await createSketch(settings);
    if(result.code == 3){
        return result;
    }
    else{
        //arduino --upload sketch/sketch.ino --port /dev/ttyUSB*
        const uploadArduinoScript = EXEC("/opt/arduino/arduino --upload arduinoCode/arduinoCode.ino --port /dev/ttyUSB0",
            function (err, out, stderr) {
                if (err) {
                    return {
                        "code": 4,
                        "error": err,
                        'stderr':stderr
                    };
                }
                else {
                    return {
                        "code": 0
                    };
                }
            });
    }
}

async function createSketch(settings){
    const createArduinoScript = EXEC("python3 scripts/create.py '" + JSON.stringify(settings) + "'",
     function (err, out, stderr) {
        if (err) {
            return {
                "code":3,
                "message":err
            };
        }
        else {
            return {
                "code":0,
                "fileAddress":out};
        }
    });
}
module.exports = {
    isObject:isObject,
    programArduino: programArduino
}