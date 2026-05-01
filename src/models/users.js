import  mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;



const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: [true, 'Please provide first name'],
        trim: true
    },
    last_name: {
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
     bio: {
        type: String,
        required: [true, 'Please provide a bio'],
        trim: true
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

export default mongoose.model('User', userSchema);

