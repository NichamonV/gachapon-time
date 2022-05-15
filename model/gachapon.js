const mongoose = require("mongoose");

const gachaponSchema = new mongoose.Schema({
    admin: {type: mongoose.Schema.Types.ObjectId, ref: 'admin'},
    title: { type: String },
    rate_title: { type: String },
    rate_number: { type: Number },
});

module.exports = mongoose.model("gachapon", gachaponSchema);
