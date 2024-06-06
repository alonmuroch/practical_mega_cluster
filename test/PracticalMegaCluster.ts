import { ethers } from "hardhat";
import {expect} from "chai";
import {GenerateOperator, encodePK} from "./helpers/operators";
import {anyValue} from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("Practical Mega Cluster", function () {
    let practicalMegaCluster: any;

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

        it("Register operator", async function () {
            const {pk} = GenerateOperator();
            const encodedPK = "0x"+encodePK(pk)

            const addresses = (await ethers.getSigners()).slice(0,6);
            const tx = practicalMegaCluster.connect(addresses[0]).registerOperator(encodedPK,0);
            await expect(tx)
                .to.emit(practicalMegaCluster, "RegisteredOperator")
                .withArgs(encodedPK);
        });
    })
})