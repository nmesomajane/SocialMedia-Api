import  mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;



const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: [true, 'Please provide first name'],
        trim: true
    },
    lastname: {
        type: String,
        required: [true, 'Please provide last name'],
        trim: true
    },
     username: {
        type: String,
        required: [true, 'Please provide a username'],
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    
}, { 
    timestamps: true 
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};




userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
export default User;

