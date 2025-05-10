import jwt from 'jsonwebtoken'
import 'dotenv/config'

//function for fetching the user Id from the cookie token stored on the browser or mobile device
export const userAuth = async (req, res, next) => {
    try {
        const { token } = req.cookies;


        if (!token) {
            return res.json({ success: false, message: "Not Authorised, Please login" });
        }

        const decodeToken = jwt.verify(token, process.env.JWT_SECRET);

        if (decodeToken) {

            req.body.userId = decodeToken.id
        } else {

            return res.json({ success: false, message: "Not Authorized" })
        }

        next();
    } catch (error) {
        console.error("Error in userAuth middleware: ", error.message)
    }

}