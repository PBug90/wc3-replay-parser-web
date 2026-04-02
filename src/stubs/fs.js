// Browser stub for Node's 'fs' module.
// w3gjs only uses fs.readFile when parse() receives a file-path string.
// In the browser we always pass a Buffer, so this path is never hit.
export function readFile(_path, cb) {
  cb(new Error('fs.readFile is not available in the browser'))
}

export const promises = {
  readFile: () => Promise.reject(new Error('fs.promises.readFile is not available in the browser')),
}
