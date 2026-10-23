import { describe, expect, it } from "vitest";
import { encode, parseClientMessage, parseServerMessage } from "./protocol.js";

describe("parseClientMessage", () => {
  it("accepts a join and trims the name", () => {
    expect(
      parseClientMessage(encode({ type: "join", protocol: 1, name: "  bob " })),
    ).toEqual({
      type: "join",
      protocol: 1,
      name: "bob",
    });
  });

  it("rejects bad names", () => {
    expect(
      parseClientMessage('{"type":"join","protocol":1,"name":"   "}'),
    ).toBeNull();
    expect(
      parseClientMessage(
        `{"type":"join","protocol":1,"name":"${"x".repeat(25)}"}`,
      ),
    ).toBeNull();
    expect(
      parseClientMessage('{"type":"join","protocol":1,"name":5}'),
    ).toBeNull();
  });

  it("accepts an input and clamps it", () => {
    const raw = encode({
      type: "input",
      seq: 3,
      input: { forward: 9, right: -9, yaw: 1 },
    });
    expect(parseClientMessage(raw)).toEqual({
      type: "input",
      seq: 3,
      input: { forward: 1, right: -1, yaw: 1 },
    });
  });

  it.each([
    "not json",
    "null",
    "[]",
    '{"type":"nope"}',
    '{"type":"input","seq":1.5,"input":{"forward":0,"right":0,"yaw":0}}',
    '{"type":"input","seq":1,"input":{"forward":"1","right":0,"yaw":0}}',
    '{"type":"input","seq":1,"input":{"forward":0,"right":0}}',
    '{"type":"input","seq":1}',
  ])("rejects %s", (raw) => {
    expect(parseClientMessage(raw)).toBeNull();
  });
});

describe("parseServerMessage", () => {
  it("accepts known types", () => {
    expect(parseServerMessage('{"type":"rejected","reason":"x"}')).toEqual({
      type: "rejected",
      reason: "x",
    });
  });

  it("rejects unknown types and garbage", () => {
    expect(parseServerMessage('{"type":"nope"}')).toBeNull();
    expect(parseServerMessage("{")).toBeNull();
  });
});
