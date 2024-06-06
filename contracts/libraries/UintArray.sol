// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library UintArray {
   function sortDesc(uint[] memory values) internal pure returns (uint[] memory ) {
       uint length = values.length;
       for (uint i = 0; i < length; i++) {
           for (uint j = 0; j < length - 1; j++) {
               if (values[j] < values[j + 1]) {
                   uint temp = values[j];
                   values[j] = values[j + 1];
                   values[j + 1] = temp;
               }
           }
       }
       return values;
   }

    function greedyClusterCalculation(uint[] memory values) internal pure returns (uint) {
        uint ret;
        uint[] memory capacities = values;
        for (uint i=0 ; i <= capacities.length - 4; i++) {
            uint[] memory sorted = sortDesc(capacities);

            // add to capacity
            ret += sorted[3];

            //reduce for next iteration
            sorted[0] -= sorted[3];
            sorted[1] -= sorted[3];
            sorted[2] -= sorted[3];
            sorted[3] -= sorted[3];

            // set and iterate
            capacities = sorted;
        }
        return ret;
    }
}
