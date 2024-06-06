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
        it("Get entities", async function () {
            var entities = await practicalMegaCluster.getEntities();
            expect(entities.length).to.equal(6);
        });

        it("Register operator", async function () {
            const {pk} = GenerateOperator();
            const encodedPK = "0x"+encodePK(pk)

            const addresses = (await ethers.getSigners()).slice(0,6);
            const tx = await practicalMegaCluster.connect(addresses[0]).registerOperator(encodedPK,0);

            const reciept = await tx.wait();
            expect(reciept.logs[0].args[0]).to.be.equal(encodedPK);
            expect(reciept.logs[0].args[1]).to.be.equal(reciept.logs[0].args[1]);

            var capacity = await practicalMegaCluster.capacity();
            expect(capacity).to.equal(0);
        });

        it("Register operator and increase capacity", async function () {
            const addresses = (await ethers.getSigners()).slice(0,6);
            for (let i = 0; i < 4; i++) {
                const {pk} = GenerateOperator();
                const encodedPK = "0x"+encodePK(pk)

                const tx = await practicalMegaCluster.connect(addresses[i]).registerOperator(encodedPK,0);
                const reciept = await tx.wait();
                expect(reciept.logs[0].args[0]).to.be.equal(encodedPK);
                expect(reciept.logs[0].args[1]).to.be.equal(reciept.logs[0].args[1]);
            }

            var capacity = await practicalMegaCluster.capacity();
            expect(capacity).to.equal(500);
        });

        it("Register validators", async function () {
            // register operators
            const addresses = (await ethers.getSigners()).slice(0,6);

            var operators = [];

            for (let i = 0; i < 4; i++) {
                const {pk} = GenerateOperator();
                const encodedPK = "0x"+encodePK(pk)

                const tx = await practicalMegaCluster.connect(addresses[i]).registerOperator(encodedPK,0);
                const reciept = await tx.wait();

                const eventPK = reciept.logs[0].args[0];
                const eventOperatorID = reciept.logs[0].args[1];
                expect(eventPK).to.be.equal(encodedPK);
                expect(eventOperatorID).to.be.equal(reciept.logs[0].args[1]);

                operators.push(eventOperatorID);
            }

            var capacity = await practicalMegaCluster.capacity();
            expect(capacity).to.equal(500);

            // register validators
            const tx = practicalMegaCluster.connect(addresses[0]).registerValidator(
                [0,1,2,3],
                operators,
                [
                    "0x1ea356627ccfe8ad5f5f5d0852e2f746daf397bb8651eb3f660ed5b7bf63ef18",
                    "0x1ea356627ccfe8ad5f5f5d0852e2f746daf397bb8651eb3f660ed5b7bf63ef18",
                    "0x1ea356627ccfe8ad5f5f5d0852e2f746daf397bb8651eb3f660ed5b7bf63ef18",
                    "0x1ea356627ccfe8ad5f5f5d0852e2f746daf397bb8651eb3f660ed5b7bf63ef18"
                ]
            );
            await expect(tx)
                .to.emit(practicalMegaCluster, "RegisteredValidator")
                .withArgs([0,1,2,3],4, 496);
        });
    })
})