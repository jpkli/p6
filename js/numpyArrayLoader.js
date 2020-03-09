const toJSArrayType = {
  '|u1': Uint8Array,
  '<u2': Uint16Array,
  '<u4': Uint32Array,
  '<u8': BigUint64Array,
  '|i1': Int8Array,
  '<i2': Int16Array,
  '<i4': Int32Array,
  '<i8': BigInt64Array,
  '<f4': Float32Array,
  '<f8': Float64Array
}

function asciiDecode(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function readUint16LE(buffer) {
  let view = new DataView(buffer);
  let val = view.getUint8(0);
  val |= view.getUint8(1) << 8;
  return val;
}

export default function readFromArrayBuffer(buf) {
  // Check the magic word
  let magicWord = asciiDecode(buf.slice(0, 6));
  if (magicWord.slice(1, 6) != 'NUMPY') {
    throw new Error('unknown file type ', magicWord);
  }

  let headerLength = readUint16LE(buf.slice(8, 10));
  let headerStr = asciiDecode(buf.slice(10, 10 + headerLength));
  let offsetBytes = 10 + headerLength;

  let jsonHeader = headerStr
    .toLowerCase()
    .replace('(', '[').replace('),', ']')
    .replace('[,', '[1,]').replace(',]', ',1]')
    .replace(/'/g, '"');
  let header = JSON.parse(jsonHeader);

  // Intepret the bytes according to the specified dtype
  let data;
  if (typeof toJSArrayType[header.descr] !== 'function') {
    throw new Error('unknown numeric dtype', header.descr);
  }
  // if (header.fortran_order) {
  //   console.log(header.fortran_order)
  //   throw new Error('fortran format is not supported');
  // }
  data = new toJSArrayType[header.descr](buf, offsetBytes);

  return {
    shape: header.shape,
    data: data,
    fortran_order: header.fortran_order
  };
}

export function fetchFromUrl(url) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        let buf = xhr.response;
        let ndarray = readFromArrayBuffer(buf);
        resolve(ndarray);
      } else {
        reject(xhr.statusText);
      }
    };
    xhr.onerror = () => reject(xhr.statusText);
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.send(null);
  });
}
