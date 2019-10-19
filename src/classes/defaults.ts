export const flags = [
  {
    name: "immortal",
    restricted: "immortal",
    code: "i",
    lvl: 10
  },
  {
    name: "wizard",
    restricted: "immortal",
    code: "W",
    lvl: 9
  },
  {
    name: "royalty",
    restricted: "wizard immortal",
    code: "R",
    lvl: 8
  },
  {
    name: "staff",
    restricted: "immortal wizard royalty",
    code: "w",
    lvl: 7
  },
  {
    name: "coder",
    restricted: "immortal wizard",
    code: "@",
    lvl: 0
  },
  {
    name: "connected",
    restricted: "admin",
    code: "C",
    lvl: 0
  },
  {
    name: "registered",
    restricted: "immortal wizard",
    code: "r",
    lvl: 0
  },
  {
    name: "ic",
    restricted: "immortal wizard royalty staff"
  },
  {
    name: "approved",
    restricted: "immortal wizard royalty staff",
    code: "a"
  },
  {
    name: "safe",
    code: "s"
  }
];

export const channels = [
  {
    name: "Public",
    see: "",
    join: "",
    talk: "",
    mod: "immortal|wizard|royalty",
    owner: "",
    header: ""
  },
  {
    name: "Newbie",
    see: "",
    join: "",
    talk: "",
    mod: "immortal|wizard|royalty",
    owner: "",
    header: ""
  },
  {
    name: "Staff",
    see: "immortal|wizard|royalty",
    join: "immortal|wizard|royalty",
    talk: "immortal|wizard|royalty",
    mod: "immortal|wizard",
    owner: "",
    header: ""
  }
];
