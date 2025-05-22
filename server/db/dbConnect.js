import mongoose from "mongoose";
 

// Connect to MongoDB
const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log("Connected to MongoDB successfully!");
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    }
}


export default dbConnection;