import { PrismaClient } from '@prisma/client';

export default async function consolidateContact(
  prisma: PrismaClient,
  email?: string,
  phoneNumber?: string
) {
  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        email ? { email } : undefined,
        phoneNumber ? { phoneNumber } : undefined,
      ].filter(Boolean),
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  let primary = null;

  if (contacts.length > 0) {
    const primaries = contacts.map(c => (c.linkPrecedence === 'primary' ? c : null)).filter(Boolean);
    const primaryContact = primaries.length > 0 ? primaries[0] : contacts[0];
    primary = await prisma.contact.findFirst({ where: { id: primaryContact.id } });

    const allLinked = await prisma.contact.findMany({
      where: {
        OR: [
          { id: primary.id },
          { linkedId: primary.id },
        ],
      },
    });

    const emails = Array.from(new Set(allLinked.map(c => c.email).filter(Boolean)));
    const phoneNumbers = Array.from(new Set(allLinked.map(c => c.phoneNumber).filter(Boolean)));
    const secondaryIds = allLinked.filter(c => c.linkPrecedence === 'secondary').map(c => c.id);

    const alreadyExists = allLinked.find(c => c.email === email && c.phoneNumber === phoneNumber);

    if (!alreadyExists && (email !== primary.email || phoneNumber !== primary.phoneNumber)) {
      const newSecondary = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkedId: primary.id,
          linkPrecedence: 'secondary',
        },
      });
      secondaryIds.push(newSecondary.id);
      if (email && !emails.includes(email)) emails.push(email);
      if (phoneNumber && !phoneNumbers.includes(phoneNumber)) phoneNumbers.push(phoneNumber);
    }

    return {
      primaryContatctId: primary.id,
      emails,
      phoneNumbers,
      secondaryContactIds: secondaryIds,
    };
  }

  // Create new primary contact
  const newContact = await prisma.contact.create({
    data: {
      email,
      phoneNumber,
      linkPrecedence: 'primary',
    },
  });

  return {
    primaryContatctId: newContact.id,
    emails: [email].filter(Boolean),
    phoneNumbers: [phoneNumber].filter(Boolean),
    secondaryContactIds: [],
  };
}
