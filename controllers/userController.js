import User from '../models/userModel.js';

export const updateProfile = async (req, res) => {
    try {
        const { ageRange, location, hasRespiratoryIssues, healthConditions } = req.body;
        const { userId } = req.user;
        console.log("Data received for profile update:", req.body);
        // 1) Get user
        const user = await User.findById(userId);

        console.log("User Id: ", userId);

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        // 2) Update profile
        user.profile = {
            ageRange,
            location,
            hasRespiratoryIssues,
            healthConditions,
            isProfileComplete: !!ageRange && !!location && !!hasRespiratoryIssues != null
        };

        await user.save();

        // 3) Send updated user data
        res.status(200).json({
            status: 'success',
            data: {
                profile: user.profile,
                isProfileComplete: user.profile.isProfileComplete
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        const { userId } = req.user;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                profile: user.profile || null,
                isProfileComplete: user.profile?.isProfileComplete || false
            }
        });

        console.log("User profile data sent:", user.profile);
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};