import { PrismaService } from '../prisma/prisma.service';
export declare class DailyEventsService {
    private prisma;
    constructor(prisma: PrismaService);
    getCurrentEvent(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        result: string | null;
        status: import(".prisma/client").$Enums.DailyEventStatus;
        date: Date;
        sport: string;
        matches: import("@prisma/client/runtime/library").JsonValue;
        totalOdds: number;
        aiPredictions: import("@prisma/client/runtime/library").JsonValue | null;
        adminPredictions: import("@prisma/client/runtime/library").JsonValue | null;
        adminComments: string | null;
        adminReviewed: boolean;
    }>;
    createEvent(eventData: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        result: string | null;
        status: import(".prisma/client").$Enums.DailyEventStatus;
        date: Date;
        sport: string;
        matches: import("@prisma/client/runtime/library").JsonValue;
        totalOdds: number;
        aiPredictions: import("@prisma/client/runtime/library").JsonValue | null;
        adminPredictions: import("@prisma/client/runtime/library").JsonValue | null;
        adminComments: string | null;
        adminReviewed: boolean;
    }>;
    updateEvent(id: string, updateData: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        result: string | null;
        status: import(".prisma/client").$Enums.DailyEventStatus;
        date: Date;
        sport: string;
        matches: import("@prisma/client/runtime/library").JsonValue;
        totalOdds: number;
        aiPredictions: import("@prisma/client/runtime/library").JsonValue | null;
        adminPredictions: import("@prisma/client/runtime/library").JsonValue | null;
        adminComments: string | null;
        adminReviewed: boolean;
    }>;
    getEventById(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        result: string | null;
        status: import(".prisma/client").$Enums.DailyEventStatus;
        date: Date;
        sport: string;
        matches: import("@prisma/client/runtime/library").JsonValue;
        totalOdds: number;
        aiPredictions: import("@prisma/client/runtime/library").JsonValue | null;
        adminPredictions: import("@prisma/client/runtime/library").JsonValue | null;
        adminComments: string | null;
        adminReviewed: boolean;
    }>;
}
