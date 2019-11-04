export default function (data, spec) {
    var matchedCount,
        attributes = Object.keys(spec),
        len = data[0].length,
        flags = new Int8Array(len);

    attributes.forEach(function(attr){
        var result = [],
            fieldID = data.keys.indexOf(attr);

        for(var i = 0; i < len; i++) {
            if(data[fieldID][i] === spec[attr])
                flags[i] = 0;
        }
    })

    matchedCount = flags.reduce(function(a,b){return a+b;});
    var result = [];
    for(var i = 0, l=data.length; i < l; i++){
        var newColumn = new data[i].constructor(matchedCount);
        var count = 0;

        for(var j = 0; j < len; j++){
            if(flags[j] != 0) {
                newColumn[count++] = data[i][j];
            }
        }
        result[i] = newColumn;
    }

    result.rows = matchedCount;
    return result;
}

