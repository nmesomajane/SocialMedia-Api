import request from 'supertest'
import mongoose from 'mongoose'
import app from '../src/app.js'
import Post from '../src/models/post.js'
import User from '../src/models/users.js'


let token        // stores JWT for authenticated requests
let userId       // stores test user's ID
let postId       // stores test post's ID


beforeAll(async () => {
   
    const res = await request(app)
        .post('/api/v1/auth/signUp')
        .send({
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser_post',
            bio: 'Test bio',
            email: 'posttest@example.com',
            password: 'SecurePass123!'
        })

    token = res.body.data.token
    userId = res.body.data.user._id
})


afterAll(async () => {
    await Post.deleteMany({ author: userId })
    await User.findByIdAndDelete(userId)
    await mongoose.connection.close()
})

// CREATE POST 
describe('POST /api/v1/posts', () => {

    test('should create post in draft state when logged in', async () => {
        const res = await request(app)
            .post('/api/v1/posts')
            .set('Authorization', `Bearer ${token}`)
            // .set adds a header — this is how you send the JWT
            .send({ title: 'Test Post', content: 'Test Content', tags: ['test'] })

        expect(res.statusCode).toBe(201)
        expect(res.body.success).toBe(true)
        expect(res.body.data.post.state).toBe('draft')
        // Requirement #8 — must start as draft
        expect(res.body.data.post.title).toBe('Test Post')

        postId = res.body.data.post._id  // save for later tests
    })

    test('should return 401 when not logged in', async () => {
        const res = await request(app)
            .post('/api/v1/posts')
            .send({ title: 'Test', content: 'Content' })
            // No Authorization header

        expect(res.statusCode).toBe(401)
    })

    test('should return 400 when title is missing', async () => {
        const res = await request(app)
            .post('/api/v1/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'Content with no title' })

        expect(res.statusCode).toBe(400)
    })
})

//  GET ALL POSTS 
describe('GET /api/v1/posts', () => {

    test('should return published posts without token', async () => {
        const res = await request(app).get('/api/v1/posts')
        // No auth header — requirement #5

        expect(res.statusCode).toBe(200)
        expect(res.body.success).toBe(true)
        expect(Array.isArray(res.body.data.posts)).toBe(true)
        expect(res.body.data.pagination).toBeDefined()
    })

    test('should paginate results', async () => {
        const res = await request(app)
            .get('/api/v1/posts?page=1&limit=5')

        expect(res.statusCode).toBe(200)
        expect(res.body.data.posts.length).toBeLessThanOrEqual(5)
        expect(res.body.data.pagination.limit).toBe(5)
    })

    test('should search by title', async () => {
        const res = await request(app)
            .get('/api/v1/posts?search=Test')

        expect(res.statusCode).toBe(200)
    })
})

//GET SINGLE POST 
describe('GET /api/v1/posts/:id', () => {

    test('should return 404 for draft post when not owner', async () => {
        // postId points to a draft post created above
        const res = await request(app).get(`/api/v1/posts/${postId}`)
        // No token — not the owner

        expect(res.statusCode).toBe(404)
        // Requirement — draft posts hidden from non-owners
    })

    test('owner should be able to view their own draft', async () => {
        const res = await request(app)
            .get(`/api/v1/posts/${postId}`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.statusCode).toBe(200)
        expect(res.body.data.post.state).toBe('draft')
    })
})

// PUBLISH POST 
describe('PATCH /api/v1/posts/:id/publish', () => {

    test('owner should publish a draft post', async () => {
        const res = await request(app)
            .patch(`/api/v1/posts/${postId}/publish`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.statusCode).toBe(200)
        expect(res.body.data.post.state).toBe('published')
        // Requirement #9
    })

    test('non-owner should not be able to publish', async () => {
        // Create another user
        const otherUser = await request(app)
            .post('/api/v1/auth/signUp')
            .send({
                first_name: 'Other', last_name: 'User',
                username: 'otheruser_post', bio: 'bio',
                email: 'other_post@example.com', password: 'Password123!'
            })

        const res = await request(app)
            .patch(`/api/v1/posts/${postId}/publish`)
            .set('Authorization', `Bearer ${otherUser.body.data.token}`)

        expect(res.statusCode).toBe(403)

        // Cleanup
        await User.findByIdAndDelete(otherUser.body.data.user._id)
    })
})

// UPDATE POST
describe('PATCH /api/v1/posts/:id', () => {

    test('owner should update their post', async () => {
        const res = await request(app)
            .patch(`/api/v1/posts/${postId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Updated Title' })

        expect(res.statusCode).toBe(200)
        expect(res.body.data.post.title).toBe('Updated Title')
        // Requirement #10
    })

    test('should return 401 without token', async () => {
        const res = await request(app)
            .patch(`/api/v1/posts/${postId}`)
            .send({ title: 'Hacked' })

        expect(res.statusCode).toBe(401)
    })
})

//  LIKE / UNLIKE 
describe('POST /api/v1/posts/:id/like', () => {

    test('logged in user should like a post', async () => {
        const res = await request(app)
            .post(`/api/v1/posts/${postId}/like`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.statusCode).toBe(200)
        expect(res.body.message).toBe('Post liked')
        
    })

    test('should not like the same post twice', async () => {
        const res = await request(app)
            .post(`/api/v1/posts/${postId}/like`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.statusCode).toBe(400)
        
    })

    test('should unlike a post', async () => {
        const res = await request(app)
            .delete(`/api/v1/posts/${postId}/like`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.statusCode).toBe(200)
        expect(res.body.message).toBe('Post unliked')
    })
})


describe('DELETE /api/v1/posts/:id', () => {

    test('owner should delete their post', async () => {
        const res = await request(app)
            .delete(`/api/v1/posts/${postId}`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.statusCode).toBe(200)
       
    })

    test('deleted post should no longer exist', async () => {
        const res = await request(app)
            .get(`/api/v1/posts/${postId}`)

        expect(res.statusCode).toBe(404)
    })
})