
export default function (column, spec){

    var OPT_KEYS = ['$group', '$bins', '$data'];
    var len = column.size,
        attrs = column.keys,
        keys = Object.keys(spec),
        aggrs,
        gkeys,
        gvalues;

    if(keys.indexOf("$group") < 0) return result;
    else gkeys = spec.$group;

    if(!Array.isArray(gkeys)) gkeys = [gkeys];

    gvalues = {};
    aggrs = Object.keys(spec)
        .filter(function(k) {
            return OPT_KEYS.indexOf(k) === -1;
        })

    var gkeyhash = new Array(gkeys.length);
    for (var i = 0; i < len; i++) {

        gkeys.forEach(function(gk, gki){
            var cid = attrs.indexOf(gk);
                gkeyhash[gki] = column[cid][i];
        });

        if(gvalues.hasOwnProperty(gkeyhash))
            gvalues[gkeyhash]++;
        else
            gvalues[gkeyhash] = 1;
    }

    var result = [],
        resultLength = Object.keys(gvalues).map(function(gv){ return gvalues[gv] })
            .reduce(function(a,b) { return a * b});


    var groupedIDs = {};
    Object.keys(gvalues).forEach(function(value) {
        groupedIDs[value] = {
            ptr: 0,
            buf: new Array(gvalues[value])
        };
    })

    for (var i = 0; i < len; i++) {
        gkeys.forEach(function(gk, gki){
            var cid = attrs.indexOf(gk);
                gkeyhash[gki] = column[cid][i];
        });
        groupedIDs[gkeyhash].buf[groupedIDs[gkeyhash].ptr++] = i;
    }

    var resultAttrs = gkeys.concat(aggrs);
    resultAttrs.forEach(function(attr, ai) {
        var cid = attrs.indexOf(attr);
        result[ai] = new column[cid].constructor(resultLength);
    })

    console.log(result);
    var size, buf;
    Object.keys(groupedIDs).forEach(function(hash, hi) {
        if(!Array.isArray(hash)) hash = [hash];
        hash.forEach(function(h,hj){
            result[hj][hi] = h;
        });
        aggrs.forEach(function(attr, ai){
            var cid = attrs.indexOf(attr);
            size = groupedIDs[hash].ptr;
            buf = new column[cid].constructor(size);
            for(var k = 0; k < size; k++) {
                var rid = groupedIDs[hash].buf[k];
                buf[k] = column[cid][rid];
            }
            result[gkeys.length + ai][hi] = buf.reduce(function(a,b){ return a + b;});
        });
    });

    return result;
};
