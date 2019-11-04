export default function () {
  function asciiDecode(buf) {
      return String.fromCharCode.apply(null, new Uint8Array(buf));
  }

  function readUint16LE(buffer) {
      let view = new DataView(buffer);
      let val = view.getUint8(0);
      val |= view.getUint8(1) << 8;
      return val;
  }

  function fromArrayBuffer(buf) {
    // Check the magic number
    let magic = asciiDecode(buf.slice(0,6));
    if (magic.slice(1,6) != 'NUMPY') {
        throw new Error('unknown file type');
    }

    let headerLength = readUint16LE(buf.slice(8,10));
    let headerStr = asciiDecode(buf.slice(10, 10+headerLength));
    let offsetBytes = 10 + headerLength;

    let jsonHeader = headerStr
        .toLowerCase()
        .replace('(','[').replace('),',']') 
        .replace('[,','[1,]').replace(',]',',1]') 
        .replace(/'/g, '"'); 
    let info = JSON.parse(jsonHeader);

    // Intepret the bytes according to the specified dtype
    let data;
    if (info.descr === "|u1") {
        data = new Uint8Array(buf, offsetBytes);
    } else if (info.descr === "|i1") {
        data = new Int8Array(buf, offsetBytes);
    } else if (info.descr === "<u2") {
        data = new Uint16Array(buf, offsetBytes);
    } else if (info.descr === "<i2") {
        data = new Int16Array(buf, offsetBytes);
    } else if (info.descr === "<u4") {
        data = new Uint32Array(buf, offsetBytes);
    } else if (info.descr === "<i4") {
        data = new Int32Array(buf, offsetBytes);
    } else if (info.descr === "<i8") {
        data = new Int32Array(buf, offsetBytes);
    } else if (info.descr === "<f4") {
        data = new Float32Array(buf, offsetBytes);
    } else if (info.descr === "<f8") {
        data = new Float64Array(buf, offsetBytes);
    } else {
        throw new Error('unknown numeric dtype', info.descr)
    }

    return {
        shape: info.shape,
        fortran_order: info.fortran_order,
        data: data
    };
  }

  function open(file, callback) {
      let reader = new FileReader();
      reader.onload = function() {
          // the file contents have been read as an array buffer
          let buf = reader.result;
          let ndarray = fromArrayBuffer(buf);
          callback(ndarray);
      };
      reader.readAsArrayBuffer(file);
  }

  function ajax(url, callback) {
      let xhr = new XMLHttpRequest();
      xhr.onload = function() {
          let buf = xhr.response; // not responseText
          let ndarray = fromArrayBuffer(buf);
          callback(ndarray);
      };
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.send(null);
  }

  function get(url) {
    return new Promise ((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                let buf = xhr.response;
                let ndarray = fromArrayBuffer(buf);
                resolve(ndarray);
            } else {
                reject(xhr.statusText);
            }
        };
        xhr.onerror = () => reject(xhr.statusText);
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.send(null);
    })

}

  return {open, ajax, get};
}