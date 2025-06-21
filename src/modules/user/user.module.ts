import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust path as needed
import { UserService } from './user.service'; // If you have a UserService

@Module({
  providers: [PrismaService, UserService], // Add UserService if you have one
  exports: [PrismaService, UserService] // Export what other modules need
})
export class UserModule {}