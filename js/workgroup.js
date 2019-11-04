module.exports = WorkGroup;

var Worker = Worker || require('./node-worker.js'),
    Operations = require('../dataopt/query.js');

function WorkGroup(option) {
    "use strict;"
    var that = this,
        numWorker = 4,
        state = "ready", // ["ready", "processing", "completed", "error"]
        data = option.data,
        taskID = 0,
        replied = 0,
        success = 0,
        fail = 0,
        failedWorkerIDs = [],
        tasks = [],   //queue for tasks
        workers = [], //all workers in the group
        workerData = [],
        results = [],
        cache = {},
        cacheKeys = [],
        cacheFlag = false,
        oncomplete = function(){},
        onerror = function(){};

    if(typeof(option) === "number") numWorker = option;
    else configure(option);

    function configure(option) {

    }

    function init() {
        for(var i = 0; i < numWorker; i++){
            var worker = new Worker('./worker.js');
            worker.onmessage = function(env) {
                // console.log("recieve", i, new Date().getTime());
                results[env.workerID] = env.data;
                replied += 1;
                success += 1;
                if(replied == numWorker) commit();
            };

            worker.onerror = function(env){
                replied += 1;
                fail += 1;
                if(replied == numWorker) commit();
            };
            workers.push(worker);
        }
        return that;
    }

    function addTask(opt) {
        tasks.push(opt);
        if(tasks.length === 1 && (state === "ready" || state === "completed")){
            state = "processing";
            execute();
        }
        return that;
    }

    function divideData() {
        var workload = Math.floor(data.length/numWorker),
            remain = data.length - workload * numWorker;

        //each worker get equal workload
        for(var i = 0; i < numWorker; i++){
            workerData[i] = data.splice(0, workload);
            // workerData[i] = data.slice(i*workload, (i+1)*workload);
        }
        //if reamin > 0, each worker get one piece of the remaining data
        for(var i = 0; i < remain; i++){
            workerData[i].push(data[i]);
        }

        return state;
    }

    function execute() {
        var cmd = tasks[0];
        replied = success = fail = 0;
        failedWorkerIDs = [];
        divideData();

        workers.forEach(function(worker, workerID){
            // console.log("send", workerID, new Date().getTime());
            if(typeof cmd.command === 'string'){
                worker.postMessage({
                    id: workerID,
                    command: cmd.command,
                    arg: cmd.arg,
                    data: workerData[workerID]
                });
            } else if (typeof cmd.command === 'function'){
                worker.postMessage({
                    id: workerID,
                    command: "udf",
                    fns: command.toString(),
                    data: workerData[workerID]
                });
            }
        });

        return state;
    }

    function commit() {

        if(fail > 0){
            state = "error";
            onerror(that);
        } else {
            var result = [];
            //merge results from all workers
            result.concat.apply(result, results);
            // results.forEach(function(res){
            //     if(res.length > 0) result = result.concat(res);
            // });

            results = [];
            data = result;
            tasks.shift();
            if(tasks.length === 0) {
                state = "completed";
                oncomplete(data);
            } else {
                execute();
            }
        }

        return that;
    }

    Object.keys(Operations).forEach(function(opt) {
        that[opt] = function(a) {
            return addTask({command: opt, arg: a});
        };
    });

    this.data = function(input) {
        data = input;
        return that;
    }

    this.try = function() {

    }

    this.save = function(tag, data) {

    }

    this.cache = function(name) {
        cacheKeys.push(name);

        var cd = {},
            ck = cacheKeys.shift();

        cd[ck] = result;
        cache.push(cd[ck]);
    }

    this.then = function(succeed, fail) {
        oncomplete = succeed;
        onerror = fail;
        return that;
    }

    // TODO: See if need to support sync calls
    // this.result = function() {
    //     if(state == "processing") setTimeout(that.result, 100);
    //     else return data;
    // }

    this.killall = function() {
        // URL.revokeObjectURL( blobURL );
        workers.forEach(function(worker){
            worker.terminate();
        });
    };

    init();

    return state;
}
