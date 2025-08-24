"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Sets the user's role and related information
 */
export async function setUserRole(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Find user in our database
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found in database");

  const role = formData.get("role");

  if (!role || !["PATIENT", "DOCTOR"].includes(role)) {
    throw new Error("Invalid role selection");
  }

  try {
    // For patient role - simple update
    if (role === "PATIENT") {
      await db.user.update({
        where: {
          clerkUserId: userId,
        },
        data: {
          role: "PATIENT",
        },
      });

      revalidatePath("/");
      return { success: true, redirect: "/doctors" };
    }

    // For doctor role - need additional information
    if (role === "DOCTOR") {
      const specialty = formData.get("specialty");
      const experienceStr = formData.get("experience");
      const credentialUrl = formData.get("credentialUrl");
      const description = formData.get("description");

      // --- REVISED VALIDATION LOGIC ---
      // 1. Check if any of the text fields are empty
      if (!specialty || !experienceStr || !credentialUrl || !description) {
        throw new Error("All fields are required");
      }

      // 2. Parse the experience string into a number
      const experience = parseInt(experienceStr, 10);

      // 3. Specifically check if the parsed experience is not a valid number
      //    This prevents `NaN` from being sent to the database, which was causing the error.
      if (isNaN(experience) || experience < 0) {
        throw new Error("Years of experience must be a valid positive number.");
      }

      await db.user.update({
        where: {
          clerkUserId: userId,
        },
        data: {
          role: "DOCTOR",
          specialty,
          experience, // Now we are sure this is a valid number
          credentialUrl,
          description,
          verificationStatus: "PENDING",
        },
      });

      revalidatePath("/");
      return { success: true, redirect: "/doctor/verification" };
    }
  } catch (error) {
    console.error("Failed to set user role:", error);
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
}

/**
 * Gets the current user's complete profile information
 */
export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    return user;
  } catch (error) {
    console.error("Failed to get user information:", error);
    return null;
  }
}
