pragma solidity ^0.8.9;

import "./libraries/UintArray.sol";
import "./libraries/EntityArray.sol";
import "hardhat/console.sol";

contract PracticalMegaCluster {
    using UintArray for uint[];
    using EntityArray for EntityArray.Entity[];


    uint256 public constant MAX_ENTITY = 6;
    uint256 public constant NEW_OPERATOR_CAPACITY = 500;

    mapping(address => uint) public entities_index;
    EntityArray.Entity[] public entities;
    mapping(uint => address) public operatorToEntity;
    uint public capacity;

    modifier onlyEntity() {
        require(entities[entities_index[msg.sender]].owner == msg.sender, "entity not registered");
        _;
    }

    event RegisteredOperator(bytes publicKey, uint operatorID);
    event RegisteredValidator(uint[] entities, uint count, uint newCapacity);

    constructor(address[] memory _entities){
        require(_entities.length <= MAX_ENTITY,"maxed out entities");
        require(_entities.length >= 4,"min 4 entities");

        for (uint i=0 ; i < _entities.length; i++) {
            entities_index[_entities[i]] = i;

            entities.push(EntityArray.Entity({
                owner: _entities[i],
                capacity: 0
                })
            );
        }
    }

    // ##### operator management
    function registerValidator(
        uint[] memory entityIDs,
        uint64[] memory operatorIds,
        bytes[] calldata sharesData
    ) public onlyEntity{
        require(entityIDs.length == 4, "registering validator requires 4 entities");
        // TODO - require entity ids to be unique

        // validate capacity
        EntityArray.Entity[] memory _entities =  new EntityArray.Entity[](4);
        _entities[0] = entities[entityIDs[0]];
        _entities[1] = entities[entityIDs[1]];
        _entities[2] = entities[entityIDs[2]];
        _entities[3] = entities[entityIDs[3]];

        require(_entities.capacityArray().greedyClusterCalculation() >= sharesData.length, "not enough capacity");

        // TODO register on ssv contracts

        // reduce capacity
        entities[entityIDs[0]].capacity -= sharesData.length;
        entities[entityIDs[1]].capacity -= sharesData.length;
        entities[entityIDs[2]].capacity -= sharesData.length;
        entities[entityIDs[3]].capacity -= sharesData.length;

        // recalculate capacity
        capacity = entities.capacityArray().greedyClusterCalculation();

        emit RegisteredValidator(entityIDs, sharesData.length, capacity);
    }

    function registerOperator(
        bytes calldata publicKey, uint256 fee
    ) public onlyEntity {
        entities[entities_index[msg.sender]].capacity += NEW_OPERATOR_CAPACITY;

        // TODO - pass to ssv contracts
        uint randomOperatorID = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.number))) % 1000;
        operatorToEntity[randomOperatorID] = msg.sender;

        capacity = entities.capacityArray().greedyClusterCalculation();

        emit RegisteredOperator(publicKey,randomOperatorID);
    }

    // ##### Views
    function getEntities() public view returns (EntityArray.Entity[] memory) {
        return entities;
    }
}
