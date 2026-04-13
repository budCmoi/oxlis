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
  const unique = Date.now();
  const tracker = createTracker();

  try {
    console.log("1. Creation des comptes de test");
    const seller = await registerUser({
      name: "Smoke Seller",
      role: "SELLER",
      emailPrefix: "seller.smoke",
      tracker,
    });
    const buyer = await registerUser({
      name: "Smoke Buyer",
      role: "BUYER",
      emailPrefix: "buyer.smoke",
      tracker,
    });

    const sellerToken = seller.token;
    const buyerToken = buyer.token;

    console.log("2. Creation d'une annonce par le vendeur");
    const listing = await request("/listings", {
      method: "POST",
      token: sellerToken,
      expectedStatus: 201,
      body: {
        title: `Smoke Listing ${unique}`,
        summary: "SaaS B2B rentable pour test d'integration complet.",
        description:
          "Cette annonce sert au smoke test de l'API avec une base PostgreSQL reelle, des flux documentes et des revenus recurrents.",
        niche: "B2B SaaS",
        type: "SaaS",
        askingPrice: 123000,
        monthlyRevenue: 12000,
        monthlyProfit: 5400,
        techStack: ["Next.js", "Node.js", "PostgreSQL"],
        status: "ACTIVE",
      },
    });
    remember(tracker, "listingIds", listing.body.id);

    console.log("3. Ouverture d'une conversation puis echange de messages");
    const conversation = await request("/messages/conversations", {
      method: "POST",
      token: buyerToken,
      expectedStatus: 201,
      body: {
        listingId: listing.body.id,
        recipientId: seller.user.id,
      },
    });
    remember(tracker, "conversationIds", conversation.body.id);

    await request(`/messages/conversations/${conversation.body.id}/messages`, {
      method: "POST",
      token: buyerToken,
      expectedStatus: 201,
      body: { content: "Bonjour, pouvez-vous partager les details de retention et du churn ?" },
    });

    await request(`/messages/conversations/${conversation.body.id}/messages`, {
      method: "POST",
      token: sellerToken,
      expectedStatus: 201,
      body: { content: "Oui, je peux fournir un dossier de due diligence complet des aujourd'hui." },
    });

    const messages = await request(`/messages/conversations/${conversation.body.id}/messages`, {
      token: sellerToken,
      expectedStatus: 200,
    });
    assert(Array.isArray(messages.body) && messages.body.length === 2, "La conversation doit contenir 2 messages");

    console.log("4. Creation puis acceptation d'une offre");
    const offer = await request("/offers", {
      method: "POST",
      token: buyerToken,
      expectedStatus: 201,
      body: {
        listingId: listing.body.id,
        amount: 118000,
        message: "Offre initiale avec closing rapide si les KPI confirment la tendance.",
      },
    });
    remember(tracker, "offerIds", offer.body.id);

    await request(`/offers/${offer.body.id}/status`, {
      method: "PATCH",
      token: sellerToken,
      expectedStatus: 200,
      body: { status: "ACCEPTED" },
    });

    const escrowBeforeFunding = await request(`/escrow/offers/${offer.body.id}`, {
      token: buyerToken,
      expectedStatus: 200,
    });
    assert(escrowBeforeFunding.body.status === "INITIATED", "Le sequestre doit etre initie apres acceptation");

    console.log("5. Financement et liberation du sequestre");
    await request(`/escrow/offers/${offer.body.id}/fund`, {
      method: "POST",
      token: buyerToken,
      expectedStatus: 200,
    });

    const fundedEscrow = await request(`/escrow/offers/${offer.body.id}`, {
      token: sellerToken,
      expectedStatus: 200,
    });
    assert(fundedEscrow.body.status === "FUNDED", "Le sequestre doit etre finance avant liberation");

    await request(`/escrow/offers/${offer.body.id}/release`, {
      method: "POST",
      token: sellerToken,
      expectedStatus: 200,
    });

    console.log("6. Verification des dashboards et de l'etat final de l'annonce");
    const sellerDashboard = await request("/dashboard", {
      token: sellerToken,
      expectedStatus: 200,
    });
    const buyerDashboard = await request("/dashboard", {
      token: buyerToken,
      expectedStatus: 200,
    });
    const listingDetail = await request(`/listings/${listing.body.id}`, {
      expectedStatus: 200,
    });
    const releasedEscrow = await request(`/escrow/offers/${offer.body.id}`, {
      token: buyerToken,
      expectedStatus: 200,
    });

    assert(sellerDashboard.body.offersReceived.length >= 1, "Le dashboard vendeur doit exposer l'offre recue");
    assert(buyerDashboard.body.offersMade.length >= 1, "Le dashboard acheteur doit exposer l'offre envoyee");
    assert(listingDetail.body.status === "SOLD", "L'annonce doit etre marquee vendue apres liberation");
    assert(releasedEscrow.body.status === "RELEASED", "Le sequestre doit etre libere en fin de parcours");

    console.log("Smoke test PostgreSQL OK");
  } finally {
    await cleanupTracker(tracker);
    await disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});