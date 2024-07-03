// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Mega-Cluster withdrawable controller

 */
contract WithdrawManager is ERC20{
    uint index;
    mapping(address => uint) entity_to_index;

    constructor() ERC20("Mega Cluster Share", "PMC"){

    }

    function markWithdrawal(address entity, uint amount) internal {
        entity_to_index[entity] += amount;
    }

    function markDeposit(uint amount) internal {
        index += amount;
    }

    /**
     returns the available balance that the entity can withdraw
     returns = s_i/S*I - sum(w_i)
     */
    function availableBalance(address entity) view public returns (uint) {
        uint shares = balanceOf(entity);
        uint total = totalSupply();

        uint share_base_100 = shares*100/total;
        return index*share_base_100/100-entity_to_index[entity];
    }

    // ##### ERC20
    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        revert("shares are not transferable");
        return false;
    }

    // ###### views
    function getBalanceIndex() public view returns(uint) {
        return index;
    }
}
