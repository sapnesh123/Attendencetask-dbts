import User from "../models/user.js"
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import { setTokenCookie } from "../helpers/generathelper.js";

export const signup = async (req, res) => {
    try {
        const { email, password, name, role = 'employee' } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and name are required'
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        const hashPassword = await bcrypt.hash(password, 10);
        
        const lastUser = await User.findOne().sort({ employeeId: -1 }).select("employeeId");
        let employeeId = 1001;
        if (lastUser?.employeeId) {
            employeeId = Number(lastUser.employeeId) + 1;
        }

        const user = await User.create({
            ...req.body,
            password: hashPassword,
            employeeId
        });

        user.password = undefined;

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: user
        });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error, please try again later',
            error: error.message
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatched = await bcrypt.compare(password.trim(), user.password);
        if (!isMatched) {
            return res.status(401).json({
                success: false,
                message: 'Password does not match'
            });
        }

        const tokenPayload = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || "1d" }
        );

        setTokenCookie(res, token);

        user.password = undefined;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: user,
            token,
            role: user.role
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error, please try again later',
            error: error.message
        });
    }
};

export const createByAdmin = async (req, res) => {
    try {
        const { email, password, ...userData } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const lastUser = await User.findOne().sort({ employeeId: -1 }).select("employeeId");
        let employeeId = 1001;
        if (lastUser?.employeeId) {
            employeeId = Number(lastUser.employeeId) + 1;
        }

        const user = await User.create({
            ...userData,
            email,
            password: hashPassword,
            employeeId
        });

        user.password = undefined;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user
        });
    } catch (error) {
        console.error('Create User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error, please try again later',
            error: error.message
        });
    }
};

export const checkverified = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.status(200).json({
            success: true,
            message: 'Token is valid',
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message || 'Internal Server Error'
        });
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' ? true : false,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        })

        res.status(200).json({
            success: true,
            message: 'Logout successful',
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
        })
    }
}
