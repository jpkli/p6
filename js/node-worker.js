module.exports = Worker;

var fork = require('child_process').fork;

function Worker(url) {
	var that = this;
	this.worker  = fork(url);
	this.worker.on('message', function (msg) {
		if(typeof that.onmessage === 'function')
			that.onmessage(msg);
	});
	this.worker.on('error', function (err) {
		if(typeof that.onerror === 'function')
			that.onerror(err);
	});
}

Worker.prototype.postMessage = function(obj){
	this.worker.send(obj);
};

Worker.prototype.terminate = function(){
	this.worker.kill();
};

Worker.prototype.onmessage = Worker.prototype.onerror = null;
