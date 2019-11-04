define(function() {
    var isBrowser;
    return function() {
        if (typeof module !== 'undefined' && module.exports) {
            isBrowser = false;
            var p4 = require('../../index.js');
        } else {
            isBrowser = true;
        }

        var workerID,
            dataopt,
            data;

        function exec(arg) {
            var jobs = arg.jobs;
            jobs.forEach(function(job){
                var opt = Object.keys(job)[0];
                var spec = job[opt];
                console.log(opt, spec);
                if(dataopt.hasOwnProperty(opt)) {
                    data = dataopt[opt](data, spec);
                }
            });
            self.postMessage({msg: 'result', workerID: workerID, result: data});
        }

        self.addEventListener('message', function(e){
            var arg = e.data,
                cmd = arg.cmd || arg.msg || arg.command;

            switch(cmd) {
                case 'init':
                    workerID = arg.workerID;
                    data = arg.data;
                    if(isBrowser) {
                        self.importScripts( arg.url + '/p4.js');
                        dataopt = p4.dataopt;
                    }
                    break;
                case 'exec':
                    exec(arg);
                    break;
                default:
                    console.log('nothing to do.');
                    break;
            };
        }, false);
    }
})
