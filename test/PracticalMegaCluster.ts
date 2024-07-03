import { ethers } from "hardhat";
import {expect} from "chai";
import {GenerateOperator, encodePK} from "./helpers/operators";
import {initializePMCContract} from "./helpers/common";
import {bulkRegisterValidatorsData, owners} from "./helpers/ssv";



describe("Practical Mega Cluster", function () {
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

    it("Sanity", async function () {
        var entities = await practicalMegaCluster.getEntities();
        const addresses = (await ethers.getSigners()).slice(0,6);
        expect(entities.length).to.equal(6);
        expect(await ssvToken.read.allowance([addresses[0].address,await practicalMegaCluster.getAddress()])).to.equal(10000000000000000000n);
    });

    it("Transfer share token", async function () {
        const addresses = (await ethers.getSigners()).slice(0,6);
        const {pk} = GenerateOperator();
        const encodedPK = "0x"+encodePK(pk)

        await practicalMegaCluster.connect(addresses[0]).registerOperator(encodedPK,0);

        try {
            await practicalMegaCluster.connect(addresses[0]).transfer(addresses[1], 10000);
        } catch (error) {
            expect(error.message).to.include("shares are not transferable");
        }
    });

    it("Claim", async function () {
        const addresses = (await ethers.getSigners()).slice(0,6);

        var entities = await practicalMegaCluster.getEntities();

        // transfer to proxy to simulate claim
        await ssvToken.write.transfer([entities[0].proxy, 5000000],{
            account: addresses[1]
        });

        // claim
        await practicalMegaCluster.connect(addresses[0]).claimRewards(5000000);

        const megaClusterAddress = await practicalMegaCluster.getAddress();

        const events = await ssvToken.getEvents["Transfer"]();
        expect(events.length).to.equal(2);

        // from proxy to mega cluster
        expect(events[0].args.from).to.deep.equal(entities[0].proxy);
        expect(events[0].args.to).to.deep.equal(megaClusterAddress);
        expect(events[0].args.value).to.deep.equal(5000000n);

        // from mega cluster to sender
        expect(events[1].args.from).to.deep.equal(megaClusterAddress);
        expect(events[1].args.to).to.deep.equal(addresses[0].address);
        expect(events[1].args.value).to.deep.equal(4500000n);
    });
})