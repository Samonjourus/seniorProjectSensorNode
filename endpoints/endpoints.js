const EXPRESS = require("express")
const UTIL = require("../util.js")
const EXEC = require('child_process').exec;

router = EXPRESS.Router();

/**
 * @api {get} /api/status Check server connectivity
 * @apiVersion 0.0.1
 * @apiName getStatus
 * @apiGroup STATUS
 *
 * @apiDescription checks if there is connectivity from the caller to the server.
 *
 * @apiSuccess {String} status connection status.
 * 
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "good"
 *     }
 */
router.get("/api/status", async function (req, res) {
  res.end(JSON.stringify({ "status": "good" }))
})

/**
 * @api {post} /api/arduino/upload create and upload Arduino code
 *
 * @apiVersion 0.0.1
 * @apiName uploadArduno
 * @apiGroup ARDUINO
 *
 * @apiParam {Object} settings REQUIRED valid arduino configuration.
 * 
 * @apiDescription generates an arduino sketch based on the uploaded json and pushes it to the arduino if it is attached to the node.
 * @apiSuccess {String} status connection status.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "good"
 *     }
 */
router.post("/api/arduino/upload", async function (req, res) {
  if (req.body.settings == undefined) { // return if settings is undefined
    res.json({ 
      "status": "bad",
      "errorCode":1,
      "reason":"'settings' undefined"
    })
    return;
  }
  else if(!UTIL.isObject(req.body.settings)){ //settings is not an object
    res.json({
      "status": "bad",
      "errorCode": 2,
      "reason": "'settings' is not of type Object"
    })
    return;
  }

  let result = await UTIL.programArduino(req.body.settings);
  
  if(result == 3){
    res.json({
      "status": "bad",
      "errorCode": 3,
      "reason": "plugin error",
      "message": err
    })
    return;
  }
  else{
    res.json({
      "status": "good"
    })
    return;
  }
})

module.exports = router;
