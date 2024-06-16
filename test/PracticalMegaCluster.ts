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

    describe("Deployment", function () {
        it("Sanity", async function () {
            var entities = await practicalMegaCluster.getEntities();
            const addresses = (await ethers.getSigners()).slice(0,6);
            expect(entities.length).to.equal(6);
            expect(await ssvToken.read.allowance([addresses[0].address,await practicalMegaCluster.getAddress()])).to.equal(10000000000000000000n);
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
            expect(await practicalMegaCluster.getCapacity()).to.equal(500-numberOfValidators);

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


            expect(await practicalMegaCluster.getCapacity()).to.equal(500);

            const events = await ssvNetwork.getEvents["ClusterLiquidated"]();
            expect(events.length).to.equal(1);
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
})