// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library Shares {
    uint256 public constant BASE = 100000;
    uint256 public constant EPSILON = 271828; // 100,000 base

    // shareValue returns share value (BASE digital precision)
    function shareValue(uint capacity, uint c0, uint k) internal pure returns (uint) {
        if (capacity >= c0) {
            return 1;
        }



        return 1;
    }
}
