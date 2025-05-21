import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import consolidateContact from '../utils/consolidateContact';

const prisma = new PrismaClient();

export const identifyContact = async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({ error: 'Email or phoneNumber is required.' });
  }

  try {
    const response = await consolidateContact(prisma, email, phoneNumber);
    res.status(200).json({ contact: response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};
