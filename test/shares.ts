import {initializePMCContract} from "./helpers/common";
import {encodePK, GenerateOperator} from "./helpers/operators";
import {expect} from "chai";

describe("Shares", function () {
    let practicalMegaCluster: any;
    let ssvNetwork: any;
    let ssvToken: any;
    let entities: any;

    beforeEach(async function () {
        const data = await initializePMCContract();
        practicalMegaCluster = data.pmc;
        ssvNetwork = data.ssv.ssvNetwork;
        ssvToken = data.ssv.ssvToken;
        entities = data.entities;
    });

    it("share value (under C0)", async function () {
        const addresses = (await ethers.getSigners()).slice(0,6);
        for (let i = 0; i < 4; i++) {
            const {pk} = GenerateOperator();
            const encodedPK = "0x"+encodePK(pk)

            const tx = await practicalMegaCluster.connect(addresses[i]).registerOperator(encodedPK,0);
            await tx.wait();
        }

        var shareValue = await practicalMegaCluster.getShareValue();
        expect(shareValue).to.equal(271828);
    });

    it("share value (at C0)", async function () {
        const addresses = (await ethers.getSigners()).slice(0,6);
        for (let i = 0; i < 4; i++) {
            var {pk} = GenerateOperator();
            var encodedPK = "0x"+encodePK(pk);
            const tx1 = await practicalMegaCluster.connect(addresses[i]).registerOperator(encodedPK,0);
            await tx1.wait();

            var {pk} = GenerateOperator();
            var encodedPK = "0x"+encodePK(pk);
            const tx2 = await practicalMegaCluster.connect(addresses[i]).registerOperator(encodedPK,0);
            await tx2.wait();
        }

        expect(await practicalMegaCluster.getCapacity()).to.equal(1000);

        var shareValue = await practicalMegaCluster.getShareValue();
        expect(shareValue).to.equal(100000);
    });

    it("share value (> C0)", async function () {
        const addresses = (await ethers.getSigners()).slice(0,6);
        for (let i = 0; i < 4; i++) {
            var {pk} = GenerateOperator();
            var encodedPK = "0x"+encodePK(pk);
            const tx1 = await practicalMegaCluster.connect(addresses[i]).registerOperator(encodedPK,0);
            await tx1.wait();

            var {pk} = GenerateOperator();
            var encodedPK = "0x"+encodePK(pk);
            const tx2 = await practicalMegaCluster.connect(addresses[i]).registerOperator(encodedPK,0);
            await tx2.wait();

            var {pk} = GenerateOperator();
            var encodedPK = "0x"+encodePK(pk);
            const tx3 = await practicalMegaCluster.connect(addresses[i]).registerOperator(encodedPK,0);
            await tx3.wait();
        }

        expect(await practicalMegaCluster.getCapacity()).to.equal(1500);

        var shareValue = await practicalMegaCluster.getShareValue();
        expect(shareValue).to.equal(100000);
    });
})