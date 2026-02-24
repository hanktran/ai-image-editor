import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { Polar } from "@polar-sh/sdk";
import {
  polar,
  checkout,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import { db } from "~/server/db";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  // Use 'sandbox' if you're using the Polar Sandbox environment
  // Remember that access tokens, products, etc. are completely separated between environments.
  // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
  server: "sandbox",
});

const prisma = new PrismaClient();
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "eaa58bcd-67cd-47ee-a8ba-c133958177c3",
              slug: "large",
            },
            {
              productId: "5e3563c7-34e9-4c48-999d-3da4789dafe2",
              slug: "medium",
            },
            {
              productId: "4a98e8df-f9b6-47db-a746-de1533438cd6",
              slug: "small",
            },
          ],
          successUrl: "/dashboard",
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          onOrderPaid: async (order) => {
            const externalCustomerId = order.data.customer.externalId;

            if (!externalCustomerId) {
              console.error("No external customer ID found for order");
              throw new Error("No external customer ID found for order");
            }

            const productId = order.data.productId;

            let creditsToAdd = 0;
            switch (productId) {
              case "eaa58bcd-67cd-47ee-a8ba-c133958177c3": // large
                creditsToAdd = 400;
                break;
              case "5e3563c7-34e9-4c48-999d-3da4789dafe2": // medium
                creditsToAdd = 200;
                break;
              case "4a98e8df-f9b6-47db-a746-de1533438cd6": // small
                creditsToAdd = 50;
                break;
              default:
                console.error("Unknown product ID:", productId);
                throw new Error("Unknown product ID");
            }

            await db.user.update({
              where: { id: externalCustomerId },
              data: { credits: { increment: creditsToAdd } },
            });
          },
        }),
      ],
    }),
  ],
});
