import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
   

    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true
        // Required because a post with no title is not useful
       
    },

    content: {
        type: String,
        required: [true, 'Please provide content for the post'],
        trim: true
       
    },

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author is required']
    },

    tags: {
        type: [String],
        default: []
      
    },

    state: {
        type: String,
        enum: {
            values: ['draft', 'published'],
            message: 'State must be either draft or published'
        },
        default: 'draft'
        
    },

    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
          
            
    }],


}, { 
    timestamps: true,

    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

postSchema.virtual('like_count').get(function() {
    return this.likes.length
    
})

postSchema.virtual('comment_count').get(function() {

    return 0
})



postSchema.index({ author: 1 })


postSchema.index({ state: 1 })


postSchema.index({ title: 'text', tags: 'text' })

postSchema.index({ createdAt: -1 })


const Post = mongoose.model('Post', postSchema)
export default Post