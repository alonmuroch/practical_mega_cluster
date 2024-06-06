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
}
