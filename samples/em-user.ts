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
// my true comment
if (true) {
  const em = EM;
  // func decl comment
  function regSomeStuff() {
    em.registerSystem((foo) => console.log(foo), "bar2b");
  }
  regSomeStuff();

  // my true2 comment
  if (true) {
    const em = EM;
    // func decl comment 2
    function regSomeStuff2() {
      em.registerSystem((foo) => console.log(foo), "bar2b2");
    }
    regSomeStuff2();
  }
}

// comment again

// comment again and again
EM.registerSystem((foo) => console.log(foo), "bar3");

// outer block comment
{
  // inner block comment
  EM.registerSystem((foo) => console.log(foo), "bar4");
}

irrelvantFn();

function irrelvantFn() {
  // comment
  console.log("irrelvant fn");
}
