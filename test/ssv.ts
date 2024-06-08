import hre from 'hardhat';
import {expect} from "chai";
import {initializeContract} from "./helpers/ssv";

describe("SSV", function () {
    let ssvNetwork: any;
    let ssvViews: any;
    let ssvToken: any;

    beforeEach(async function () {
        const metadata = await initializeContract();
        ssvNetwork = metadata.ssvNetwork;
        ssvViews = metadata.ssvNetworkViews;
        ssvToken = metadata.ssvToken;
    });

    describe("Deploy", function () {
        it("validate deployment", async function () {
            let owners = await hre.viem.getWalletClients();

            expect(await ssvViews.read.getNetworkValidatorsCount()).to.equal(0);
            expect(await ssvToken.read.balanceOf([owners[0].account.address])).to.equal('1000000000000000000000');
        });
    })
})