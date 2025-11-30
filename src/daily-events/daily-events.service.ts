import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DailyEventsService {
  constructor(private prisma: PrismaService) {}

  async getCurrentEvent() {
    // Get the latest admin-approved event that is still PENDING (not yet completed)
    const dailyEvent = await this.prisma.dailyEvent.findFirst({
      where: {
        adminReviewed: true,
        status: 'PENDING', // Only return events that are still pending
      },
      orderBy: [
        {
          date: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return dailyEvent;
  }

  async createEvent(eventData: any) {
    return this.prisma.dailyEvent.create({
      data: eventData,
    });
  }

  async updateEvent(id: string, updateData: any) {
    return this.prisma.dailyEvent.update({
      where: { id },
      data: updateData,
    });
  }

  async getEventById(id: string) {
    return this.prisma.dailyEvent.findUnique({
      where: { id },
    });
  }

  async getEventHistory(limit = 50) {
    return this.prisma.dailyEvent.findMany({
      where: {
        status: {
          in: ['WON', 'LOST', 'VOID'],
        },
      },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }
}
