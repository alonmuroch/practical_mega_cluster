pragma solidity ^0.8.9;

contract PracticalMegaCluster {
    uint256 public constant MAX_ENTITY = 6;
    uint256 public constant NEW_OPERATOR_CAPACITY = 6;

    mapping(address => uint) public entities_index;
    address[] public entities;
    mapping(address => uint) entity_capacity;

    modifier onlyEntity() {
        require(entities[entities_index[msg.sender]] == msg.sender, "entity not registered");
        _;
    }

    event RegisteredOperator(bytes publicKey);

    constructor(address[] memory _entities){
        require(_entities.length <= MAX_ENTITY,"maxed out entities");

        for (uint i=0 ; i < _entities.length; i++) {
            entities_index[_entities[i]] = i;
        }
        entities = _entities;
    }

    // ##### operator management
    function registerOperator(
        bytes calldata publicKey, uint256 fee
    ) public onlyEntity {
        entity_capacity[msg.sender] += NEW_OPERATOR_CAPACITY;

        // TODO - pass to ssv contracts

        emit RegisteredOperator(publicKey);
    }

    // ##### Views
    function getEntities() public view returns (address[] memory) {
        return entities;
    }
}
