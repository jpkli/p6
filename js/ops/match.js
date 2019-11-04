

export default function (data, spec) {
    var queries = Object.keys(spec),
        resultLength = data[0].length,
        resultIDx = new Array(resultLength).map((v, i) => i);

    queries.forEach(function(query){
        var result = [],
            fieldID = data.keys.indexOf(query);
        for(var i = 0; i < resultLength; i++) {
            var pos = resultIDx[i];

            if(data[fieldID][pos] == spec[query]) result.push(pos);
        }
        resultLength = result.length;
        resultIDx = result;
    })

    for(var i = 0, l=data.length; i < l; i++){
        var newColumn = new data[i].constructor(resultIDx.length);
        for(var j = 0; j < resultLength; j++){
            newColumn[j] = data[i][resultIDx[j]];
        }
        data[i] = newColumn;
    }

    data.rows = resultLength;
    return data;
}
