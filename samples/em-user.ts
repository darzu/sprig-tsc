import { EM } from "./em.js";

console.log("irrelvant line");

EM.registerSystem((foo) => console.log(foo), "bar");

if (true) console.log("irrelvant line 2");

/*
comment
*/
EM.registerSystem((foo) => console.log(foo), "bar2");

for (let i = 0; i < 3; i++) {
  console.log("irrelvant line 3s");
}

// comment again
// comment again and again
EM.registerSystem((foo) => console.log(foo), "bar3");

irrelvantFn();

function irrelvantFn() {
  // comment
  console.log("irrelvant fn");
}
