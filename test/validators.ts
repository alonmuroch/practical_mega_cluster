import {initializePMCContract} from "./helpers/common";
import {encodePK, GenerateOperator} from "./helpers/operators";
import {expect} from "chai";
import {bulkRegisterValidatorsData} from "./helpers/ssv";

describe("Validators", function () {
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

    it("Register validators", async function () {
        // register operators
        const addresses = (await ethers.getSigners()).slice(0,6);

        for (let i = 0; i < 4; i++) {
            const {pk} = GenerateOperator();
            const encodedPK = "0x"+encodePK(pk)

            const tx = await practicalMegaCluster.connect(addresses[i]).registerOperator(encodedPK,0);
            await tx.wait();
        }

        expect(await practicalMegaCluster.getCapacity()).to.equal(500);

        // register validators
        const numberOfValidators = 10;
        const data = await bulkRegisterValidatorsData(
            1,
            numberOfValidators,
            [1,2,3,4],
            1000000000000000n
        )

        await practicalMegaCluster.connect(addresses[0]).bulkRegisterValidator(
            data.pks,
            data.operatorIds,
            data.shares,
            data.depositAmount,
            {
                validatorCount: 0,
                networkFeeIndex: 0,
                index: 0,
                balance: 0n,
                active: true,
            }
        );

        // expected capacity
        expect(await practicalMegaCluster.getCapacity()).to.equal(500-numberOfValidators);

        // expected balance
        expect(await ssvToken.read.balanceOf([addresses[0].address])).to.equal("999990000000000000000");

        const events = await ssvNetwork.getEvents["ValidatorAdded"]();
        expect(events.length).to.equal(numberOfValidators);
        expect(events[0].args.publicKey).to.deep.equal('0xa063fa1434f4ae9bb63488cd79e2f76dea59e0e2d6cdec7236c2bb49ffb37da37cb7966be74eca5a171f659fee7bc501');
        expect(events[0].args.operatorIds).to.deep.equal([1,2,3,4])
        expect(events[0].args.owner).to.deep.equal(entities[0][1]) // the proxy contract
        expect(events[1].args.publicKey).to.deep.equal('0x821b022611c3cdea28669683ec80a930533633fe7b3489d70fdacf68044661ee2bca1d17d3d095c05f639ebe3108784c');
        expect(events[1].args.operatorIds).to.deep.equal([1,2,3,4])
        expect(events[2].args.publicKey).to.deep.equal('0x88ab00343b787f87de60d1e8a552a69ab5fb3525128c53d68e78a3fe2e157bcce75e96a87e8968460087927552a3c891');
        expect(events[2].args.operatorIds).to.deep.equal([1,2,3,4])
        expect(events[3].args.publicKey).to.deep.equal('0x9150572051c3496a67207b4caa371dfba34f127318a7aef145ebdba6e0de506c292af31e20831b0c537ab7478508d3e9');
        expect(events[3].args.operatorIds).to.deep.equal([1,2,3,4])
    });

    it("Remove validators", async function () {
        // register operators
        const addresses = (await ethers.getSigners()).slice(0,6);

        for (let i = 0; i < 4; i++) {
            const {pk} = GenerateOperator();
            const encodedPK = "0x"+encodePK(pk)

            const tx = await practicalMegaCluster.connect(addresses[i]).registerOperator(encodedPK,0);
            await tx.wait();
        }

        // register validators
        const numberOfValidators = 10;
        const data = await bulkRegisterValidatorsData(
            1,
            numberOfValidators,
            [1,2,3,4],
            1000000000000000n
        )

        await practicalMegaCluster.connect(addresses[0]).bulkRegisterValidator(
            data.pks,
            data.operatorIds,
            data.shares,
            data.depositAmount,
            {
                validatorCount: 0,
                networkFeeIndex: 0,
                index: 0,
                balance: 0n,
                active: true,
            }
        );

        await practicalMegaCluster.connect(addresses[0]).bulkRemoveValidator(
            ['0xa063fa1434f4ae9bb63488cd79e2f76dea59e0e2d6cdec7236c2bb49ffb37da37cb7966be74eca5a171f659fee7bc501',
                '0x821b022611c3cdea28669683ec80a930533633fe7b3489d70fdacf68044661ee2bca1d17d3d095c05f639ebe3108784c'],
            [1,2,3,4],
            {
                validatorCount: 10,
                networkFeeIndex: 0,
                index: 0,
                balance: 10000000000000000n,
                active: true,
            }
        )


        expect(await practicalMegaCluster.getCapacity()).to.equal(492);

        const events = await ssvNetwork.getEvents["ValidatorRemoved"]();
        expect(events.length).to.equal(2);
        expect(events[0].args.publicKey).to.deep.equal('0xa063fa1434f4ae9bb63488cd79e2f76dea59e0e2d6cdec7236c2bb49ffb37da37cb7966be74eca5a171f659fee7bc501');
        expect(events[0].args.operatorIds).to.deep.equal([1,2,3,4]);
        expect(events[0].args.owner).to.deep.equal(entities[0][1]); // the proxy contract
        expect(events[1].args.publicKey).to.deep.equal('0x821b022611c3cdea28669683ec80a930533633fe7b3489d70fdacf68044661ee2bca1d17d3d095c05f639ebe3108784c');
        expect(events[1].args.operatorIds).to.deep.equal([1,2,3,4])
    });

    it("Try Remove validators (not by owner)", async function () {
        // register operators
        const addresses = (await ethers.getSigners()).slice(0,6);

        for (let i = 0; i < 4; i++) {
            const {pk} = GenerateOperator();
            const encodedPK = "0x"+encodePK(pk)

            const tx = await practicalMegaCluster.connect(addresses[i]).registerOperator(encodedPK,0);
            await tx.wait();
        }

        // register validators
        const numberOfValidators = 10;
        const data = await bulkRegisterValidatorsData(
            1,
            numberOfValidators,
            [1,2,3,4],
            1000000000000000n
        )

        await practicalMegaCluster.connect(addresses[0]).bulkRegisterValidator(
            data.pks,
            data.operatorIds,
            data.shares,
            data.depositAmount,
            {
                validatorCount: 0,
                networkFeeIndex: 0,
                index: 0,
                balance: 0n,
                active: true,
            }
        );

        try {
            await practicalMegaCluster.connect(addresses[1]).bulkRemoveValidator(
                ['0xa063fa1434f4ae9bb63488cd79e2f76dea59e0e2d6cdec7236c2bb49ffb37da37cb7966be74eca5a171f659fee7bc501',
                    '0x821b022611c3cdea28669683ec80a930533633fe7b3489d70fdacf68044661ee2bca1d17d3d095c05f639ebe3108784c'],
                [1,2,3,4],
                {
                    validatorCount: 10,
                    networkFeeIndex: 0,
                    index: 0,
                    balance: 10000000000000000n,
                    active: true,
                }
            )
        } catch (error) {
            expect(error.message).to.include("Transaction reverted without a reason");
            // TODO - more specific error?
        }


        expect(await practicalMegaCluster.getCapacity()).to.equal(490);

        const events = await ssvNetwork.getEvents["ValidatorRemoved"]();
        expect(events.length).to.equal(0);
    });

    it("Liquidate cluster", async function () {
        // register operators
        const addresses = (await ethers.getSigners()).slice(0,6);

        for (let i = 0; i < 4; i++) {
            const {pk} = GenerateOperator();
            const encodedPK = "0x"+encodePK(pk)

            const tx = await practicalMegaCluster.connect(addresses[i]).registerOperator(encodedPK,0);
            await tx.wait();
        }

        // register validators
        const numberOfValidators = 10;
        const data = await bulkRegisterValidatorsData(
            1,
            numberOfValidators,
            [1,2,3,4],
            1000000000000000n
        )

        await practicalMegaCluster.connect(addresses[0]).bulkRegisterValidator(
            data.pks,
            data.operatorIds,
            data.shares,
            data.depositAmount,
            {
                validatorCount: 0,
                networkFeeIndex: 0,
                index: 0,
                balance: 0n,
                active: true,
            }
        );

        await practicalMegaCluster.connect(addresses[0]).liquidate(
            addresses[0].address,
            [1,2,3,4],
            {
                validatorCount: 10,
                networkFeeIndex: 0,
                index: 0,
                balance: 10000000000000000n,
                active: true,
            }
        )


        // expected capacity
        expect(await practicalMegaCluster.getCapacity()).to.equal(500);

        // expected event
        const events = await ssvNetwork.getEvents["ClusterLiquidated"]();
        expect(events.length).to.equal(1);

        // expected balance
        expect(await ssvToken.read.balanceOf([addresses[0].address])).to.equal("1000000000000000000000");
    });
})