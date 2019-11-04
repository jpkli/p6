
if (typeof module !== 'undefined' && module.exports) {
     var Worker = require('webworker-threads').Worker;
     var prepareWorker = function(work) {
         return work;
     };
} else {
    var prepareWorker = function(work) {
        var content = work.toString().split('\n');
        content.pop();
        content.shift();

        var blob = new Blob([content.join('\n')], { type: "text/javascript" });
        return window.URL.createObjectURL(blob);
    };
}

define(function(require){
    var Transform = require('../dataopt/transform'),
        Derive = require('../dataopt/derive'),
        Queries = require('../dataopt/query');

    var pWorker = require('./worker'),
        aggregate = require('../dataopt/aggregate'),
        select = require('../dataopt/select');

    return function pipeline (data){
        var queue = [],
            cache = {},
            opt = {},
            workers = [],
            completed = 0,
            result = [],
            callback = function() {};

        if(Array.isArray(data)) {
            result = data;
        }
        opt.transform = Transform;
        opt.derive = Derive;
        opt.select = select;
        opt.aggregate = aggregate;

        Object.keys(Queries).forEach(function(f) {
            opt[f] = Queries[f];
        });

        opt.cache = function(data, tag){
            cache[tag] = pipeline.result();
        };

        opt.map = function(f){
            result = data.map(f);
            return pipeline;
        };

        var merge = {
            aggregate: function (lastJob) {
                var mergeSpec = {};
                for(var key in lastJob.aggregate) {
                    var optSpec = lastJob.aggregate[key];
                    if(typeof optSpec == 'object')
                        mergeSpec[key] = Object.keys(optSpec)[0];
                    else
                        mergeSpec[key] = optSpec;
                }
                return opt.aggregate(finalResult, mergeSpec);
            }
        }

        var finalResult = [];

        function mergeResult(workerResult) {
            var rl = finalResult.length,
                wl = workerResult.length;
            for(var i = 0; i < wl; i++) {
                finalResult[rl+i] = workerResult[i];
            }
            completed += 1;

            if(completed == workers.length) {
                var lastJob = queue[queue.length-1],
                    lastJobOpt = Object.keys(lastJob)[0];
                if( lastJobOpt == 'aggregate') {
                    finalResult = merge.aggregate(lastJob);
                }
                callback(finalResult);
            }
        }

        var pipeline = {};

        pipeline.workers = function(workerCount) {
            var workSize = Math.ceil(result.length / workerCount),
                workShares = new Array(workerCount).fill(workSize);
            workShares[workerCount-1] -= workSize*workerCount - result.length;
            for(var i = 0; i < workerCount; i++) {
                workers[i] = new Worker(prepareWorker(pWorker));
                workers[i].addEventListener('message', function(e) {
                  if(e.data.msg == 'result') {
                      mergeResult(e.data.result);
                  };
                }, false);
                var parts = document.location.href.split('/');
                parts.pop();
                var url = parts.join('/');

                workers[i].postMessage({
                    workerID: i,
                    cmd: 'init',
                    data: result.slice(i*workSize, i*workSize+workShares[i]),
                    url: url
                });
            }
            return pipeline;
        }
        // pipeline.opt = opt;
        Object.keys(opt).forEach(function(o){
            pipeline[o] = function(spec) {
                var task = {};
                task[o] = spec;
                queue.push(task);
                return pipeline;
            };
        })

        pipeline.then = function(_callback) {
            callback = _callback;
            if(workers.length) {
                workers.forEach(function(worker, i){
                    worker.postMessage({cmd: 'exec', jobs: queue});
                })
            } else {
                queue.forEach(function(q){
                    var f = Object.keys(q)[0];
                    result = opt[f](result, q[f]);
                });
            }
            return result;
        }

        pipeline.execute = function(data) {
            if(Array.isArray(data)) result = data;
            queue.forEach(function(q){
                var f = Object.keys(q)[0];
                result = opt[f](result, q[f]);
            });
            return result;
        }

        pipeline.oncomplete = pipeline.then;

        pipeline.result = function() {
            return result;
        };

        pipeline.data = function(data) {
            result = data;
            return pipeline
        }

        pipeline.queue = function() {
            return queue;
        }

        return pipeline;
    }
});
