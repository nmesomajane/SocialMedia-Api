import request from 'supertest'
import mongoose from 'mongoose'
import app from '../src/app.js'
import User from '../src/models/users.js'

// TEST USERS 
let userAToken   // user doing the following
let userAId
let userBToken   // user being followed
let userBId

// SETUP — create two users before tests run 
beforeAll(async () => {
    const [resA, resB] = await Promise.all([
        request(app).post('/api/v1/auth/signUp').send({
            first_name: 'User', last_name: 'A',
            username:   'user_a_follow',
            bio:        'I am user A',
            email:      'userA@follow.com',
            password:   'Password123!'
        }),
        request(app).post('/api/v1/auth/signUp').send({
            first_name: 'User', last_name: 'B',
            username:   'user_b_follow',
            bio:        'I am user B',
            email:      'userB@follow.com',
            password:   'Password123!'
        })
    ])
   

    userAToken = resA.body.data.token
    userAId    = resA.body.data.user._id
    userBToken = resB.body.data.token
    userBId    = resB.body.data.user._id
})

//  CLEANUP 
afterAll(async () => {
    await Promise.all([
        User.findByIdAndDelete(userAId),
        User.findByIdAndDelete(userBId)
    ])
    await mongoose.connection.close()
})

//  FOLLOW TESTS 
describe('POST /api/v1/users/:id/follow', () => {

    test('user A should follow user B', async () => {
        const res = await request(app)
            .post(`/api/v1/users/${userBId}/follow`)
            .set('Authorization', `Bearer ${userAToken}`)

        expect(res.statusCode).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.message).toMatch(/followed successfully/i)
    })

    test('should not follow the same user twice', async () => {
    
        const res = await request(app)
            .post(`/api/v1/users/${userBId}/follow`)
            .set('Authorization', `Bearer ${userAToken}`)

        expect(res.statusCode).toBe(400)
        expect(res.body.message).toMatch(/already following/i)
       
    })

    test('should not be able to follow yourself', async () => {
        const res = await request(app)
            .post(`/api/v1/users/${userAId}/follow`)
            .set('Authorization', `Bearer ${userAToken}`)
            

        expect(res.statusCode).toBe(400)
        expect(res.body.message).toMatch(/cannot follow yourself/i)
    
    })

    test('should return 401 when not logged in', async () => {
        const res = await request(app)
            .post(`/api/v1/users/${userBId}/follow`)
            // No token

        expect(res.statusCode).toBe(401)
    })

    test('should return 404 for non-existent user', async () => {
        const fakeId = new mongoose.Types.ObjectId()
        // Creates a valid-format but non-existent MongoDB ID

        const res = await request(app)
            .post(`/api/v1/users/${fakeId}/follow`)
            .set('Authorization', `Bearer ${userAToken}`)

        expect(res.statusCode).toBe(404)
    })
})

//  GET FOLLOWING TESTS 
describe('GET /api/v1/users/:id/following', () => {

    test('should return list of users A follows', async () => {
        const res = await request(app)
            .get(`/api/v1/users/${userAId}/following`)
            .set('Authorization', `Bearer ${userAToken}`)

        expect(res.statusCode).toBe(200)
        expect(res.body.success).toBe(true)
        expect(Array.isArray(res.body.data.following)).toBe(true)
        expect(res.body.data.following.length).toBe(1)
      
        expect(res.body.data.following[0]._id).toBe(userBId)
   
    })

    test('should return empty array when user follows nobody', async () => {
        const res = await request(app)
            .get(`/api/v1/users/${userBId}/following`)
            .set('Authorization', `Bearer ${userBToken}`)

        expect(res.statusCode).toBe(200)
        expect(res.body.data.following.length).toBe(0)
        
    })
})

//  GET FOLLOWERS TESTS 
describe('GET /api/v1/users/:id/followers', () => {

    test('should return list of users following B', async () => {
        const res = await request(app)
            .get(`/api/v1/users/${userBId}/followers`)
            .set('Authorization', `Bearer ${userBToken}`)

        expect(res.statusCode).toBe(200)
        expect(Array.isArray(res.body.data.followers)).toBe(true)
        expect(res.body.data.followers.length).toBe(1)
   
        expect(res.body.data.followers[0]._id).toBe(userAId)
      
    })

    test('should return empty array when user has no followers', async () => {
        const res = await request(app)
            .get(`/api/v1/users/${userAId}/followers`)
            .set('Authorization', `Bearer ${userAToken}`)

        expect(res.statusCode).toBe(200)
        expect(res.body.data.followers.length).toBe(0)
      
    })
})

//  UNFOLLOW TESTS 
describe('DELETE /api/v1/users/:id/follow', () => {

    test('user A should unfollow user B', async () => {
        const res = await request(app)
            .delete(`/api/v1/users/${userBId}/follow`)
            .set('Authorization', `Bearer ${userAToken}`)

        expect(res.statusCode).toBe(200)
        expect(res.body.message).toMatch(/unfollowed successfully/i)
    
    })

    test('following list should be empty after unfollow', async () => {
        const res = await request(app)
            .get(`/api/v1/users/${userAId}/following`)
            .set('Authorization', `Bearer ${userAToken}`)

        expect(res.body.data.following.length).toBe(0)
       
    })

    test('should return 400 when trying to unfollow someone not followed', async () => {
        const res = await request(app)
            .delete(`/api/v1/users/${userBId}/follow`)
            .set('Authorization', `Bearer ${userAToken}`)
            

        expect(res.statusCode).toBe(400)
        expect(res.body.message).toMatch(/not following/i)
    })

    test('should return 401 when not logged in', async () => {
        const res = await request(app)
            .delete(`/api/v1/users/${userBId}/follow`)
           

        expect(res.statusCode).toBe(401)
    })
})