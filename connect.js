import mongoose from "mongoose";
const connectToMongoDB = async () => {
  return await mongoose.connect(process.env.MONGOOSE_URL);
};

export default connectToMongoDB;
