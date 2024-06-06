import { ethers } from "hardhat";
import {expect} from "chai";
import {PracticalMegaCluster} from "../typechain";

describe("Practical Mega Cluster", function () {
    let practicalMegaCluster: PracticalMegaCluster;

    beforeEach(async function () {
        var addresses = (await ethers.getSigners()).slice(0,6);
        const contract = await ethers.getContractFactory("PracticalMegaCluster");
        practicalMegaCluster = await contract.deploy(addresses);
        await practicalMegaCluster.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right unlockTime", async function () {
            var entities = await practicalMegaCluster.getEntities();
            console.log(entities)
            expect(entities.length).to.equal(6);
        });
    })
})