// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library EntityArray {
    struct Entity {
        address owner;
        uint capacity;
    }

    function capacityArray(Entity[] memory entities) internal pure returns (uint[] memory ) {
        uint[] memory ret = new uint[](entities.length);
        for (uint i = 0; i < entities.length; i++) {
            ret[i] = entities[i].capacity;
        }
        return ret;
    }
}