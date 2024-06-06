import { ethers } from "hardhat";
import {expect} from "chai";

describe("UintArray", function () {
    let deployedContract: any;

    beforeEach(async function () {
        const contract = await ethers.getContractFactory("UintArrayTest");
        deployedContract = await contract.deploy();
        await deployedContract.waitForDeployment();
    });

    describe("Ordering", function () {
        it("Should order", async function () {
            var ret = await deployedContract.sortArray([4,3,1,2]);
            expect(ret).to.deep.equal([4,3,2,1]);
        });

        it("Should order 2", async function () {
            var ret = await deployedContract.sortArray([1,3,6,2]);
            expect(ret).to.deep.equal([6,3,2,1]);
        });
    })

    describe("greedy heaviest capacity", function () {
        it("simple greedy capacity calculation", async function () {
            var ret = await deployedContract.greedyClusterCalculation([4,3,1,2]);
            expect(ret).to.equal(1);
        });

        it("simple greedy capacity calculation 2", async function () {
            var ret = await deployedContract.greedyClusterCalculation([40,3,10,222]);
            expect(ret).to.equal(3);
        });
    })
})