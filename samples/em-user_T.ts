import { EM } from "./em.js";

console.log("irrelvant line");

EM.registerSystem2("bar", (foo) => console.log(foo));

if (true) console.log("irrelvant line 2");

/*
comment
*/
EM.registerSystem2("bar2", (foo) => console.log(foo));

for (let i = 0; i < 3; i++) {
  console.log("irrelvant line 3s");
}

// comment again
// comment again and again
EM.registerSystem2("bar3", (foo) => console.log(foo));

irrelvantFn();

function irrelvantFn() {
  // comment
  console.log("irrelvant fn");
}