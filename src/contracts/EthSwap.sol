pragma solidity ^0.5.0;

import "./Token.sol";

contract EthSwap {
    string public name = "EthSwap Instant Exchange";
    Token public token;
    uint256 public rate = 100;

    constructor(Token _token) public {
        token = _token;
    }

    event TokensPurchased(
        address account,
        address token,
        uint256 amount,
        uint256 rate
    );

    event TokensSold(
        address account,
        address token,
        uint256 amount,
        uint256 rate
    );

    function buyTokens() public payable {
        uint256 totalAmount = msg.value * rate;

        require(
            token.balanceOf(address(this)) >= totalAmount,
            "Not enough balance to transfer"
        );
        token.transfer(msg.sender, totalAmount);

        emit TokensPurchased(msg.sender, address(this), totalAmount, rate);
    }

    function sellTokens(uint256 amount) public {
        require(
            token.balanceOf(msg.sender) >= amount,
            "Not enough tokens to sell"
        );

        uint256 etherAmount = amount / rate;

        require(address(this).balance >= etherAmount);

        token.transferFrom(msg.sender, address(this), amount);
        msg.sender.transfer(etherAmount);

        // Emit an event
        emit TokensSold(msg.sender, address(token), amount, rate);
    }
}
