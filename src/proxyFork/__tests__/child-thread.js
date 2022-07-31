const { TIMEOUT } = require("dns");
const { exposeMethodsToOtherThread } = require("../../../dist");

exposeMethodsToOtherThread(process, {
  hello(name) {
    return `Hello ${name}.`;
  },
  delay(val, ts) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(val), ts);
    });
  },
  exit(code) {
    process.exit(code);
  }
});

