let fs = require("fs");

let connections = fs.readFileSync("vlans.dsv").toString();

let raw = connections.split("\n").map(row => row.split("~"));

let header = raw[0];
let data = raw.slice(1).map(row => {
  let rowObj = {};

  for (let i in header) {
    rowObj[header[i]] = row[i];
  }

  return rowObj;
}).filter(d => d["Booth number"] != "None");

let map = {};

for (let vlan of data) {
  if (!map[vlan["Booth number"]]) {
    map[vlan["Booth number"]] = [];
  }

  map[vlan["Booth number"]].push(vlan["Net-ipv4"]);
}

fs.writeFileSync("vlan_to_boothid.json", JSON.stringify(map));