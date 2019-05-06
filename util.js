const EXEC = require('child_process').exec;
const { spawn } = require('child_process')
const MONGOCLIENT = require("mongodb").MongoClient;
const OBJECTID = require("mongodb").ObjectID
const URL = require("./index.js").URL;

var logger;
console.log(URL)
startLogging();

function startLogging(){
    logger = spawn('python3', [__dirname+'/scripts/logData.py']);

    logger.stdout.on('data', (data) => {
        //console.log("'"+data.toString("utf8").trim()+"'");
	//let json = JSON.parse(data);
        //pushPoint({"req":{"body":{"tagName":data.tagName,"timestamp":data.timestamp,"dataSet_id":undefined,"qualityCode":data.qualityCode,"value":data.value}}})
    });

    logger.stderr.on('data', (data) => {
    });

    logger.on('exit', (code) => {
        console.log(`Child exited with code ${code}`);
        setTimeout(startLogging, 5000)
    return;
    });
}

function isObject(item) {
    return (!!item) && (item.constructor === Object);
};

async function programArduino(settings){
    return new Promise(async (resolve,reject)=>{
        logger.kill();
        let result = await createSketch(settings);
        if(result.code == 3){
            return result;
        }
        else{
            //arduino --upload sketch/sketch.ino --port /dev/ttyUSB*
            EXEC("/opt/arduino/arduino --upload "+__dirname+"/arduinoCode/arduinoCode.ino --port /dev/ttyUSB0",
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
                startLogging();
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
        const createArduinoScript = EXEC("python3 "+__dirname+"/scripts/createCode.py '" + JSON.stringify(settings) + "'",
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
                    "fileAddress":out}
                );
            }
        })
    })
}
function pushPoint(req){
console.log(JSON.stringify(req));
return;
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
          }],
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
}


function updateDataTag(dataSet_id, tagName){
    getDocumentByQuery("dataTags", {"tagName":tagName}).then(function(result){
      //console.log(JSON.stringify(result));
      if(result == null){//new tag
        //console.log("nulled");
        dataTagDocument={
          "tagName":tagName,
          "units":"",
          "dataType":"",
          "equipment":null,
          "dataSets":[dataSet_id]
        }
        pushDocument(dataTagDocument, "dataTags")
      }
      else{//append dataSet
        updateDocumentField("dataTags", result._id, "dataSets", "push", dataSet_id)
      }
    })
  }
  function uploadEquipmentDocument(newDocument, collection){
    //console.log(JSON.stringify(newDocument) + " is being pushed into " + collection);
    let dataSets=[]
    return new Promise(function(resolve, reject){
      for(let component of newDocument.components){
        //console.log(JSON.stringify(component));
        //console.log(component.dataTags.length);
        for(let i =0;i< component.dataTags.length;i++){
          dataSets.push(component.dataTags[i])
          //console.log(component.dataTags[i].dataTag_id);
          //component.dataTags[i].dataTag_id=objectid(component.dataTags[i].dataTag_id)
          //console.log("done");
        }
      }
      MONGOCLIENT.connect(URL, function(err, client){
        let repository = client.db("DataRepository");
        repository.collection(collection).insertOne(newDocument, function (err, result){
          if(err){
            client.close();
            reject(null)
            return;
          }
          //console.log(collection + " - " + JSON.stringify(newDocument));
          client.close();
          for (dataSet of dataSets) {
            //console.log(dataSet);
            updateDocumentField("dataTags", objectid(dataSet.dataTag_id), "equipment", "set", result.insertedId)
          }
          resolve(result.insertedId);
          return;
        })
      })
    })
  }
  function pushDocument(newDocument, collection){
    //console.log(JSON.stringify(newDocument) + " is being pushed into " + collection);
    return new Promise(function(resolve, reject){
      MONGOCLIENT.connect(URL, function(err, client){
        let repository = client.db("DataRepository");
        repository.collection(collection).insertOne(newDocument, function (err, result){
          if(err){
            client.close();
            reject(null)
            return;
          }
          client.close();
          resolve(result.insertedId);
          return;
        })
      })
    })
  }
  function getDocuments(parameters){
    parameters.from = parseInt(parameters.from)
    parameters.count = parseInt(parameters.count)
    //console.log(parameters.collection);
    if(parameters.from < 0 || isNaN(parameters.from))
      parameters.from = 0
    if(parameters.count < 0 || isNaN(parameters.count))
      parameters.count = 0
    let query;
    if(parameters.query == undefined)
      query = {};
    else
      query = JSON.parse(parameters.query)
    return new Promise(function(resolve, reject){
      if(parameters.collection == undefined)
        return resolve(JSON.stringify({"status":"error","reason":"no collection"}))
      MONGOCLIENT.connect(URL, function(err, client){
        if(err){
          //console.log(err);
          reject("error connecting with mongo client");
        }
        let repository = client.db("DataRepository");
        repository.collection(parameters.collection).find(query).toArray(function(err,result){
          //console.log(result.length);
          if(result.length < parameters.from){
            client.close();
            resolve(JSON.stringify({"status":"bad","reason":"'from' out of bounds"}))
          }
          client.close();
          let results = {}
          for(let i = 0; i < parameters.count; i++){
            //console.log(i+parameters.from);
            if(i+parameters.from > result.length)
              continue;
            if(result[i] == undefined)
              return resolve(JSON.stringify(results))
            //console.log(JSON.stringify(result[i+parameters.from]));
            results[i] = result[i+parameters.from];
            if(i+parameters.from == result.length || i == (parameters.count-1)){
              return resolve(JSON.stringify(results))
            }
          }
        })
      })
    })
  }
  function getDocumentsArray(parameters){
    parameters.from = parseInt(parameters.from)
    parameters.count = parseInt(parameters.count)
    //console.log(parameters.collection);
    if(parameters.from < 0 || isNaN(parameters.from))
      parameters.from = 0
    if(parameters.count < 0 || isNaN(parameters.count))
      parameters.count = 0
    let query;
    if(parameters.query == undefined)
      query = {};
    else
      query = JSON.parse(parameters.query)
    return new Promise(function(resolve, reject){
      if(parameters.collection == undefined)
        return resolve(JSON.stringify({"status":"error","reason":"no collection"}))
      MONGOCLIENT.connect(URL, function(err, client){
        if(err){
          //console.log(err);
          reject("error connecting with mongo client");
        }
        let repository = client.db("DataRepository");
        repository.collection(parameters.collection).find(query).toArray(function(err,result){
          //console.log(result.length);
          if(result.length < parameters.from){
            client.close();
            resolve(JSON.stringify({"status":"bad","reason":"'from' out of bounds"}))
          }
          client.close();
          let results = {result:[]}
          for(let i = 0; i < parameters.count; i++){
            //console.log(i+parameters.from);
            if(i+parameters.from > result.length)
              continue;
            if(result[i] == undefined)
              return resolve(JSON.stringify(results))
            //console.log(JSON.stringify(result[i+parameters.from]));
            results.result.push(result[i+parameters.from]);
            if(i+parameters.from == result.length || i == (parameters.count-1)){
              return resolve(JSON.stringify(results))
            }
          }
        })
      })
    })
  }
  //requires dataSet_id, (from), (count)
  function getData(parameters){
    parameters.from = parseInt(parameters.from)
    parameters.count = parseInt(parameters.count)
    if(parameters.from < 0 || isNaN(parameters.from))
      parameters.from = 0
    if(parameters.count < 1 || isNaN(parameters.count))
      parameters.count = 1
    //console.log(parameters.from + " " + parameters.count);
    parameters.dataSet_id = objectid(parameters.dataSet_id);
    return new Promise(function(resolve, reject){
      getDocument("dataSets", parameters.dataSet_id).then(function(dataSet){
        //console.log(JSON.stringify(dataSet));
        getDataPoints(dataSet, parameters.from, parameters.count).then(function(data){
          resolve(data);
          return;
        })
      })
    })
  }
  function getPoints(dataDocument, data, from, count, prefix){
    console.log("--------------------------");
    console.log(JSON.stringify(data));
    console.log(from);
    console.log(count);
    console.log(prefix);
    
    return new Promise(function(resolve, reject){
      for(let i = 0; i <count; i++){
        console.log(JSON.stringify(data));
  
        if (from + i >= dataDocument["count"]) {
          console.log("called");
          
          return resolve({ "data": data, "count": i })
  
        }
        data[prefix+i]=dataDocument.data[from+i];
        if (i == (count - 1)) {
          console.log("called");
          console.log(JSON.stringify(data))
          resolve({ "data": data, "count": i + 1 })
  
        }
      }
    })
  }
  function GetNextdata(dataSet, oldDataDocument, count, from, data){
    return new Promise(function(resolve){
      getDocumentByQuery("data", {dataSet:dataSet._id,index:oldDataDocument.index+1}).then(function(dataDocument){
        getPoints(dataDocument ,data, from%dataSet.dataPointsPerDocument, count, from).then(function(data){
          console.log("recurse");
          count = count -data["count"]
          console.log(count)
          if(count > 0)
            GetNextdata(dataSet, dataDocument,count, 0,data["data"]).then(function(data){
              console.log("recurse");
              resolve(data["data"])
            })
          else
            resolve(data["data"])
        })
      })
    })
  }
  function getDataPoints(dataSet, from, count){
    return new Promise(function(resolve){
      let data = {}
      let startingDocumentIndex = Math.floor(from/dataSet.dataPointsPerDocument);
      let query={dataSet:dataSet._id,index:startingDocumentIndex}
      //console.log(JSON.stringify(query));
      getDocumentByQuery("data", query).then(function(dataDocument){
        getPoints(dataDocument, data, from%dataSet.dataPointsPerDocument, count, from).then(function(data){
          //count = count - dataDocument.count - from%dataSet.dataPointsPerDocument
          count = count - data["count"]
          console.log("count:"+count);
          
          if(count > 0)
            GetNextdata(dataSet, dataDocument, count, dataSet.dataPointsPerDocument*(startingDocumentIndex+1), data["data"]).then(function(data){
              console.log("recurse");
              
              resolve(data)
            })
          else
            resolve(data["data"])
        })
      })
    })
  }
  //posts a document to the dataset collection and returns the dataset_id
  function postDataSetDocument(dataSetDocument){
    return new Promise(function(resolve, reject){
      MONGOCLIENT.connect(URL, function(err, client){
	if(err)
		console.log(err);
        let repository = client.db("DataRepository");
        repository.collection("dataSets").insertOne(dataSetDocument, function(err, result){
          if(err){
            //console.log(err);
            client.close();
            reject({"errorLocation":"posting dataset document","err":err});
          }
          client.close();
          resolve(result.insertedId);
        })
      })
    })
  }
  function getDocument(collection, _id){
    let query = {"_id":_id}
    //console.log("querying " + collection + " for " + JSON.stringify(query));
    return new Promise(function(resolve, reject){
      MONGOCLIENT.connect(URL, function(err, client){
        let repository = client.db("DataRepository");
        repository.collection(collection).findOne(query, function (err, result){
          if(err){
            client.close();
            //console.log(err);
            reject(null)
            return;
          }
          //console.log(JSON.stringify(result) + " is the result ----------");
          //console.log(JSON.stringify(query));
          client.close();
          resolve(result);
          return;
        })
      })
    })
  }
  function getDocumentByQuery(collection, query){
    //console.log("querying " + collection + " for " + JSON.stringify(query));
    return new Promise(function(resolve, reject){
      MONGOCLIENT.connect(URL, function(err, client){
        let repository = client.db("DataRepository");
        repository.collection(collection).findOne(query, function (err, result){
          if(err){
            client.close();
            //console.log(err);
            reject(null)
            return;
          }
          //console.log(JSON.stringify(result) + " is the result");
          //console.log(JSON.stringify(query));
          client.close();
          resolve(result);
          return;
        })
      })
    })
  }
  function updateDocumentField(collection, _id, field, option, value){
    let update;
    let query = {"_id":_id}
    if(option == "set")
      update = {$set:{[field]:value}}
    else if(option == "increment")
      update = {$inc:{[field]:1}}
    else if(option == "push")
      update = {$push:{[field]:value}}
    MONGOCLIENT.connect(URL, function(err, client){
      let repository = client.db("DataRepository");
      repository.collection(collection).findOneAndUpdate(query,update, function(err, result){
        if(err){
          client.close();
          //console.log(err);
        }
        client.close();
      })
    })
  }
  function postDataDocument(dataDocument){
    return new Promise(function(resolve, reject){
      MONGOCLIENT.connect(URL, function(err, client){
        let repository = client.db("DataRepository");
        repository.collection("data").insertOne(dataDocument, function(err, result){
          if(err){
            client.close();
            //console.log(err);
            reject({"errorLocation":"posting data document","err":err});
            return;
          }
          //update the dataSet's last document and total number of data samples
          updateDocumentField("dataSets", dataDocument.dataSet, "lastDataDocument", "set", result.insertedId);
          updateDocumentField("dataSets", dataDocument.dataSet, "firstDataDocument", "set", result.insertedId);
          updateDocumentField("dataSets", dataDocument.dataSet, "lastTimestamp", "set", dataDocument.data[0].timestamp);
          updateDocumentField("dataSets", dataDocument.dataSet, "totalSamples", "increment",null);
          resolve(result.insertedId);
          client.close();
          return;
        })
      })
    })
  }
  function GetLastDataDocument(dataSet_id, data, tagName){
    return new Promise(function(resolve,reject){
      //console.log("dataset is : " + dataSet_id);
      //get dataset getDocument
      let dataset = getDocument("dataSets", dataSet_id).then(function(dataset){
        let lastData = getDocument("data", dataset.lastDataDocument).then(function(lastData){
          //console.log(lastData.count + " vs " + dataset.dataPointsPerDocument);
          if(lastData.count == dataset.dataPointsPerDocument){//yes
            //make new data document
            let dataDocument = {
              "dataSet":dataSet_id,
              "previous_id":dataset.lastDataDocument,
              "count":0,
              "index":lastData.index+1,
              "firstTimestamp":data.timestamp,
              "lastTimestamp":data.timestamp,
              "next_id":null
            }
            //console.log("pushing new doc");
            pushDocument(dataDocument, "data").then(function(data_id){
              //console.log("document pushed");
              //initialize -> dataset & previousid
              //return data_id and true for newDoc
              updateDocumentField("dataSets", dataSet_id, "lastDataDocument", "set", data_id);
              updateDocumentField("dataSets", dataSet_id, "length", "increment", null);
              updateDocumentField("data", lastData._id, "next_id", "set", data_id);
              //console.log("new id = " + data_id);
              resolve(data_id)
              return;
            })
          }
          else{
            //no
            //console.log("using old doc");
            resolve(lastData._id)
            return;
              //return data_id false for newDoc
          }
        })
      })
    })
  }
  function appendData(lastData_id, data){
    return new Promise(function(resolve, reject){
      //console.log(lastData_id + " is the new id");
      getDocument("data", lastData_id).then(function(dataDocument){
        //console.log("performing updates on " + JSON.stringify(dataDocument));
        updateDocumentField("data", lastData_id, "count", "increment", null);
        updateDocumentField("data", lastData_id, "lastTimestamp", "set", data.timestamp);
        updateDocumentField("data", lastData_id, "data", "push", data);
  
        updateDocumentField("dataSets", dataDocument.dataSet, "lastTimestamp", "set", data.timestamp);
        updateDocumentField("dataSets", dataDocument.dataSet, "totalSamples", "increment", null);
        resolve(dataDocument.dataSet);
      });
    })
  }
  function objectid(hexstring){
    //console.log("converting " + hexstring);
    return OBJECTID.createFromHexString(hexstring);
  }
  module.exports = {
    getData:getData,
    updateDataTag:updateDataTag,
    updateDocumentField:updateDocumentField,
    uploadEquipmentDocument:uploadEquipmentDocument,
    pushDocument:pushDocument,
    postDataSetDocument:postDataSetDocument,
    postDataDocument:postDataDocument,
    GetLastDataDocument:GetLastDataDocument,
    appendData:appendData,
    getDocuments:getDocuments,
    getDocumentsArray:getDocumentsArray,
    isObject:isObject,
    programArduino: programArduino
}
