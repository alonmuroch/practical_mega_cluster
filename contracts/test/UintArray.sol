// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/UintArray.sol";

contract UintArrayTest {
    using UintArray for uint[];

    function sortArray(uint[] memory data) public pure returns (uint[] memory) {
        return data.sortDesc();
    }

    function greedyClusterCalculation(uint[] memory data) public pure returns (uint) {
        return data.greedyClusterCalculation();
    }
}