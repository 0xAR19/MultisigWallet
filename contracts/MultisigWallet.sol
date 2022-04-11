//  SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MultisigWallet {
    //
    // Start!!
    //

    address public owner;
    uint8 public MinSignatures = 2;
    uint256 private transactionId;

    //
    // modifiers!!
    //

    constructor() {
        owner = msg.sender;
    }

    modifier isOwner() {
        require(msg.sender == owner);
        _;
    }
    modifier validOwner() {
        require(msg.sender == owner || Members[msg.sender] == 1);
        _;
    }

    //
    // struct and mappings!!
    //

    struct Transaction {
        address from;
        address payable to;
        uint256 amount;
        uint256 signatureCount;
        uint256 transactionId;
        mapping(address => uint8) signatures;
    }
    mapping(uint256 => Transaction) public transactions;
    mapping(address => uint8) private Members;
    uint256[] public pendingTransactions;

    //
    //events!!
    //

    event Deposit(address from, uint256 amount);
    event Withdraw(address to, uint256 amount);
    event TransactionCreated(
        address from,
        address to,
        uint256 amount,
        uint256 transactionId
    );
    event TransactionCompleted(
        address from,
        address to,
        uint256 amount,
        uint256 transactionId
    );
    event TransactionSigned(address by, uint256 transactionId);

    //
    // add and remove Members!!
    //

    function addMember(address addr) public isOwner returns (bool) {
        require(Members[addr] != 1);
        Members[addr] = 1;
        return true;
    }

    function removeMember(address addr) public isOwner returns (bool) {
        require(Members[addr] == 1);
        Members[addr] = 0;
        return true;
    }

    function checkMembers(address addr) public view returns (bool) {
        return (Members[addr] == 1);
    }

    //
    // deposit & withdraw & transfer!!
    //

    function deposit() public payable returns (bool) {
        emit Deposit(msg.sender, msg.value);
        return true;
    }

    function withdraw(uint256 amount) public validOwner returns (bool) {
        address payable addr = payable(msg.sender);
        transferTo(addr, amount);
        emit Withdraw(addr, amount);
        return true;
    }

    function transferTo(address payable to, uint256 amount)
        public
        validOwner
        returns (bool)
    {
        uint256 TransactionId = transactionId++;
        require(address(this).balance >= amount);
        Transaction storage transaction = transactions[TransactionId];
        transaction.from = msg.sender;
        transaction.to = to;
        transaction.amount = amount;
        transaction.signatureCount = 0;
        transaction.transactionId = transactionId;
        pendingTransactions.push(transactionId);

        emit TransactionCreated(msg.sender, to, amount, transactionId);
        return true;
    }

    //
    // sign Transaction!!
    //

    function signTransaction(uint256 trId) public validOwner returns (bool) {
        Transaction storage transaction = transactions[trId - 1];
        require(transaction.from != 0x0000000000000000000000000000000000000000);
        require(transaction.from != msg.sender);
        require(transaction.signatures[msg.sender] != 1);
        transaction.signatureCount++;
        transaction.signatures[msg.sender] = 1;

        emit TransactionSigned(msg.sender, trId);

        if (transaction.signatureCount == MinSignatures) {
            require(address(this).balance >= transaction.amount);
            transaction.to.transfer(transaction.amount);
            emit TransactionCompleted(
                transaction.from,
                transaction.to,
                transaction.amount,
                trId
            );
            deleteTransaction(trId);
        }
        return true;
    }

    //
    // delete Transaction!!
    //

    function deleteTransaction(uint256 trId) private validOwner returns (bool) {
        require(pendingTransactions.length > 0);
        uint8 replace;
        for (uint256 i = 0; i < pendingTransactions.length; i++) {
            if (replace == 1) {
                pendingTransactions[i - 1] = pendingTransactions[i];
            } else if (pendingTransactions[i] == trId) {
                replace = 1;
            }
        }
        assert(replace == 1);
        pendingTransactions.pop();

        return true;
    }

    //
    // get balance!!
    //

    function balance() public view returns (uint256) {
        uint256 cBalance = address(this).balance;
        return cBalance;
    }

    //
    // get length of pendingTransactions!!
    //

    function length() public view returns (uint256) {
        return pendingTransactions.length;
    }

    //
    // End!!
    //
}
