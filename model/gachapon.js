const mongoose = require("mongoose");

const gachaponSchema = new mongoose.Schema({
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'admin' },
    items: {type: Array},
});

module.exports = mongoose.model("gachapon", gachaponSchema);
