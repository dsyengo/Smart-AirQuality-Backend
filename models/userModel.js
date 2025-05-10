import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verifyOtp: { type: Number, default: '' },
    verifyOtpExpires: { type: Number, default: 0 },
    isAccountVerified: { type: Boolean, default: false },
    resetOtp: { type: Number, default: '' },
    resetOtpExpires: { type: Number, default: 0 }
})

const userModel = mongoose.models.users || mongoose.model('users', userSchema);

export default userModel
