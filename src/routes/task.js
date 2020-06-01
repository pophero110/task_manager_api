const express = require("express");
const router = express.Router();
const Task = require("../models/task");
const mongoose = require("mongoose");
const auth = require('../middleware/auth')

//GET /tasks?completed=false
//GET /task?limit=10&skip=10
//GET /task?sortBy=createdAt_desc
router.get("/tasks", auth,  async (req, res) => {
  const match = {}
  const sort = {}
  if(req.query.completed) {
    match.completed = req.query.completed === "true"
  }
  if(req.query.sortBy) {
    const parts = req.query.sortBy.split(':')
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
  }
  try {
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort
        }
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (error) {
    res.status(500).send();
  }
});


router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).send("_id is not valid");
  }
  try {
    const task = await Task.findOne({ _id, owner:req.user._id })
    console.log(task)
    if (!task) {
      return res.status(404).send("task is not found");
    }
    res.send(task);
  } catch (error) {
    res.status(500).send();
  }
});

router.post("/tasks", auth,  async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      owner: req.user._id,
    });
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.patch("/tasks/:id",auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowdUpdated = ["description", "completed"];
  const isValidUpdate = updates.every((update) =>
    allowdUpdated.includes(update)
  );

  if (!isValidUpdate) {
    return res.status(400).send({ error: "Invalid task updates" });
  }
  try {
    const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
 
    if (!task) {
      return res.status(404).send("task is not found");
    }
     updates.forEach((update) => (task[update] = req.body[update]));
     task.save();

    res.send(task);
  } catch (error) {
    res.status(400).send();
  }
});

router.delete("/tasks/:id", auth,  async (req, res) => {
  try {

    const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id});
    if (!task) {
      return res.status(404).send("task is not found");
    }
    res.send(task);
  } catch (error) {
    res.status(400).send();
  }
});

module.exports = router