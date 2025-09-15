import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  line1: { type: String, required: true },
  line2: { type: String, required: false },
  town: { type: String, required: true },
  county: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: "Kenya" },
  directions: { type: String, required: false },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
});

export { addressSchema };
