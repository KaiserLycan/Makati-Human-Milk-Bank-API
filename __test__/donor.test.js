import {jest, describe, it} from "@jest/globals";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import DonorRouter from "../routes/donor.router.js";

const mockJwtVerify = jest.fn();
const mockPrismaFindUniqueOrThrow = jest.fn();
const mockPrismaFindMany = jest.fn();
const mockPrismaCreateDonor = jest.fn();
const mockPrismaUpdateDonor = jest.fn();
const mockPrismaDeleteDonor = jest.fn();
const mockSendApproval = jest.fn();
const mockSendRejection = jest.fn();

jest.mock("../service/email.service.js", () => ({
    __esModule: true,
    SendApproval: (...args) => mockSendApproval(...args),
    SendRejection: (...args) => mockSendRejection(...args),
}));

jest.mock("jsonwebtoken", () => {
    return {
        __esModule: true,
        default: {
            verify: (...args) => mockJwtVerify(...args)
        },
        verify: (...args) => mockJwtVerify(...args)
    }
})

jest.mock("../db/db.ts", () => {
    return {
        __esModule: true,
        prisma: {
            donor: {
                findUniqueOrThrow: (...args) => mockPrismaFindUniqueOrThrow(...args),
                create: (...args) => mockPrismaCreateDonor(...args),
                update: (...args) => mockPrismaUpdateDonor(...args),
                delete: (...args) => mockPrismaDeleteDonor(...args),
                findMany: (...args) => mockPrismaFindMany(...args),
            },
            user: {
                findUniqueOrThrow: (...args) => mockPrismaFindUniqueOrThrow(...args),
            findMany: jest.fn().mockResolvedValue([{ user_id: '123', role: 'staff' }]),
            }
        }
    }
})

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use(DonorRouter);

describe("Donor API Unit Tests", () => {
    beforeAll(() => {
        jest.clearAllMocks();
        process.env.ACCESS_TOKEN_SECRET = "test_access_secret";
    })

    describe("GET /", () => {
        it ("Should retrieve all donors", async () => {
            const mockDonors = [
                {
                    dtn: 1,
                    name: "Athena Miller",
                    application_status: "pending"
                },
                {
                    dtn: 2,
                    name: "Stacy Heartfelt",
                    application_status: "rejected"
                },
                {
                    dtn: 3,
                    name: "Vivian Carter",
                    application_status: "approved"
                }
            ]

            mockJwtVerify.mockImplementationOnce(() => ({
                user_id: "123"
            }));
            mockPrismaFindUniqueOrThrow
                .mockImplementationOnce(() => ({user_id: "123", role: "manager"}));
            mockPrismaFindMany.mockResolvedValue(mockDonors)

            const res = await request(app)
                .get("/")
                .set("Cookie", ["access_token=valid_access_token"]);
            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockDonors);
            expect(mockPrismaFindMany).toHaveBeenCalledWith({
                omit: {
                    modified_at: true,
                    created_at: true,
                    modified_by: true,
                }
            });

        })

        it ("Should retrieve all pending applications", async () => {
            const mockDonors = [
                {
                    dtn: 1,
                    name: "Athena Miller",
                    application_status: "pending"
                }
            ]

            mockJwtVerify.mockImplementationOnce(() => ({
                user_id: "123"
            }));
            mockPrismaFindUniqueOrThrow
                .mockImplementationOnce(() => ({user_id: "123", role: "manager"}));
            mockPrismaFindMany.mockResolvedValue(mockDonors)

            const res = await request(app)
                .get("/?application_status=pending")
                .set("Cookie", ["access_token=valid_access_token"]);
            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockDonors);
            expect(mockPrismaFindMany).toHaveBeenCalledWith({
                where: {
                    application_status: "pending"
                },
                omit: {
                    created_at: true,
                    modified_by: true,
                    modified_at: true
                }
            });

        })

        it ("Should retrieve all rejected applications", async () => {
            const mockDonors = [
                {
                    dtn: 1,
                    name: "Athena Miller",
                    application_status: "rejected"
                }
            ]

            mockJwtVerify.mockImplementationOnce(() => ({
                user_id: "123"
            }));
            mockPrismaFindUniqueOrThrow
                .mockImplementationOnce(() => ({user_id: "123", role: "manager"}));
            mockPrismaFindMany.mockResolvedValue(mockDonors)

            const res = await request(app)
                .get("/?application_status=rejected")
                .set("Cookie", ["access_token=valid_access_token"]);
            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockDonors);
            expect(mockPrismaFindMany).toHaveBeenCalledWith({
                where: {
                    application_status: "rejected"
                },
                omit: {
                    created_at: true,
                    modified_by: true,
                    modified_at: true
                }
            });

        })

        it ("Should retrieve all approved applications", async () => {
            const mockDonors = [
                {
                    dtn: 1,
                    name: "Athena Miller",
                    application_status: "approved"
                }
            ]

            mockJwtVerify.mockImplementationOnce(() => ({
                user_id: "123"
            }));
            mockPrismaFindUniqueOrThrow
                .mockImplementationOnce(() => ({user_id: "123", role: "manager"}));
            mockPrismaFindMany.mockResolvedValue(mockDonors)

            const res = await request(app)
                .get("/?application_status=approved")
                .set("Cookie", ["access_token=valid_access_token"]);
            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockDonors);
            expect(mockPrismaFindMany).toHaveBeenCalledWith({
                where: {
                    application_status: "approved"
                },
                omit: {
                    created_at: true,
                    modified_by: true,
                    modified_at: true
                }
            });

        })

    })

    describe("GET /:dtn", () => {
        it ("Should return specific donor information", async () => {
            const mockDonor = {
                dtn: 1,
                name: "Athena Miller"
            }
            mockJwtVerify.mockImplementationOnce(() => ({
                user_id: "123"
            }));
            mockPrismaFindUniqueOrThrow
                .mockImplementationOnce(() => ({user_id: "123", role: "manager"}))
                .mockImplementationOnce(() => (mockDonor));

            const res = await request(app)
                .get("/1")
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockDonor);
            expect(mockPrismaFindUniqueOrThrow).toHaveBeenCalledWith({
                where: {
                    dtn: 1
                },
                omit: {
                    created_at: true,
                    modified_by: true,
                    modified_at: true
                }
            })
        })
    })

    describe("POST /register", () => {
        it ("Should register a new donor", async () => {
            const mockApplication = {
                name: "Stiffler",
                email: "sy@gmail.com",
                phone: "0998765790",
                birth_date: "2005-09-15",
                profile: "profile",
            }

            mockJwtVerify.mockImplementationOnce(() => ({
                user_id: "123"
            }));
            mockPrismaFindUniqueOrThrow
                .mockImplementationOnce(() => ({user_id: "123", role: "manager"}));
            mockPrismaCreateDonor.mockResolvedValue(mockApplication)

            const res = await request(app)
                .post("/register")
                .send({
                    application: mockApplication
                })
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(201);
            expect(res.body).toEqual(mockApplication);
            expect(mockPrismaCreateDonor).toHaveBeenCalledWith({
                data: {
                    name: mockApplication.name,
                    email: mockApplication.email,
                    phone: mockApplication.phone,
                    birth_date: new Date(mockApplication.birth_date),
                    profile: mockApplication.profile,
                    modified_by: "123"
                },
                omit: {
                    modified_at: true,
                    created_at: true,
                    modified_by: true,
                }
            })

        })
    })

    describe("POST /public-register", () => {
        it ("Should register a new donor", async () => {
            const mockApplication = {
                name: "Stiffler",
                email: "sy@gmail.com",
                phone: "0998765790",
                birth_date: "2005-09-15",
                profile: "profile",
            }

            mockPrismaCreateDonor.mockResolvedValue(mockApplication)

            const res = await request(app)
                .post("/public-register")
                .send({
                    application: mockApplication
                })

            expect(res.status).toBe(201);
            expect(res.body).toEqual(mockApplication);
            expect(mockPrismaCreateDonor).toHaveBeenCalledWith({
                data: {
                    name: mockApplication.name,
                    email: mockApplication.email,
                    phone: mockApplication.phone,
                    birth_date: new Date(mockApplication.birth_date),
                    profile: mockApplication.profile,
                    modified_by: "00000000-0000-0000-0000-000000000000"
                },
                omit: {
                    modified_at: true,
                    created_at: true,
                    modified_by: true,
                }
            })
        })
    })

    describe("PATCH /:dtn", () => {
        beforeAll(() => {
            jest.clearAllMocks();
            process.env.ACCESS_TOKEN_SECRET = "test_access_secret";
        })


        beforeEach(() => {
            jest.clearAllMocks();
            mockSendApproval.mockResolvedValue(undefined);
            mockSendRejection.mockResolvedValue(undefined);
        });

        it("Should approve donor and send approval email", async () => {
            const mockDonor = {
                dtn: 1,
                name: "Stiffler",
                email: "sy@gmail.com",
                application_status: "approved"
            }

            mockJwtVerify.mockImplementationOnce(() => ({
                user_id: "123"
            }));
            mockPrismaFindUniqueOrThrow
                .mockImplementationOnce(() => ({user_id: "123", role: "manager"}));
            mockPrismaUpdateDonor.mockResolvedValue(mockDonor);
            mockSendApproval.mockResolvedValue(undefined);

            const res = await request(app)
                .patch("/1")
                .send({
                    application_status: "approved",
                })
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(200);
            expect(res.body.application_status).toBe("approved");
            
            // Verify email notification was sent
            expect(mockSendApproval).toHaveBeenCalledWith(mockDonor, "donor");
        });

        it("Should reject donor and send rejection email", async () => {
            const mockDonor = {
                dtn: 1,
                name: "Stiffler",
                email: "sy@gmail.com",
                application_status: "rejected"
            }

            mockJwtVerify.mockImplementationOnce(() => ({
                user_id: "123"
            }));
            mockPrismaFindUniqueOrThrow
                .mockImplementationOnce(() => ({user_id: "123", role: "manager"}));
            mockPrismaUpdateDonor.mockResolvedValue(mockDonor);
            mockSendRejection.mockResolvedValue(undefined);

            const res = await request(app)
                .patch("/1")
                .send({
                    application_status: "rejected",
                })
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(200);
            expect(res.body.application_status).toBe("rejected");
            
            expect(mockSendRejection).toHaveBeenCalledWith(mockDonor, "donor");
        });

        it("Should still approve donor even if email fails", async () => {
            const mockDonor = {
                dtn: 1,
                name: "Stiffler",
                application_status: "approved"
            }

            mockJwtVerify.mockImplementationOnce(() => ({
                user_id: "123"
            }));
            mockPrismaFindUniqueOrThrow
                .mockImplementationOnce(() => ({user_id: "123", role: "manager"}));
            mockPrismaUpdateDonor.mockResolvedValue(mockDonor);
            mockSendApproval.mockRejectedValue(new Error("Email service error"));

            const res = await request(app)
                .patch("/1")
                .send({
                    application_status: "approved",
                })
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(200);
        });
    });

    describe("DELETE /:dtn", () => {
        it ("Should delete a donor", async () => {
            const mockApplication = {
                dtn: 1,
                name: "Stiffler",
            }

            mockJwtVerify.mockImplementationOnce(() => ({user_id: "123"}))
            mockPrismaFindUniqueOrThrow.mockImplementationOnce(() => ({user_id: "123", role: "manager"}));
            mockPrismaUpdateDonor.mockResolvedValue({});
            mockPrismaDeleteDonor.mockResolvedValue({});

            const res = await request(app)
                .delete("/1")
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(204);
            expect(mockPrismaUpdateDonor).toHaveBeenCalledWith(
                {
                    data: {
                        modified_by: "123"
                    },
                    where: {
                        dtn: 1
                    }
                }
            )
            expect(mockPrismaDeleteDonor).toHaveBeenCalledWith({
                where: {
                    dtn: 1
                },
                omit: {
                    modified_at: true,
                    created_at: true,
                    modified_by: true,
                }
            })
        })
    })

    describe("UPDATE /:dtn", () => {
        it("Should update a donor", async () => {
            const mockDonor = {
                name: "Stiffler",
                email: "sy@gmail.com",
                phone: "0998765790",
                birth_date: "2005-09-15",
                profile: "profile",
                application_status: "approved",
                account_status: "approved",
            }

            mockJwtVerify.mockImplementationOnce(() => ({
                user_id: "123"
            }));
            mockPrismaFindUniqueOrThrow
                .mockImplementationOnce(() => ({user_id: "123", role: "manager"}));
            mockPrismaUpdateDonor.mockResolvedValue(mockDonor);

            const res = await request(app)
                .put("/1")
                .send({
                    donor: mockDonor
                })
                .set("Cookie", ["access_token=valid_access_token"]);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockDonor);
            expect(mockPrismaUpdateDonor).toHaveBeenCalledWith({
                data: {
                    name: mockDonor.name,
                    phone: mockDonor.phone,
                    email: mockDonor.email,
                    birth_date: new Date(mockDonor.birth_date),
                    profile: mockDonor.profile,
                    modified_by: "123"
                },
                where: {
                    dtn: 1
                },
                omit: {
                    modified_at: true,
                    created_at: true,
                    modified_by: true,
                }
            })
        })
    })
})