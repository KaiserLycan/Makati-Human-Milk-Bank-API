import { describe, it, expect, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import BeneficiaryRouter from '../routes/beneficiary.router.js';

const mockJwtVerify = jest.fn();
const mockFindUniqueUser = jest.fn();
const mockFindManyBeneficiaries = jest.fn();
const mockFindUniqueBeneficiary = jest.fn();
const mockCreateBeneficiary = jest.fn();
const mockUpdateBeneficiary = jest.fn();
const mockDeleteBeneficiary = jest.fn();

jest.mock('jsonwebtoken', () => ({
    verify: (...args) => mockJwtVerify(...args),
    default: {
        verify: (...args) => mockJwtVerify(...args),
    }
}));

jest.mock('../db/db.ts', () => ({
    prisma: {
        user: {
            findUniqueOrThrow: (...args) => mockFindUniqueUser(...args),
        },
        beneficiary: {
            findMany: (...args) => mockFindManyBeneficiaries(...args),
            findUnique: (...args) => mockFindUniqueBeneficiary(...args),
            create: (...args) => mockCreateBeneficiary(...args),
            update: (...args) => mockUpdateBeneficiary(...args),
            delete: (...args) => mockDeleteBeneficiary(...args),
        }
    }
}));

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/', BeneficiaryRouter);

describe('Beneficiary API Unit Tests', () => {
    describe('GET /', () => {
        it('should return a list of beneficiaries', async () => {
            const mockBeneficiaries = [{ bid: 1, name: 'John Doe' }];
            mockJwtVerify.mockImplementation(() => ({ user_id: '123' }));
            mockFindUniqueUser.mockResolvedValue({ user_id: '123', role: 'manager' });
            mockFindManyBeneficiaries.mockResolvedValue(mockBeneficiaries);

            const res = await request(app)
                .get('/')
                .set('Cookie', ['access_token=valid_token']);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockBeneficiaries);
        });

        it('should return 404 if no beneficiaries are found', async () => {
            mockJwtVerify.mockImplementation(() => ({ user_id: '123' }));
            mockFindUniqueUser.mockResolvedValue({ user_id: '123', role: 'manager' });
            mockFindManyBeneficiaries.mockResolvedValue([]);

            const res = await request(app)
                .get('/')
                .set('Cookie', ['access_token=valid_token']);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('No records found.');
        });
    });

    describe('GET /:bid', () => {
        it('should return a single beneficiary', async () => {
            const mockBeneficiary = { bid: 1, name: 'John Doe' };
            mockJwtVerify.mockImplementation(() => ({ user_id: '123' }));
            mockFindUniqueUser.mockResolvedValue({ user_id: '123', role: 'manager' });
            mockFindUniqueBeneficiary.mockResolvedValue(mockBeneficiary);

            const res = await request(app)
                .get('/1')
                .set('Cookie', ['access_token=valid_token']);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockBeneficiary);
        });

        it('should return 404 if beneficiary not found', async () => {
            mockJwtVerify.mockImplementation(() => ({ user_id: '123' }));
            mockFindUniqueUser.mockResolvedValue({ user_id: '123', role: 'manager' });
            mockFindUniqueBeneficiary.mockResolvedValue(null);

            const res = await request(app)
                .get('/1')
                .set('Cookie', ['access_token=valid_token']);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('No records found.');
        });
    });

    describe('POST /register', () => {
        it('should register a new beneficiary', async () => {
            const application = { name: 'Jane Doe', caregiver_email: 'jane@doe.com' };
            const newBeneficiary = { bid: 2, ...application };
            mockJwtVerify.mockImplementation(() => ({ user_id: '123' }));
            mockFindUniqueUser.mockResolvedValue({ user_id: '123', role: 'manager' });
            mockCreateBeneficiary.mockResolvedValue(newBeneficiary);

            const res = await request(app)
                .post('/register')
                .send({ application })
                .set('Cookie', ['access_token=valid_token']);

            expect(res.status).toBe(201);
            expect(res.body).toEqual(newBeneficiary);
        });
    });
    
    describe('POST /public-register', () => {
        it('should register a new beneficiary publicly', async () => {
            const application = { name: 'Jane Doe', caregiver_email: 'jane@doe.com' };
            const newBeneficiary = { bid: 2, ...application };
            mockCreateBeneficiary.mockResolvedValue(newBeneficiary);

            const res = await request(app)
                .post('/public-register')
                .send({ application });

            expect(res.status).toBe(201);
            expect(res.body).toEqual(newBeneficiary);
        });
    });

    describe('PATCH /:bid', () => {
        it('should update application status', async () => {
            const updatedBeneficiary = { bid: 1, application_status: 'approved' };
            mockJwtVerify.mockImplementation(() => ({ user_id: '123' }));
            mockFindUniqueUser.mockResolvedValue({ user_id: '123', role: 'manager' });
            mockUpdateBeneficiary.mockResolvedValue(updatedBeneficiary);

            const res = await request(app)
                .patch('/1')
                .send({ application_status: 'approved' })
                .set('Cookie', ['access_token=valid_token']);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(updatedBeneficiary);
        });
    });

    describe('DELETE /:bid', () => {
        it('should delete a beneficiary', async () => {
            mockJwtVerify.mockImplementation(() => ({ user_id: '123' }));
            mockFindUniqueUser.mockResolvedValue({ user_id: '123', role: 'manager' });
            mockUpdateBeneficiary.mockResolvedValue({});
            mockDeleteBeneficiary.mockResolvedValue({});

            const res = await request(app)
                .delete('/1')
                .set('Cookie', ['access_token=valid_token']);

            expect(res.status).toBe(204);
        });
    });

    describe('PUT /:bid', () => {
        it('should update a beneficiary', async () => {
            const beneficiary = { name: 'John Doe Updated' };
            const updatedBeneficiary = { bid: 1, ...beneficiary };
            mockJwtVerify.mockImplementation(() => ({ user_id: '123' }));
            mockFindUniqueUser.mockResolvedValue({ user_id: '123', role: 'manager' });
            mockUpdateBeneficiary.mockResolvedValue(updatedBeneficiary);

            const res = await request(app)
                .put('/1')
                .send({ beneficiary })
                .set('Cookie', ['access_token=valid_token']);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(updatedBeneficiary);
        });
    });
});