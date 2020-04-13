const expect = require("chai").expect;
const sinon = require("sinon");
const mongoose = require("mongoose");

const Group = require("../models/Group");
const Subgroup = require("../models/Subgroup");
const {
  putCreateSubgroup,
  deleteRemoveSubgroup,
  getFetchAllSubgroups,
  getFetchSubgroup,
  postAddPersonToSubgroup
} = require("../controllers/subgroup");

const RESPONSE_OULINE = {
  statusCode: 500,
  message: "",
  data: {},
  subgroup: {},
  subgroups: [],
  json: function (data) {
    this.data = data;
  },
  status: function (code) {
    this.statusCode = code;
    return this;
  }
};

const TEST_DB_URI = "mongodb://localhost:27017/grouptext";

describe("Subgroup Controller", function () {
  before(function (done) {
    mongoose
      .connect(TEST_DB_URI)
      .then(() => console.log("connected"))
      .then(() => Group.findById("5e7fc2e89b0019572fe204ee"))
      .then(group => {
        devGroup = group;
      })
      .then(
        () =>
          new Subgroup({
            groupId: "5e7fc2e89b0019572fe204ee",
            people: [],
            _id: "56104e9e514f539506016a5c"
          })
      )
      .then(subgroup => subgroup.save())
      .then(_ => {
        done();
      });
  });

  it("should return error if given bad groupId", function (done) {
    sinon.stub(Group, "findById");
    Group.findById.throws();

    const req = {
      body: {
        groupId: "123",
        peopleIds: ["123", "123"]
      }
    };

    const next = function (err) {
      return "No Group found!";
    };

    putCreateSubgroup(req, {}, next).then(res => {
      expect(res).to.be.an("error");
      expect(res).to.have.property("statusCode", 500);
      done();
    });

    Group.findById.restore();
  });

  it("should throw and error if unknown groupId is given", function (done) {
    sinon.stub(Group, "findById");
    Group.findById.returns(undefined);

    const req = {
      body: {
        groupId: "123",
        peopleIds: ["123", "123"]
      }
    };

    const next = function (err) {
      return "No Group found!";
    };

    putCreateSubgroup(req, {}, next).then(res => {
      expect(res).to.be.an("error");
      expect(res).to.have.property("statusCode", 401);
      done();
    });

    Group.findById.restore();
  });

  it("should respond with a new success message and new subgroup", function (done) {
    const req = {
      body: {
        groupId: "5e7fc2e89b0019572fe204ee",
        peopleIds: ["5e913232954d614184b84697"]
      }
    };

    const res = { ...RESPONSE_OULINE };

    putCreateSubgroup(req, res, () => {}).then(_ => {
      expect(res.statusCode).to.be.equal(200);
      expect(res.data.message).to.be.equal("Subgroup Added");
      Subgroup.findByIdAndDelete(res.data.subgroup._id)
        .then(_ => {
          done();
        })
        .catch(err => done());
    });
  });

  it("should add person to subgroup", function (done) {
    const req = {
      body: {
        personId: "5e913232954d614184b84697",
        subgroupId: "56104e9e514f539506016a5c"
      }
    };

    const res = { ...RESPONSE_OULINE };

    postAddPersonToSubgroup(req, res, () => {})
      .then(_ => {
        expect(res.statusCode).to.equal(200);
        expect(res.data.message).to.equal("Person added");
        return Subgroup.findById(req.body.subgroupId);
      })
      .then(subgroup => {
        expect(subgroup.people[0].toString()).to.equal(req.body.personId);
        done();
      });
  });

  it("should remove person from subgroup", function () {
    const req = {
      body: {
        personId: "5e913232954d614184b84697"
      }
    };

    const res = { ...RESPONSE_OULINE };
  });

  it("should return all subgroups", function (done) {
    const groupId = "5e7fc2e89b0019572fe204ee";

    const req = {
      body: { groupId }
    };

    const res = { ...RESPONSE_OULINE };

    getFetchAllSubgroups(req, res, _ => {}).then(_ => {
      expect(res.statusCode).to.be.equal(200);
      expect(res.data.subgroups).to.be.an("array");
      done();
    });
  });

  it("should return a single subgroup", function (done) {
    const subgroupId = "56104e9e514f539506016a5c";
    const req = {
      body: {
        subgroupId
      }
    };

    const res = { ...RESPONSE_OULINE };

    getFetchSubgroup(req, res, () => {})
      .then(_ => {
        expect(res.statusCode).to.be.equal(200);
        return Subgroup.findById(subgroupId).populate("people");
      })
      .then(subgroup => {
        expect(res.data.subgroup).to.be.deep.equal(subgroup._doc);
        done();
      });
  });

  it("should remove subgroup", function (done) {
    const subgroupId = "56104e9e514f539506016a5c";
    const req = {
      body: {
        subgroupId
      }
    };

    const res = { ...RESPONSE_OULINE };

    deleteRemoveSubgroup(req, res, () => {})
      .then(_ => {
        expect(res.statusCode).to.be.equal(200);
        expect(res.data.message).to.be.equal("Group was removed");
        return Subgroup.findById(subgroupId);
      })
      .then(subgroup => {
        expect(subgroup).to.be.equal(null);
        done();
      });
  });

  after(function (done) {
    mongoose.disconnect().then(_ => {
      done();
    });
  });
});
