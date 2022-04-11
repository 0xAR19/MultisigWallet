const Multisig = artifacts.require("MultisigWallet");
contract("MultisigWallet", (accounts) => {
    let instance = null;
    before(async () => {
        instance = await Multisig.deployed();
    })
    var owner = accounts[0];
    var member1 = accounts[1];
    var member2 = accounts[2];
    var ex = accounts[3];

    it("Should be deployed !!", async () => {
        assert(instance.address != "");
    })
    it("Minimum required signature must be 2 !!", async () => {
        let result = await instance.MinSignatures();
        assert(result == 2);
    })
    it("Should owner be valid !!", async () => {
        let result = await instance.owner();
        assert(result == owner);
        assert(result != member1);
    })
    it("only owner can adds member !!", async () => {
        return instance.addMember(member1, { from: ex }).then(result => {
            assert.fail()
        }).catch(error => {
            assert.notEqual(error.message, "assert.fail()", "Transaction was not reverted with an invalid address!!")
        })
    })
    it("Should don't let to add valid member again !!", async () => {
        return instance.addMember(member1, { from: owner }).then(next => {
            return instance.addMember(member1, { from: owner })
        }).then(result => {
            assert.fail()
        }).catch(error => {
            assert.notEqual(error.message, "assert.fail()", "valid members doesn't add again!!")
        })
    })
    it("Only owner can removes member !!", async () => {
        return instance.removeMember(member1, { from: ex }).then(result => {
            assert.fail()
        }).catch(error => {
            assert.notEqual(error.message, "assert.fail()", "who calls function is owner!!")
        })
    })
    it("Should remove only valid members !!", async () => {
        return instance.removeMember(ex).then(result => {
            assert.fail()
        }).catch(error => {
            assert.notStrictEqual(error.message, "assert.fail()", "valid member removed!!")
        })
    })
    it("only valid members can withdraw and transfer amount !!", async () => {
        return instance.deposit({ from: member2, value: 20000 }).then(next => {
            return instance.withdraw(20000, { from: ex })
        }).then(result => {
            assert.fail()
        }).catch(error => {
            assert.notStrictEqual(error.message, "assert.fail()", "who calls function is valid member!!")
        })
    })
    it("Should transfer valid amount !!", async () => {
        return instance.deposit({ from: member1, value: 2000 }).then(next => {
            return instance.transferTo(member2, 200000000, { from: owner })
        }).then(result => {
            assert.fail()
        }).catch(error => {
            assert.notStrictEqual(error.message, "assert.fail()", "amount is valid!!")
        })
    })
    it("only valid members can sign transaction !!", async () => {
        return instance.addMember(member2).then(next => {
            return instance.withdraw(2000, { from: member2 })
        }).then(next => {
            return instance.signTransaction(1, { from: ex })
        }).then(result => {
            assert.fail()
        }).catch(error => {
            assert.notStrictEqual(error.message, "assert.fail()", "who is signing transaction is valid member!")
        })
    })
    it("creator of pending transaction can't sign the transaction !!", async () => {
        return instance.signTransaction(1, { from: member2 }).then(result => {
            assert.fail()
        }).catch(error => {
            assert.notStrictEqual(error.message, "assert.fail()", "who is signing transaction is not creator of transaction!!")
        })
    })
    it("who signed a pending transaction once, can't sign it again !!", async () => {
        return instance.signTransaction(1, { from: member1 }).then(next => {
            return instance.signTransaction(1, { from: member1 })
        }).then(result => {
            assert.fail()
        }).catch(error => {
            assert.notStrictEqual(error.message, "assert.fail()", "who is signing transaction, haven't signed it before!!")
        })
    })
    it("only exist transactions can be signed !!", async () => {
        return instance.signTransaction(2, { from: owner }).then(result => {
            assert.fail()
        }).catch(error => {
            assert.notStrictEqual(error.message, "assert.fail()", "the transaction that is signing is exist!!")
        })
    })
    it("transaction shloud be completed after signing by 2 members !!", async () => {
        let b = await instance.balance();
        await instance.signTransaction(1, { from: owner });
        let B = await instance.balance();
        assert.notEqual(b, B)
    })
    it("transaction must be deleted from pendingTransactions after get signed 2 times !!", async () => {
        await instance.transferTo(ex, 10000, { from: member1 });
        await instance.withdraw(10000, { from: owner });
        let x = await instance.length();
        await instance.signTransaction(2, { from: owner });
        await instance.signTransaction(2, { from: member2 });
        let y = await instance.length();
        assert(x.toNumber() != y.toNumber())
        assert(y.toNumber() + 1 == x.toNumber())
    })
    it("everything is good !!", async () => {
        await instance.signTransaction(3, { from: member1 });
        await instance.signTransaction(3, { from: member2 });
        let b = await instance.balance();
        let l = await instance.length();
        let t1 = await instance.transactions(0);
        let t2 = await instance.transactions(1);
        let t3 = await instance.transactions(2);
        let t4 = await instance.transactions(3);
        assert.equal(b.toNumber(), 0);
        assert.equal(l.toNumber(), 0);
        assert.notStrictEqual(t1, t2);
        assert.notStrictEqual(t3, t4);
    })
})