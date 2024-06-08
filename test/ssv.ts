import { ethers } from "hardhat";
import {expect} from "chai";
import * as fs from "fs";
import * as path from "path";
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
        it("test", async function () {
            expect(await ssvViews.read.getNetworkValidatorsCount()).to.equal(0);
        });
    })
})