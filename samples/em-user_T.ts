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
// my true comment
if (true) {
  const em = EM;
  // func decl comment
  function regSomeStuff() {
    em.registerSystem2("bar2b", (foo) => console.log(foo));
  }
  regSomeStuff();

  // my true2 comment
  if (true) {
    const em = EM;
    // func decl comment 2
    function regSomeStuff2() {
      em.registerSystem2("bar2b2", (foo) => console.log(foo));
    }
    regSomeStuff2();
  }
}

// comment again

// comment again and again
EM.registerSystem2("bar3", (foo) => console.log(foo));

// outer block comment
{
  // inner block comment
  EM.registerSystem2("bar4", (foo) => console.log(foo));
}

irrelvantFn();

function irrelvantFn() {
  // comment
  console.log("irrelvant fn");
}
