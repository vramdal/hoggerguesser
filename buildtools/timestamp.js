const fs = require('fs');
const tstamp = new Date().toISOString()
    .replace(/\.[\w\W]+?$/, '') // Delete from dot to end.
    .replace(/:|\s|T/g, '-');  // Replace colons, spaces, and T with hyphen.

fs.writeFileSync("public/timestamp.json", `{"timestamp": "${tstamp}"}`);
fs.writeFileSync("src/timestamp.ts", `export const buildTimestamp = '${tstamp}';`)
