import {initializePMCContract} from "./helpers/common";
import {encodePK, GenerateOperator} from "./helpers/operators";
import {expect} from "chai";

describe("Operators", function () {
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

    it("Register operator", async function () {
        const {pk} = GenerateOperator();
        const encodedPK = "0x"+encodePK(pk)

        const addresses = (await ethers.getSigners()).slice(0,6);
        const tx = practicalMegaCluster.connect(addresses[0]).registerOperator(encodedPK,0);

        await expect(tx)
            .to.emit(practicalMegaCluster, 'Transfer')
            .withArgs('0x0000000000000000000000000000000000000000',addresses[0],73890461584 /* e^(2*1000/1000 */);

        const events = await ssvNetwork.getEvents["OperatorAdded"]();
        expect(events.length).to.equal(1);

        expect(await practicalMegaCluster.getCapacity()).to.equal(0);
    });

    it("Register operator and increase capacity", async function () {
        const addresses = (await ethers.getSigners()).slice(0,6);
        for (let i = 0; i < 4; i++) {
            const {pk} = GenerateOperator();
            const encodedPK = "0x"+encodePK(pk)

            let expectedCapacity = 0;
            if (i == 3){
                expectedCapacity = 500;
            }

            const tx = practicalMegaCluster.connect(addresses[i]).registerOperator(encodedPK,0);
            await expect(tx)
                .to.emit(practicalMegaCluster, 'Transfer')
                .withArgs('0x0000000000000000000000000000000000000000',addresses[i],73890461584 /* e^(2*1000/1000 */);
        }

        expect(await practicalMegaCluster.getCapacity()).to.equal(500);
    });
})