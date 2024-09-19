// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TokenMaster is ERC721 {
    address public owner;
    uint256 public totalOccasions = 0;
    uint256 public totalSupply;

    uint256 public constant OWNER_FEE_PERCENT = 2;

    struct Occasion {
        uint256 id;
        string name;
        uint256 cost;
        uint256 tickets;
        uint256 maxTickets;
        string date;
        string time;
        string location;
        address payable creator;
    }

    mapping(uint256 => Occasion) occasions;
    mapping(uint256 => mapping(address => bool)) public hasBought;
    mapping(uint256 => mapping(uint256 => address)) public seatTaken;
    mapping(uint256 => uint256[]) seatsTaken;

    // modifier onlyOwner() {
    //     require(msg.sender == owner);
    //     _;
    // }

    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {
        owner = payable(msg.sender);
    }

    function list(
        string memory _name,
        uint256 _cost,
        uint256 _maxTickets,
        string memory _date,
        string memory _time,
        string memory _location
    ) public  {
        totalOccasions++;
        occasions[totalOccasions] = Occasion(
            totalOccasions,
            _name,
            _cost,
            _maxTickets,
            _maxTickets,
            _date,
            _time,
            _location,
            payable(msg.sender)
        );
    }

    function mint(uint256 _id, uint256 _seat) public payable {

        require(_id != 0 && _id <= totalOccasions, "Invalid occasion ID");
        require(msg.value >= occasions[_id].cost, "Paying less for the ticket");

        // Require that the seat is not taken and that it exists
        require(seatTaken[_id][_seat] == address(0), "Seat already taken");
        require(_seat <= occasions[_id].maxTickets, "Sold Out");

        // Transfer the ticket money
        uint256 ticketCost = occasions[_id].cost;
        uint256 ownerFee = (ticketCost * OWNER_FEE_PERCENT) / 100; // 2% fee
        uint256 creatorShare = ticketCost - ownerFee;

        // Send the creator's share
        (bool creatorPaid, ) = occasions[_id].creator.call{value: creatorShare}("");
        require(creatorPaid, "Failed to pay the event creator");

        // Send the owner's fee
        (bool ownerPaid, ) = owner.call{value: ownerFee}("");
        require(ownerPaid, "Failed to pay the contract owner");

        // Update ticket count and seat status
        occasions[_id].tickets -= 1;
        hasBought[_id][msg.sender] = true;
        seatTaken[_id][_seat] = msg.sender;
        seatsTaken[_id].push(_seat);

        totalSupply++;
        _safeMint(msg.sender, totalSupply);
    }

    function getSeatsTaken(uint256 _id) public view returns (uint256[] memory) {
        return seatsTaken[_id];
    }

    function getOccasion(uint256 _id) public view returns (Occasion memory) {
        return occasions[_id];
    }

    // function withdraw() public onlyOwner {
    //     (bool success, ) = owner.call{value: address(this).balance}("");
    //     require(success);
    // }
}