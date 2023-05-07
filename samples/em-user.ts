import { EM } from "./em.js";

EM.registerSystem((foo) => console.log(foo), "bar");
EM.registerSystem((foo) => console.log(foo), "bar2");
