import mongoose, { Schema } from 'mongoose'

const UserSchema = new Schema(
    {
        // Basic Info
        name: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
        },
        phone: {
            type: String,
        },
        alternateNO: {
            type: String,
        },
        dob: {
            type: String,
        },
        gender: {
            type: String,
        },

        // Address
        state: {
            type: String,
        },
        pincode: {
            type: String,
        },

        emergencyContactName: {
            type: String,
            trim: true,
        },
        emergencyContactPhone: {
            type: String,
        },

        currentAddress: {
            type: String,
            trim: true,
        },
        permanentAddress: {
            type: String,
            trim: true,
        },

        // Employee Details
        departmentName: {
            type: String,
        },
        designation: {
            type: String,
        },
        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        reportingManager: {
            type: String,
        },
        hrManager: {
            type: String,
        },
        officeLocation: {
            type: String,
        },
        employeeType: {
            type: String,
        },
        joiningDate: {
            type: String,
        },


        salary: {
            type: String,
        },
        projectmanageaccess: {
            type: String,
        },
        projectmanageaccesslevel: {
            type: String,
        },


        bankName: {
            type: String,
            trim: true,
        },
        accountHolderName: {
            type: String,
            trim: true,
        },
        accountNumber: {
            type: String,
            trim: true,
        },
        ifscCode: {
            type: String,
            trim: true,
            uppercase: true,
        },
        upiId: {
            type: String,
            trim: true,
            lowercase: true,
        },


        role: {
            type: String,
            enum: ['employee', 'manager', 'admin'],
            default: 'employee',
        },

        payrollId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Payroll"
        },

        employeeId: {
            type: String,

            trim: true,
        },
        position: {
            type: String,
        },


          PSM: {
            type: [
              {
                projectId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Project",
                    default: null
                },
                role: {
                    type: String,
                    default: null
                }
              }
            ],
            default: []
        }
    },
    {
        timestamps: true,
    }
)

UserSchema.pre("find", function () {
    this.populate("payrollId")
})



UserSchema.pre("findOne", function () {
    this.populate("payrollId")
})

const User = mongoose.model('User', UserSchema)
export default User
