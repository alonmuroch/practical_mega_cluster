pragma solidity ^0.8.9;

import "./libraries/array.sol";
import "hardhat/console.sol";

contract PracticalMegaCluster {
    using UintArray for uint[];

    uint256 public constant MAX_ENTITY = 6;
    uint256 public constant NEW_OPERATOR_CAPACITY = 500;

    mapping(address => uint) public entities_index;
    address[] public entities;
    uint[] entity_capacity;
    uint public capacity;

    modifier onlyEntity() {
        require(entities[entities_index[msg.sender]] == msg.sender, "entity not registered");
        _;
    }

    event RegisteredOperator(bytes publicKey);

    constructor(address[] memory _entities){
        require(_entities.length <= MAX_ENTITY,"maxed out entities");
        require(_entities.length >= 4,"min 4 entities");

        for (uint i=0 ; i < _entities.length; i++) {
            entities_index[_entities[i]] = i;
            entity_capacity.push(0);
        }
        entities = _entities;
    }

    // ##### operator management
    function registerOperator(
        bytes calldata publicKey, uint256 fee
    ) public onlyEntity {
        entity_capacity[entities_index[msg.sender]] += NEW_OPERATOR_CAPACITY;

        // TODO - pass to ssv contracts

        capacity = _calculateCapacity(entity_capacity);

        emit RegisteredOperator(publicKey);
    }

    // ##### Views
    function getEntities() public view returns (address[] memory) {
        return entities;
    }

    // ###### internal
    function _calculateCapacity(uint[] memory _capacities) internal returns(uint) {
        uint ret;
        uint[] memory capacities = _capacities;
        for (uint i=0 ; i < capacities.length - 4; i++) {
            uint[] memory sorted = capacities.sortDesc();

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
