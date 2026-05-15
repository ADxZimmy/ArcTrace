import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("TraceRegistry", function () {
  it("commits a trace and reads it by hash", async function () {
    const Registry = await ethers.getContractFactory("TraceRegistry");
    const registry = await Registry.deploy();
    const questionHash = ethers.keccak256(ethers.toUtf8Bytes("question"));
    const traceHash = ethers.keccak256(ethers.toUtf8Bytes("trace"));
    const expiry = Math.floor(Date.now() / 1000) + 86400;
    await expect(registry.createTrace(1, questionHash, traceHash, "ipfs://trace", "neutral", 50, 20, "crypto", expiry)).to.emit(registry, "TraceCommitted");
    const trace = await registry.getTraceByHash(traceHash);
    expect(trace.traceHash).to.equal(traceHash);
  });
});
