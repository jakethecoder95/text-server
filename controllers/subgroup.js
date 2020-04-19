const Person = require("../models/Person");
const Group = require("../models/Group");
const Subgroup = require("../models/Subgroup");

// CREATE SUBGROUP
exports.createSubgroup = async (groupId, peopleIds, name) => {
  return new Promise(async (resolve, reject) => {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        const error = new Error("No Group found!");
        error.statusCode = 401;
        throw error;
      }
      const people = [];
      for (let id of peopleIds) {
        const person = await Person.findById(id);
        if (person) {
          people.push(person);
        }
      }
      const subgroup = await new Subgroup({ groupId, people, name });
      await subgroup.save();
      resolve(subgroup);
    } catch (error) {
      reject(error);
    }
  });
};

exports.putCreateSubgroup = async (req, res, next) => {
  const { groupId, peopleIds, name } = req.body;
  try {
    const subgroup = await this.createSubgroup(groupId, peopleIds, name);
    res.status(200).json({ message: "Subgroup Added", subgroup });
    return;
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
    return err;
  }
};

// DELET SUBGROUP
exports.removeSubgroup = async subgroupId => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await Subgroup.findByIdAndDelete(subgroupId);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

exports.deleteRemoveSubgroup = async (req, res, next) => {
  try {
    await this.removeSubgroup(req.body.subgroupId);
    res.status(200).json({ message: "Group was removed" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// ADD TO SUBGROUP
exports.addPersonToSubgroup = async (subgroupId, personId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const subgroup = await Subgroup.findById(subgroupId);
      if (!subgroup) {
        const error = new Error("No subgroup found with that Id");
        error.statusCode = 401;
        throw error;
      }
      subgroup.people.push(personId);
      await subgroup.save();
      resolve(subgroup);
    } catch (err) {
      reject(err);
    }
  });
};

exports.postAddPersonToSubgroup = async (req, res, next) => {
  const { subgroupId, personId } = req.body;
  try {
    await this.addPersonToSubgroup(subgroupId, personId);
    res.status(200).json({ message: "Person added" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// REMOVE PERSON FROM SUBGROUP
exports.removePersonFromSubgroup = async (subgroupId, personId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const subgroup = await Subgroup.findById(subgroupId);
      if (!subgroup) {
        const error = new Error("No subgroup found with that Id");
        error.statusCode = 401;
        throw error;
      }
      subgroup.people.filter(person => person._id !== personId);
      await subgroup.save();
      resolve(subgroup);
    } catch (err) {
      resolve(err);
    }
  });
};

exports.postRemovePersonFromSubgroup = async (req, res, next) => {
  const { subgroupId, personId } = req.body;
  try {
    await this.removePersonFromSubgroup(subgroupId, personId);
    res.status(200).json({ message: "Person removed" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// GET SUBGROUP
exports.fetchSubgroup = async subgroupId => {
  return new Promise(async (resolve, reject) => {
    try {
      const subgroup = await Subgroup.findById(subgroupId).populate("people");
      if (!subgroup) {
        const error = new Error("No Subgroup Found");
        error.statusCode = 401;
        throw error;
      }
      resolve(subgroup);
    } catch (err) {
      reject(err);
    }
  });
};

exports.getFetchSubgroup = async (req, res, next) => {
  const { subgroupId } = req.body;
  try {
    const subgroup = await this.fetchSubgroup(subgroupId);
    res.status(200).json({ subgroup: subgroup._doc });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// FETCH ALL SUBGROUPS BY GROUP ID
exports.fetchAllSubgroups = async groupId => {
  return new Promise(async (resolve, reject) => {
    try {
      const subgroups = await Subgroup.find({ groupId: groupId });
      resolve(subgroups);
    } catch (err) {
      reject(err);
    }
  });
};

exports.getFetchAllSubgroups = async (req, res, next) => {
  const { groupId } = req.body;
  try {
    const subgroups = await this.fetchAllSubgroups(groupId);
    res.status(200).json({ subgroups });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
