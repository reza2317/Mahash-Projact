const str = "A".repeat(2500000);
const CHUNK_SIZE = 1000000;
const numChunks = Math.ceil(str.length / CHUNK_SIZE);
console.log(numChunks);
