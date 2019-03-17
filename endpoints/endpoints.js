const EXPRESS = require("express")
const UTIL = require("../util.js")
const OBJECTID = require("mongodb").ObjectID


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

router.get("/api/metadata/retrieve", function(req,res){
  UTIL.getDocumentsArray(req.query).then(function(data){
    res.end(data)
  }).catch(function(reason){
    res.end(reason)
  })
})

router.post("/api/equipment/store", function(req,res){
  UTIL.uploadEquipmentDocument(req.body.document, req.body.collection).then(function(insertedId){
    res.end({"status":"good","_id":insertedId})
  }).catch(function(reason){
    res.end(reason)
  })
})

//retrieve data from MongoDB
router.get("/api/data/retrieve", function(req,res){
  if(req.query.dataSet_id == undefined){
    res.end(JSON.stringify({"status":"bad","reason":"No data set"}))
    return;
  }
  UTIL.getData(req.query).then(function(data){
    res.end(JSON.stringify(data))
  }).catch(function(reason){
    res.end(JSON.stringify(reason))
  })
})

router.post("/api/data/store/point", function(req,res){
  if(req.body.dataSet_id == undefined){//new dataset
    let dataSetDocument = {
      "firstTimestamp":new Date(req.body.timestamp),
      "lastTimestamp":new Date(req.body.timestamp),
      "tagName":req.body.tagName,
      "firstDataDocument":null,
      "lastDataDocument":null,
      "dataPointsPerDocument":1000,
      "length":1,
      "totalSamples":0,
      "Groups":[]
    }
    UTIL.postDataSetDocument(dataSetDocument).then(function(dataSet_id){
      //console.log("dataset_id = " +  dataSet_id);
      let dataDocument ={
        "tagName":req.body.tagName,
        "dataSet":dataSet_id,
        "previous_id":null,
        "index":0,
        "count":1,
        "firstTimestamp":new Date(req.body.timestamp),
        "lastTimestamp":new Date(req.body.timestamp),
        "data":[
          {
          "value":req.body.value,
          "qualityCode":req.body.qualityCode,
          "timestamp":new Date(req.body.timestamp)
          }
        ],
        "next_id":null
      }
      UTIL.updateDataTag(dataSet_id, req.body.tagName);
      console.log("data = " + JSON.stringify(dataDocument));
      UTIL.postDataDocument(dataDocument).then(function(dataResult){
        res.end(JSON.stringify({"dataSet_id":dataSet_id}))
        UTIL.updateJob(req.body.job_id, dataSet_id)
      })
    }).catch(function(dataSetResult){console.log(JSON.stringify(dataSetResult));});
  }
  else{//existing data set
    req.body.dataSet_id = OBJECTID.createFromHexString(req.body.dataSet_id);
    let data = {
      "value":req.body.value,
      "qualityCode":req.body.qualityCode,
      "timestamp":new Date(req.body.timestamp)
    }
    console.log("gotten to else");
    console.log("data is :" + JSON.stringify(data));
    UTIL.GetLastDataDocument(req.body.dataSet_id, data, req.body.TagName).then(function(lastDataDocument_id){
      console.log("the last document is: " + lastDataDocument_id);
      UTIL.appendData(lastDataDocument_id, data).then(function(){
        console.log("appended");
        res.end(JSON.stringify({"dataSet_id":req.body.dataSet_id}))
      })
    })
  }
})

module.exports = router;
