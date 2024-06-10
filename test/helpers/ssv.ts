import hre from 'hardhat';
import { ethers, upgrades } from 'hardhat';
import { Address, keccak256, toBytes } from 'viem';
import { SSVKeys, KeyShares, EncryptShare } from 'ssv-keys';

import validatorKeys from './json/validatorKeys.json';
import operatorKeys from './json/operatorKeys.json';
var mockedValidators = validatorKeys as Validator[];
var mockedOperators = operatorKeys as Operator[];

const nonces = new Map();
export let owners: any[];
let lastValidatorId: number = 0;
let lastOperatorId: number = 0;
let ssvToken: any;

export type Validator = {
    id: number;
    privateKey: string;
    publicKey: string;
};

export type Operator = {
    id: number;
    operatorKey: string;
    publicKey: string;
};

export type Cluster = {
    validatorCount: number,
    networkFeeIndex: number,
    index: number,
    active: bool,
    balance: BigInt
}

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
    owners = await hre.viem.getWalletClients();

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

export const DataGenerator = {
    publicKey: (id: number) => {
        const validators = mockedValidators.filter((item: Validator) => item.id === id);
        if (validators.length > 0) {
            return validators[0].publicKey;
        }
        return `0x${id.toString(16).padStart(48, '0')}`;
    },
    shares: async (ownerId: number, validatorId: number, operatorIds: number[]) => {
        let shared: any;
        const validators = mockedValidators.filter((item: Validator) => item.id === validatorId);
        if (validators.length > 0) {
            const validator = validators[0];
            const payload = await getSecretSharedPayload(validator, operatorIds, ownerId);
            shared = payload.sharesData;
        } else {
            shared = `0x${validatorId.toString(16).padStart(48, '0')}`;
        }
        return shared;
    },
};

const getSecretSharedPayload = async function (validator: Validator, operatorIds: number[], ownerId: number) {
    const numberIds = operatorIds.map(id => Number(id));


    const selOperators = mockedOperators.filter((item: Operator) => item.id !== undefined && numberIds.includes(item.id));
    const operators = selOperators.map((item: Operator) => ({ id: item.id, operatorKey: item.operatorKey }));

    const ssvKeys = new SSVKeys();
    const keyShares = new KeyShares();

    const publicKey = validator.publicKey;
    const privateKey = validator.privateKey;

    const threshold = await ssvKeys.createThreshold(privateKey, operators);
    const encryptedShares: EncryptShare[] = await ssvKeys.encryptShares(operators, threshold.shares);

    let ownerNonce = 0;

    if (nonces.has(owners[ownerId].address)) {
        ownerNonce = nonces.get(owners[ownerId].address);
    }
    nonces.set(owners[ownerId].address, ownerNonce + 1);

    const payload = await keyShares.buildPayload(
        {
            publicKey,
            operators,
            encryptedShares,
        },
        {
            ownerAddress: owners[ownerId].address,
            ownerNonce,
            privateKey,
        },
    );
    return payload;
};

export const registerOperators = async function (ssvContract, numOperators: number) {
    let owners = await hre.viem.getWalletClients();

    for (let i = 0; i < numOperators; i++) {
        const publicKey = DataGenerator.publicKey(i);
        const hash = await ssvContract.write.registerOperator([publicKey, CONFIG.minimalOperatorFee], {
            account: owners[1].account,
        })
        await (await hre.viem.getPublicClient()).waitForTransactionReceipt({ hash })

        const events = await ssvContract.getEvents["OperatorAdded"]();

        if (events[0].args["operatorId"] != i+1) {
            throw "operator not registered"
        }
    }
}

export const bulkRegisterValidatorsData = async function (
    ownerId: number,
    numberOfValidators: number,
    operatorIds: number[],
    minDepositAmount: BigInt,
) {
    const validatorIndex = lastValidatorId;
    const pks = Array.from({ length: numberOfValidators }, (_, index) => DataGenerator.publicKey(index + validatorIndex));
    const shares = await Promise.all(
        Array.from({ length: numberOfValidators }, (_, index) =>
            DataGenerator.shares(ownerId, index + validatorIndex, operatorIds),
        ),
    );
    const depositAmount = minDepositAmount * BigInt(numberOfValidators);

   return {
       pks,
       operatorIds,
       shares,
       depositAmount
   }
}

export const bulkRegisterValidators = async function (
    ssvNetwork,
    ownerId: number,
    numberOfValidators: number,
    operatorIds: number[],
    minDepositAmount: BigInt,
    cluster: Cluster,
) {
    const data = await bulkRegisterValidatorsData(
        ownerId,
        numberOfValidators,
        operatorIds,
        minDepositAmount
    )

    await ssvToken.write.approve([ssvNetwork.address, data.depositAmount], {
        account: owners[ownerId].account,
    });

    const result = await ssvNetwork.write.bulkRegisterValidator([data.pks, operatorIds, data.shares, data.depositAmount, cluster], {
        account: owners[ownerId].account,
    });
    lastValidatorId += numberOfValidators;

    const events = await ssvNetwork.getEvents["ValidatorAdded"]();

    return {
        args: events[0].args,
        pks: data.pks
    };
};