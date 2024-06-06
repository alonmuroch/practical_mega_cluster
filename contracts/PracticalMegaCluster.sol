pragma solidity ^0.8.9;

contract PracticalMegaCluster {
    uint256 public constant MAX_ENTITY = 6;

    address[] public entities;

    constructor(address[] memory _entities){
        require(_entities.length <= MAX_ENTITY,"maxed out entities");
        entities=_entities;
    }

    // ##### Views
    function getEntities() public view returns (address[] memory) {
        return entities;
    }
}
