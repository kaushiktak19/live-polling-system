const Poll = require("../models/pollModel");

exports.createPoll = async (pollData) => {
  console.log("Creating poll with data:", pollData);
  let newPoll = await Poll(pollData);
  const savedPoll = await newPoll.save();
  console.log("Poll saved to database:", savedPoll);
  return savedPoll;
};

exports.voteOnOption = async (pollId, optionText) => {
  try {
    const poll = await Poll.findOneAndUpdate(
      { _id: pollId, "options.text": optionText },
      { $inc: { "options.$.votes": 1 } },
      { new: true }
    );

    console.log("Vote registered successfully:", poll);
  } catch (error) {
    console.error("Error registering vote:", error);
  }
};

exports.getPolls = async (req, res) => {
  let { teacherUsername } = req.params;
  console.log("Fetching polls for teacher:", teacherUsername);
  let data = await Poll.find({ teacherUsername });
  console.log("Found polls:", data);
  res.status(200).json({
    data,
  });
};
