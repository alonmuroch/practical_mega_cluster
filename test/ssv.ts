import hre from 'hardhat';
import {expect} from "chai";
import {initializeContract, registerOperators, bulkRegisterValidators, DataGenerator, CONFIG} from "./helpers/ssv";

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

        it("register operator", async function () {
            let owners = await hre.viem.getWalletClients();

            const publicKey = DataGenerator.publicKey(0);
            const hash = await ssvNetwork.write.registerOperator([publicKey, CONFIG.minimalOperatorFee], {
                account: owners[1].account,
            })
            const reciept = await (await hre.viem.getPublicClient()).waitForTransactionReceipt({ hash })
            const events = await ssvNetwork.getEvents["OperatorAdded"]();

            expect(events.length).to.equal(1);
            expect(events[0].args["operatorId"]).to.equal(1);
            expect(events[0].args["owner"]).to.deep.equal(owners[1].account.address);
            expect(events[0].args["publicKey"]).to.equal(publicKey);
            expect(events[0].args["fee"]).to.equal(CONFIG.minimalOperatorFee);
        });

        it("register operators bulk", async function () {
            await registerOperators(ssvNetwork,4);
            let owners = await hre.viem.getWalletClients();
            expect(await ssvViews.read.getOperatorById([1])).to.deep.equal([
                owners[1].account.address, // owner
                CONFIG.minimalOperatorFee, // fee
                0, // validatorCount
                '0x0000000000000000000000000000000000000000', // whitelisting contract address
                false, // isPrivate
                true,  // active
            ])
        });

        it("register validator", async function () {
            let owners = await hre.viem.getWalletClients();
            await registerOperators(ssvNetwork,4);

            const result = await bulkRegisterValidators(
                ssvNetwork,
                1,
                4,
                [1,2,3,4],
                1000000000000000n,
                {
                    validatorCount: 0,
                    networkFeeIndex: 0,
                    index: 0,
                    balance: 0n,
                    active: true,
                });
            expect(result.args.owner).to.deep.equal(owners[1].account.address);
            expect(result.args.cluster).to.deep.equal({
                validatorCount: 4,
                networkFeeIndex: 0n,
                index: 140n,
                active: true,
                balance: 4000000000000000n
            });
            expect(result.pks).to.deep.equal([
                '0xa063fa1434f4ae9bb63488cd79e2f76dea59e0e2d6cdec7236c2bb49ffb37da37cb7966be74eca5a171f659fee7bc501',
                '0x821b022611c3cdea28669683ec80a930533633fe7b3489d70fdacf68044661ee2bca1d17d3d095c05f639ebe3108784c',
                '0x88ab00343b787f87de60d1e8a552a69ab5fb3525128c53d68e78a3fe2e157bcce75e96a87e8968460087927552a3c891',
                '0x9150572051c3496a67207b4caa371dfba34f127318a7aef145ebdba6e0de506c292af31e20831b0c537ab7478508d3e9',
            ]);
        });
    })
})