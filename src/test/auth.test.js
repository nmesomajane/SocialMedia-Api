import request from 'supertest'
import mongoose from 'mongoose'
import app from '../src/app.js'
import User from '../src/models/users.js'

//SHARED TEST DATA 
const testUser = {
    first_name: 'Auth',
    last_name: 'Tester',
    username: 'auth_tester',
    bio: 'Testing auth flows',
    email: 'auth@test.com',
    password: 'SecurePass123!'
}

let token    
let userId   

//  CLEANUP 
afterAll(async () => {
    await User.findByIdAndDelete(userId)
    await mongoose.connection.close()
})

// SIGNUP TESTS 
describe('POST /api/v1/auth/signUp', () => {

    test('should create a new user with all required fields', async () => {
        const res = await request(app)
            .post('/api/v1/auth/signUp')
            .send(testUser)

        expect(res.statusCode).toBe(201)
        expect(res.body.success).toBe(true)
        expect(res.body.data.token).toBeDefined()
       
        expect(res.body.data.user.email).toBe(testUser.email)
        expect(res.body.data.user.password).toBeUndefined()
      

        token  = res.body.data.token
        userId = res.body.data.user._id
    })

    test('should return 400 when email already exists', async () => {
        const res = await request(app)
            .post('/api/v1/auth/signUp')
            .send(testUser)
           

        expect(res.statusCode).toBe(400)
        expect(res.body.message).toMatch(/already in use/i)
       
    })

    test('should return 400 when required fields are missing', async () => {
        const res = await request(app)
            .post('/api/v1/auth/signUp')
            .send({ email: 'missing@fields.com', password: 'Password123!' })
            

        expect(res.statusCode).toBe(400)
    })

    test('should return 400 when password is too short', async () => {
        const res = await request(app)
            .post('/api/v1/auth/signUp')
            .send({ ...testUser, email: 'short@pass.com', username: 'shortpass', password: '123' })

        expect(res.statusCode).toBe(400)
    })

    test('should return 400 when request body is empty', async () => {
        const res = await request(app)
            .post('/api/v1/auth/signUp')
            .send({})

        expect(res.statusCode).toBe(400)
    })

    test('should hash the password before storing', async () => {
      
        const userInDb = await User.findOne({ email: testUser.email })
        expect(userInDb.password).not.toBe(testUser.password)
        
        expect(userInDb.password).toMatch(/^\$2b\$/)
      
    })
})

//  SIGNIN TESTS 
describe('POST /api/v1/auth/signIn', () => {

    test('should sign in with correct credentials', async () => {
        const res = await request(app)
            .post('/api/v1/auth/signIn')
            .send({ email: testUser.email, password: testUser.password })

        expect(res.statusCode).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.token).toBeDefined()
        expect(res.body.data.user.password).toBeUndefined()
      
    })

    test('should return 401 with wrong password', async () => {
        const res = await request(app)
            .post('/api/v1/auth/signIn')
            .send({ email: testUser.email, password: 'WrongPassword!' })

        expect(res.statusCode).toBe(401)
        expect(res.body.message).toMatch(/invalid email or password/i)
      
    })

    test('should return 401 with wrong email', async () => {
        const res = await request(app)
            .post('/api/v1/auth/signIn')
            .send({ email: 'nobody@nowhere.com', password: testUser.password })

        expect(res.statusCode).toBe(401)
    })

    test('should return 400 when fields are missing', async () => {
        const res = await request(app)
            .post('/api/v1/auth/signIn')
            .send({ email: testUser.email })
      

        expect(res.statusCode).toBe(400)
    })

    test('JWT token should expire in 1 hour', async () => {
        const res = await request(app)
            .post('/api/v1/auth/signIn')
            .send({ email: testUser.email, password: testUser.password })

        const token = res.body.data.token
        
        // Decode token without verifying to check expiry
        const payload = JSON.parse(
            Buffer.from(token.split('.')[1], 'base64').toString()
        )
       

        const issuedAt  = payload.iat  
        const expiresAt = payload.exp  
        const duration  = expiresAt - issuedAt

        expect(duration).toBe(3600)
       
    })
})

//SIGNOUT TESTS 
describe('POST /api/v1/auth/signOut', () => {

    test('should sign out when logged in', async () => {
        const res = await request(app)
            .post('/api/v1/auth/signOut')
            .set('Authorization', `Bearer ${token}`)

        expect(res.statusCode).toBe(200)
        expect(res.body.success).toBe(true)
    })

    test('should return 401 when no token provided', async () => {
        const res = await request(app)
            .post('/api/v1/auth/signOut')
            

        expect(res.statusCode).toBe(401)
    })
})