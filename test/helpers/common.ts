import hre from 'hardhat';
import { ethers, upgrades } from 'hardhat';
import {initializeContract} from "./ssv";

const k = 2;
const c0 = 1000;

export const initializePMCContract = async function () {
    const ssvContractsData = await initializeContract();

    var addresses = (await ethers.getSigners()).slice(0,6);
    const contract = await ethers.getContractFactory("PracticalMegaCluster");
    const practicalMegaCluster = await contract.deploy(ssvContractsData.ssvNetwork.address, addresses, k, c0);
    await practicalMegaCluster.waitForDeployment();

    return {
        ssv: ssvContractsData,
        pmc: practicalMegaCluster,
        entities: addresses,
    }
}