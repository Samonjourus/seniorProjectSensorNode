const EXEC = require('child_process').exec;

function isObject(item) {
    return (!!item) && (item.constructor === Object);
};

async function programArduino(settings){
return new Promise(async (resolve,reject)=>{
    let result = await createSketch(settings);
    if(result.code == 3){
        return result;
    }
    else{
        //arduino --upload sketch/sketch.ino --port /dev/ttyUSB*
        const uploadArduinoScript = EXEC("/opt/arduino/arduino --upload arduinoCode/arduinoCode.ino --port /dev/ttyUSB0",
            function (err, out, stderr) {
		console.log("err: "+err)
		console.log("out: "+out)
		console.log("stderr: "+stderr)
                if (err) {
                    return resolve({
                        "code": 4,
                        "error": err,
                        'stderr':stderr
                    });
                }
                else {
                    return resolve ({
                        "code": 0
                    });
                }
            });
    }
})

}

async function createSketch(settings){
    return new Promise((resolve, reject)=>{
const createArduinoScript = EXEC("python3 scripts/createCode.py '" + JSON.stringify(settings) + "'",
     (err, out, stderr)=>{
        if (err) {
            console.log("1")
	    console.log(err)
            console.log(stderr)
            console.log(out)
            return resolve({
                "code":3,
                "message":err
            })
        }
        else {
            console.log("2")
            return resolve({
                "code":0,
                "fileAddress":out});
        }
    })
    })
}
module.exports = {
    isObject:isObject,
    programArduino: programArduino
}
