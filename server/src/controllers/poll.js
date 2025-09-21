const Poll = require("../models/pollModel");

exports.createPoll = async (pollData) => {
  try {
    console.log("Creating poll with data:", pollData);
    let newPoll = new Poll(pollData);
    const savedPoll = await newPoll.save();
    console.log("Poll saved to database:", savedPoll);
    return savedPoll;
  } catch (error) {
    console.error("Error creating poll:", error);
    throw error;
  }
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
  try {
    let { teacherUsername } = req.params;
    console.log("Fetching polls for teacher:", teacherUsername);
    
    if (!teacherUsername) {
      return res.status(400).json({ message: "Teacher username is required" });
    }
    
    let data = await Poll.find({ teacherUsername });
    console.log("Found polls:", data);
    
    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Error fetching polls:", error);
    res.status(500).json({ 
      message: "Failed to fetch polls",
      error: error.message 
    });
  }
};
