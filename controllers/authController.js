import userModel from '../models/userModel.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import transporter from '../services/nodemailer.js'
import { verifyAccountTemplate, passwordResetTemplate } from '../utils/otpTemplate.js'

export const register = async (req, res) => {
    try {
        const { email, name, password } = req.body;

        if (!email || !name || !password) {
            return res.json({ success: false, message: "Fill in all the details" })
        }

        const existingUser = await userModel.findOne({ email })

        if (existingUser) {
            return res.json({ success: false, message: 'User already exists, please proceed to Login' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = new userModel({
            name: name,
            email: email,
            password: hashedPassword
        })

        await user.save();

        return res.json({ success: true, message: 'Account created succesfully, Please Login' })

    } catch (error) {
        return res.json({ success: false, message: `Error occured ${error.message}` })
    }
}

//Login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ success: false, message: "Missing details" })
        }

        const existingUser = await userModel.findOne({ email })

        if (!existingUser) {
            return res.json({ success: false, message: "User not found, Please Sign Up" })
        }

        const isMatch = await bcrypt.compare(password, existingUser.password)

        if (isMatch) {
            const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 2 * 24 * 60 * 60 * 1000,
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'none',
            })
        } else {
            return res.json({ success: false, message: "Invalid Passord, Please try again" })
        }

        return res.json({ success: true, message: "User Logged in Succesfully" })

    } catch (error) {
        return res.json({ success: false, message: `Error occured ${error.message}` })
    }
}


//logout
export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'none',
        })

        return res.json({ success: true, message: "Logged Succesfully" })
    } catch (error) {
        return res.json({ success: false, message: `Error occured ${error.message}` })
    }
}

//send verify otp 

export const sendVerifyOtp = async (req, res) => {
    const { userId } = req.body;

    const user = await userModel.findById(userId)

    if (!user) {
        return res.json({ success: false, message: "User does not exist" })
    }

    const Otp = String(Math.floor(100000 + Math.random() * 900000));

    user.verifyOtp = Otp;
    user.verityOtpExpires = Date.now() + (24 * 60 * 60 * 1000);

    await user.save()

    console.log("User ", user)

    const mailOptions = {
        from: 'devs.masterchief@gmail.com',
        to: user.email,
        subject: 'OTP verification code',
        html: verifyAccountTemplate(user.name, Otp)
    }

    await transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err)
        } else {
            console.log("Email sent succesfully: ", info.response)
        }
    })

    return res.json({ success: true, message: "OTP send successfully" })
}

//verify account

export const verifyAccount = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        const user = await userModel.findById(userId)

        if (user.verifyOtp === "" || user.verifyOtp !== otp) {
            return res.json({ message: "Invalid OTP" })
        }

        if (user.verityOtpExpires < Date.now()) {
            return res.json({ message: "OTP expired" })
        }

        user.isAccountVerified = true;

        //reset otp and expiry
        user.verifyOtp = "";
        user.verifyOtpExpires = 0;

        await user.save()

        return res.json({ success: true, message: "Account verification successful" })
    } catch (error) {
        return res.json({ success: false, message: "Account verification failed" })
    }
}

//reset password OTP
export const sendResetOtp = async (req, res) => {
    const { email } = req.body;

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.json({ success: false, message: "User does not exist" })
    }

    const Otp = String(Math.floor(100000 + Math.random() * 900000));

    user.resetOtp = Otp;
    user.resetOtpExpires = Date.now() + (24 * 60 * 60 * 1000);

    await user.save()

    console.log("User ", user)

    const mailOptions = {
        from: 'devs.masterchief@gmail.com',
        to: user.email,
        subject: 'Password Reset OTP',
        html: passwordResetTemplate(user.name, Otp)
    }

    await transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err)
        } else {
            console.log("Email sent succesfully: ", info.response)
        }
    })

    return res.json({ success: true, message: "OTP send successfully" })
}

//password reset

export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await userModel.findOne({ email })

        if (user.resetOtp === "" || user.resetOtp !== otp) {
            return res.json({ message: "Invalid OTP" })
        }

        if (user.resetOtpExpires < Date.now()) {
            return res.json({ message: "OTP expired" })
        }

        //reset the password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;


        //reset otp and expiry
        user.resetOtp = "";
        user.resetOtpExpires = 0;

        await user.save()

        return res.json({ success: true, message: "Password reset successfully" })
    } catch (error) {
        console.log(error)
        return res.json({ success: false, message: "Password reset failed" })
    }
}