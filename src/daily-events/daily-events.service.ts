import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DailyEventsService {
  constructor(private prisma: PrismaService) {}

  async getCurrentEvent() {
    // Get the latest admin-approved event
    const dailyEvent = await this.prisma.dailyEvent.findFirst({
      where: {
        adminReviewed: true,
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
}
