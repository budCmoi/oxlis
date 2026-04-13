const {
  assert,
  cleanupTracker,
  createTracker,
  disconnect,
  registerUser,
  remember,
  request,
} = require("./test-helpers");

async function main() {
  const tracker = createTracker();

  try {
    console.log("1. Preparation des utilisateurs et d'une annonce de test");
    const seller = await registerUser({
      name: "Error Seller",
      role: "SELLER",
      emailPrefix: "seller.errors",
      tracker,
    });
    const buyer = await registerUser({
      name: "Error Buyer",
      role: "BUYER",
      emailPrefix: "buyer.errors",
      tracker,
    });
    const outsider = await registerUser({
      name: "Error Outsider",
      role: "BUYER",
      emailPrefix: "outsider.errors",
      tracker,
    });

    const listing = await request("/listings", {
      method: "POST",
      token: seller.token,
      expectedStatus: 201,
      body: {
        title: "Error Flow Listing",
        summary: "Annonce reservee aux tests d'erreurs d'integration.",
        description:
          "Cette annonce existe uniquement pour verifier les cas d'erreur d'acces, de roles et de validation sur une base PostgreSQL reelle.",
        niche: "Tests integration",
        type: "SaaS",
        askingPrice: 99000,
        monthlyRevenue: 8000,
        monthlyProfit: 3200,
        techStack: ["Node.js", "Express", "PostgreSQL"],
        status: "ACTIVE",
      },
    });
    remember(tracker, "listingIds", listing.body.id);

    console.log("2. Refus d'une offre sur sa propre annonce");
    const ownOffer = await request("/offers", {
      method: "POST",
      token: seller.token,
      expectedStatus: 400,
      body: {
        listingId: listing.body.id,
        amount: 90000,
        message: "Je tente a tort de faire une offre sur ma propre annonce.",
      },
    });
    assert(
      ownOffer.body.message === "Impossible de faire une offre sur votre propre annonce",
      "Le vendeur doit etre bloque sur sa propre annonce",
    );

    console.log("3. Refus d'acces a une conversation pour un tiers");
    const conversation = await request("/messages/conversations", {
      method: "POST",
      token: buyer.token,
      expectedStatus: 201,
      body: {
        listingId: listing.body.id,
        recipientId: seller.user.id,
      },
    });
    remember(tracker, "conversationIds", conversation.body.id);

    await request(`/messages/conversations/${conversation.body.id}/messages`, {
      method: "POST",
      token: buyer.token,
      expectedStatus: 201,
      body: { content: "Premier message legitime de l'acheteur." },
    });

    const outsiderRead = await request(`/messages/conversations/${conversation.body.id}/messages`, {
      token: outsider.token,
      expectedStatus: 403,
    });
    assert(outsiderRead.body.message === "Action non autorisee", "Le tiers ne doit pas lire la conversation");

    console.log("4. Refus d'acceptation d'offre par l'acheteur");
    const offer = await request("/offers", {
      method: "POST",
      token: buyer.token,
      expectedStatus: 201,
      body: {
        listingId: listing.body.id,
        amount: 91000,
        message: "Offre valide pour continuer les tests d'autorisation.",
      },
    });
    remember(tracker, "offerIds", offer.body.id);

    const buyerAccept = await request(`/offers/${offer.body.id}/status`, {
      method: "PATCH",
      token: buyer.token,
      expectedStatus: 403,
      body: { status: "ACCEPTED" },
    });
    assert(
      buyerAccept.body.message === "Seul le vendeur peut accepter les offres",
      "L'acheteur ne doit pas pouvoir accepter sa propre offre",
    );

    console.log("5. Refus de financement et de liberation du sequestre par le mauvais role");
    await request(`/offers/${offer.body.id}/status`, {
      method: "PATCH",
      token: seller.token,
      expectedStatus: 200,
      body: { status: "ACCEPTED" },
    });

    const sellerFund = await request(`/escrow/offers/${offer.body.id}/fund`, {
      method: "POST",
      token: seller.token,
      expectedStatus: 403,
    });
    assert(
      sellerFund.body.message === "Seul l'acheteur peut financer le sequestre",
      "Le vendeur ne doit pas financer le sequestre",
    );

    const buyerRelease = await request(`/escrow/offers/${offer.body.id}/release`, {
      method: "POST",
      token: buyer.token,
      expectedStatus: 403,
    });
    assert(
      buyerRelease.body.message === "Seul le vendeur peut liberer le sequestre",
      "L'acheteur ne doit pas liberer le sequestre",
    );

    console.log("6. Refus d'un payload d'annonce invalide");
    const invalidListing = await request("/listings", {
      method: "POST",
      token: seller.token,
      expectedStatus: 400,
      body: {
        title: "Bad",
        summary: "Court",
        description: "Trop court pour valider correctement.",
        niche: "X",
        type: "Y",
        askingPrice: -1,
        monthlyRevenue: 0,
        monthlyProfit: 0,
        techStack: [],
        status: "ACTIVE",
      },
    });
    assert(invalidListing.body.message === "Payload invalide", "Le schema doit rejeter l'annonce invalide");

    console.log("Tests d'erreurs PostgreSQL OK");
  } finally {
    await cleanupTracker(tracker);
    await disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});