// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// EntityProxy aims to create an "owner" for registered validators/ operators such that each mega cluster entity could manage their own
contract EntityProxy {
    address mega_cluster;
    address ssv_network;
    address ssv_token;

    modifier onlyMegaCluster() {
        require(mega_cluster == msg.sender, "only mega cluster contract");
        _;
    }

    constructor(address _mega_cluster, address _ssv_network, address _ssv_token){
        mega_cluster = _mega_cluster;
        ssv_network = _ssv_network;
        ssv_token = _ssv_token;
    }

    fallback() external  onlyMegaCluster {
        address target = ssv_network;
        assembly {
            // Load the free memory pointer
            let ptr := mload(0x40)

            // Copy the calldata to memory
            calldatacopy(ptr, 0, calldatasize())

            // Forward the call to the target
            let result := call(gas(), target, callvalue(), ptr, calldatasize(), 0, 0)

            // Check if the call was successful
            switch result
            case 0 { revert(0, 0) }
            default {
            // Retrieve the size of the returned data
                let size := returndatasize()
            // Copy the returned data to memory
                returndatacopy(ptr, 0, size)
            // Return the data to the caller
                return(ptr, size)
            }
        }
    }

    function approveForSSV(uint256 amount) public onlyMegaCluster returns (bool) {
        // approve for ssv contract
        if (!IERC20(ssv_token).approve(ssv_network, amount)) {
        revert("failed to approve SSV amount");
        }
        return true;
    }

    function transferSSV(address to, uint256 amount) public onlyMegaCluster returns (bool) {
        // approve for ssv contract
        if (!IERC20(ssv_token).transfer(to, amount)) {
            revert("failed to approve SSV amount");
        }
        return true;
    }
    }
