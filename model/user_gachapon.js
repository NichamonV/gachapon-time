const mongoose = require("mongoose");

const userGachaponSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    title: { type: String }
});

module.exports = mongoose.model("userGachapon", userGachaponSchema);
