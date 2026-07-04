import { describe, it, expect } from "vitest";
import { verifyEmptyOutput } from "./emptyOutput";
import { makeRun } from "../trace";

describe("V1 verifyEmptyOutput", () => {
  it("passes when a successful run has real output", () => {
    const run = makeRun({ id: "r1", skill: "morning-digest", output: "Here is your digest." });
    expect(verifyEmptyOutput(run)).toBeNull();
  });

  it("flags a successful run whose output is only whitespace", () => {
    const run = makeRun({ id: "r2", skill: "morning-digest", output: "   \n  " });
    const v = verifyEmptyOutput(run);
    expect(v).not.toBeNull();
    expect(v?.verifier).toBe("V1_empty_output");
    expect(v?.severity).toBe("fail");
  });

  it("flags a successful run with null output", () => {
    const run = makeRun({ id: "r3", skill: "morning-digest", output: null });
    expect(verifyEmptyOutput(run)).not.toBeNull();
  });

  it("flags a successful run with undefined output", () => {
    const run = makeRun({ id: "r4", skill: "morning-digest" });
    expect(verifyEmptyOutput(run)).not.toBeNull();
  });

  it("does not fire on runs that did not succeed (they surface their own error)", () => {
    const run = makeRun({ id: "r5", skill: "morning-digest", status: "error", output: null });
    expect(verifyEmptyOutput(run)).toBeNull();
  });

  it("references message_send events as evidence", () => {
    const run = makeRun({
      id: "r6",
      skill: "morning-digest",
      output: "",
      events: [
        { id: "e1", seq: 0, ts: 0, type: "message_send", payload: {} },
        { id: "e2", seq: 1, ts: 1, type: "log", payload: {} },
      ],
    });
    const v = verifyEmptyOutput(run);
    expect(v?.eventRefs).toEqual(["e1"]);
  });
});
