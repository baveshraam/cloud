import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
      // This include is for the credit allocation logic, it's fine as is.
      include: {
        transactions: {
          where: {
            type: "CREDIT_PURCHASE",
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    // --- REVISED LOGIC FOR NEW USER ---
    // A new user is created with 2 credits, and a transaction is recorded
    // to reflect this, making the transaction log the source of truth.
    const name = user.firstName ? `${user.firstName} ${user.lastName}`.trim() : user.emailAddresses[0].emailAddress;
    const initialCredits = 2; // Grant 2 free credits on sign up

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
        credits: initialCredits, // Set the initial credit balance directly
        transactions: {
          create: {
            type: "INITIAL_CREDITS", // Use a more descriptive transaction type
            packageId: "free_user_signup",
            amount: initialCredits, // Record the transaction amount
          },
        },
      },
      // Include the transaction in the return object, same as the findUnique call
      include: {
        transactions: true,
      }
    });

    return newUser;
  } catch (error) {
    console.log("Error in checkUser:", error.message);
    // Return null or handle the error as appropriate for your application
    return null;
  }
};
