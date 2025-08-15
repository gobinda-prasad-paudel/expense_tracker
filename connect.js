import mongoose from "mongoose";
const connectToMongoDB = async () => {
  return await mongoose.connect(process.env.MONGO_URI);
};

export default connectToMongoDB;
