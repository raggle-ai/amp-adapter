const test = require("node:test");
const assert = require("node:assert");
const { remoteToHttpsClone } = require("@raggle-ai/local");

test("remoteToHttpsClone normalizes git remotes", () => {
  assert.equal(remoteToHttpsClone("git@github.com:raggle-ai/scout.git"), "https://github.com/raggle-ai/scout");
  assert.equal(remoteToHttpsClone("ssh://git@gitlab.com/reandrew/main.git"), "https://gitlab.com/reandrew/main");
  assert.equal(remoteToHttpsClone("https://GitHub.com/raggle-ai/scout/"), "https://github.com/raggle-ai/scout");
  assert.equal(remoteToHttpsClone("/some/local/path"), undefined);
  assert.equal(remoteToHttpsClone("https://github.com/single"), undefined);
});
