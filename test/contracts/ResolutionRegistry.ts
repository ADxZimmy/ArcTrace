import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("ResolutionRegistry", function () {
  it("resolves a trace outcome", async function () {
    const Registry = await ethers.getContractFactory("ResolutionRegistry");
    const registry = await Registry.deploy();
    const notesHash = ethers.keccak256(ethers.toUtf8Bytes("evidence notes"));
    await expect(registry.resolveTrace(1, 1, "https://example.com/evidence", notesHash)).to.emit(registry, "TraceResolved");
    const resolution = await registry.getResolution(1);
    expect(resolution.traceId).to.equal(1);
  });
});
