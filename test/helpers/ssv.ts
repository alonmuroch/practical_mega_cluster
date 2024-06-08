import hre from 'hardhat';
import { ethers, upgrades } from 'hardhat';
import { Address, keccak256, toBytes } from 'viem';

const nonces = new Map();
let lastValidatorId: number = 0;
let lastOperatorId: number = 0;
let ssvToken: any;

export const CONFIG = {
    initialVersion: 'v1.1.0',
    operatorMaxFeeIncrease: 1000,
    declareOperatorFeePeriod: 3600, // HOUR
    executeOperatorFeePeriod: 86400, // DAY
    minimalOperatorFee: 100000000n,
    minimalBlocksBeforeLiquidation: 100800,
    minimumLiquidationCollateral: 200000000,
    validatorsPerOperatorLimit: 500,
    maximumOperatorFee: BigInt(76528650000000),
};

export const initializeContract = async function () {
    let owners = await hre.viem.getWalletClients();

    lastValidatorId = 1;
    lastOperatorId = 0;

    ssvToken = await hre.viem.deployContract('SSVToken');
    const ssvOperatorsMod = await hre.viem.deployContract('SSVOperators');
    const ssvClustersMod = await hre.viem.deployContract('SSVClusters');
    const ssvDAOMod = await hre.viem.deployContract('SSVDAO');
    const ssvViewsMod = await hre.viem.deployContract('SSVViews');
    // const ssvWhitelistMod = await hre.viem.deployContract('SSVOperatorsWhitelist');

    const ssvNetworkFactory = await ethers.getContractFactory('SSVNetwork');
    const ssvNetworkProxy = await await upgrades.deployProxy(
        ssvNetworkFactory,
        [
            ssvToken.address,
            ssvOperatorsMod.address,
            ssvClustersMod.address,
            ssvDAOMod.address,
            ssvViewsMod.address,
            CONFIG.minimalBlocksBeforeLiquidation,
            CONFIG.minimumLiquidationCollateral,
            CONFIG.validatorsPerOperatorLimit,
            CONFIG.declareOperatorFeePeriod,
            CONFIG.executeOperatorFeePeriod,
            CONFIG.operatorMaxFeeIncrease,
        ],
        {
            kind: 'uups',
            unsafeAllow: ['delegatecall'],
        },
    );
    await ssvNetworkProxy.waitForDeployment();
    const ssvNetworkAddress = await ssvNetworkProxy.getAddress();
    let ssvNetwork = await hre.viem.getContractAt('SSVNetwork', ssvNetworkAddress as Address);

    const ssvNetworkViewsFactory = await ethers.getContractFactory('SSVNetworkViews');
    const ssvNetworkViewsProxy = await await upgrades.deployProxy(ssvNetworkViewsFactory, [ssvNetworkAddress], {
        kind: 'uups',
        unsafeAllow: ['delegatecall'],
    });
    await ssvNetworkViewsProxy.waitForDeployment();
    const ssvNetworkViewsAddress = await ssvNetworkViewsProxy.getAddress();
    const ssvNetworkViews = await hre.viem.getContractAt('SSVNetworkViews', ssvNetworkViewsAddress as Address);

    await ssvNetwork.write.updateMaximumOperatorFee([CONFIG.maximumOperatorFee as bigint]);

    // ssvNetwork.write.updateModule([4, await ssvWhitelistMod.address]);

    for (let i = 1; i < 7; i++) {
        await ssvToken.write.mint([owners[i].account.address, 10000000000000000000n]);
    }

    return {
        ssvContractsOwner: owners[0].account,
        ssvNetwork,
        ssvNetworkViews,
        ssvToken,
    };
};