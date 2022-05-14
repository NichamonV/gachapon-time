const mongoose = require("mongoose");

const gachaponSchema = new mongoose.Schema({
    admin: {type: mongoose.Schema.Types.ObjectId, ref: 'admin'},
    title: { type: String },
    rate: { type: String },
});

module.exports = mongoose.model("gachapon", gachaponSchema);