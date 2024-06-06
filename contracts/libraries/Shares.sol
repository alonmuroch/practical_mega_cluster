// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

library Shares {
    using SafeMath for uint256;

    uint256 public constant BASE = 100000;
    uint256 public constant EPSILON = 271828; // 100,000 base

    // shareValue returns share value (BASE digital precision)
    function shareValue(uint256 capacity, uint256 c0, uint256 k) internal pure returns (uint) {
        if (capacity >= c0) {
            return BASE;
        }
        return EPSILON ** (k.mul(c0.sub(capacity)).div(c0));
    }
}
