import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["PERCENT", "FLAT"],
            required: true,
        },
        value: {
            type: Number,
            required: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        labId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PathologyLab",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure only one default discount per lab
discountSchema.pre("save", async function (next) {
    if (this.isDefault) {
        await mongoose.model("Discount").updateMany(
            { labId: this.labId, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
    next();
});

const Discount = mongoose.model("Discount", discountSchema);
export default Discount;
