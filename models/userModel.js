import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verifyOtp: { type: Number, default: null },
    verifyOtpExpires: { type: Number, default: 0 },
    isAccountVerified: { type: Boolean, default: false },
    resetOtp: { type: Number, default: null },
    resetOtpExpires: { type: Number, default: 0 },
    profile: {
        ageRange: { type: String, enum: ['Under 18', '18-30', '31-45', '46-60', 'Over 60'], default: null },
        location: { type: String, default: null },
        hasRespiratoryIssues: { type: Boolean, default: false },
        healthConditions: { type: String, default: null },
        isProfileComplete: {
            type: Boolean,
            default: function () {
                return !!this.profile?.ageRange && !!this.profile?.location;
            }
        }
    },
    fcmToken: String,
}, { timestamps: true });

const userModel = mongoose.models.users || mongoose.model('users', userSchema);

export default userModel;