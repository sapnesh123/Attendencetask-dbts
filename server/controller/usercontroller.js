import User from '../models/user.js';

export const getAllUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 50 } = req.query;
        const currentUser = req.user;

        let query = {};

        if (currentUser.role === 'manager') {
            query.managerId = currentUser._id;
        }

        if (role) {
            query.role = role;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get All Users Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        if (currentUser.role === 'employee' && currentUser._id.toString() !== id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get User By Id Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;
        const updateData = req.body;

        delete updateData.password;
        delete updateData.role;
        delete updateData.employeeId;

        if (currentUser.role === 'employee' && currentUser._id.toString() !== id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (currentUser.role === 'manager' && currentUser._id.toString() !== id) {
            const user = await User.findById(id);
            if (user?.managerId?.toString() !== currentUser._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Update User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export const getTeamMembers = async (req, res) => {
    try {
        const currentUser = req.user;

        let query = {};
        
        if (currentUser.role === 'manager') {
            query.managerId = currentUser._id;
        }

        const members = await User.find({
            ...query,
            role: 'employee'
        })
            .select('-password')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: members
        });
    } catch (error) {
        console.error('Get Team Members Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const currentUser = req.user;

        // Only admin can change roles
        if (currentUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can change user roles'
            });
        }

        if (!['employee', 'manager', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be employee, manager, or admin'
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User role updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Update User Role Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// export const updateUserRole = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { role } = req.body;
//         const currentUser = req.user;

//         // Only admin can change roles
//         if (currentUser.role !== 'admin') {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Only admin can change user roles'
//             });
//         }

//         if (!['employee', 'manager', 'admin'].includes(role)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid role. Must be employee, manager, or admin'
//             });
//         }

//         const user = await User.findByIdAndUpdate(
//             id,
//             { role },
//             { new: true }
//         ).select('-password');

//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: 'User role updated successfully',
//             data: user
//         });
//     } catch (error) {
//         console.error('Update User Role Error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Server error',
//             error: error.message
//         });
//     }
// };
