const path = require("path");
const { test, expect } = require("@playwright/test");
require("../apps/api/node_modules/dotenv").config({ path: path.resolve(__dirname, "../apps/api/.env") });

const { PrismaClient } = require("../apps/api/node_modules/@prisma/client");

const prisma = new PrismaClient();
const sampleListingImagePath = path.resolve(__dirname, "../apps/web/public/listing-saas.svg");

async function switchAuthMode(page, mode) {
  const registerTab = page.getByTestId("auth-tab-register");
  const loginTab = page.getByTestId("auth-tab-login");
  const submitButton = page.getByTestId("auth-submit");

  if (mode === "register") {
    await expect(async () => {
      await registerTab.click();
      await expect(page.getByLabel("Nom complet")).toBeVisible();
      await expect(submitButton).toHaveText("Creer un compte");
    }).toPass({ timeout: 15000 });
    return;
  }

  await expect(async () => {
    await loginTab.click();
    await expect(page.getByLabel("Nom complet")).toHaveCount(0);
    await expect(submitButton).toHaveText("Connexion");
  }).toPass({ timeout: 15000 });
}

async function registerViaUi(page, { name, email, password, role }) {
  await page.goto("/auth");
  await switchAuthMode(page, "register");
  await page.getByLabel("Nom complet").fill(name);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByLabel("Role").selectOption(role);
  await page.getByTestId("auth-submit").click();
}

async function loginViaUi(page, { email, password }) {
  await page.goto("/auth");
  await switchAuthMode(page, "login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByTestId("auth-submit").click();
}

async function logoutViaUi(page) {
  await page.getByTestId("logout-button").click();
}

async function cleanupData({ sellerEmail, buyerEmail, listingTitle }) {
  const listing = await prisma.listing.findFirst({ where: { title: listingTitle } });

  if (listing) {
    const conversations = await prisma.conversation.findMany({ where: { listingId: listing.id } });
    const conversationIds = conversations.map((conversation) => conversation.id);
    const offers = await prisma.offer.findMany({ where: { listingId: listing.id } });
    const offerIds = offers.map((offer) => offer.id);

    if (conversationIds.length > 0) {
      await prisma.message.deleteMany({ where: { conversationId: { in: conversationIds } } });
      await prisma.conversation.deleteMany({ where: { id: { in: conversationIds } } });
    }

    if (offerIds.length > 0) {
      await prisma.escrowTransaction.deleteMany({ where: { offerId: { in: offerIds } } });
      await prisma.offer.deleteMany({ where: { id: { in: offerIds } } });
    }

    await prisma.listing.deleteMany({ where: { id: listing.id } });
  }

  await prisma.user.deleteMany({ where: { email: { in: [sellerEmail, buyerEmail] } } });
}

test.describe("Parcours marketplace", () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("vendeur et acheteur finalisent un deal depuis l'UI", async ({ browser }) => {
    test.setTimeout(240000);

    const unique = Date.now();
    const sellerEmail = `seller.ui.${unique}@example.com`;
    const buyerEmail = `buyer.ui.${unique}@example.com`;
    const password = "secret123";
    const listingTitle = `UI Flow Listing ${unique}`;
    const sellerContext = await browser.newContext();
    const buyerContext = await browser.newContext();
    const sellerPage = await sellerContext.newPage();
    const buyerPage = await buyerContext.newPage();

    try {
      await registerViaUi(sellerPage, {
        name: "Seller UI Test",
        email: sellerEmail,
        password,
        role: "SELLER",
      });
      await expect(sellerPage).toHaveURL(/\/dashboard/);
      await expect(sellerPage.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();

      await sellerPage.goto("/sell");
      await sellerPage.getByLabel("Titre de l'entreprise").fill(listingTitle);
      await sellerPage.getByLabel("Resume court").fill("SaaS rentable pour test e2e navigateur complet.");
      await sellerPage.getByLabel("Niche").fill("SaaS B2B");
      await sellerPage.getByLabel("Type").fill("Application web");
      await sellerPage.getByLabel("Prix demande").fill("150000");
      await sellerPage.getByLabel("Revenu mensuel").fill("14000");
      await sellerPage.getByLabel("Profit mensuel").fill("6200");
      await sellerPage.getByLabel("Stack technique").fill("Next.js,Node.js,PostgreSQL");
      await sellerPage.getByLabel("Vue d'ensemble").fill(
        "Cette annonce de test couvre l'inscription, la publication, l'offre, la messagerie et le sequestre via le navigateur.",
      );
      await sellerPage.getByLabel("Monetisation et revenus").fill(
        "Le revenu est recurrent et sert ici de donnees de test pour le scenario Playwright complet.",
      );
      await sellerPage.getByLabel("Operations et transfert").fill(
        "Les operations sont documentees et la reprise peut etre simulee integralement dans l'interface.",
      );
      await sellerPage.getByLabel("Potentiel et leviers").fill(
        "Le potentiel vient de la croissance produit et de l'automatisation du pipeline d'acquisition.",
      );
      await sellerPage.locator('input[type="file"]').setInputFiles(sampleListingImagePath);
      await expect(sellerPage.getByText("1 image(s) ajoutee(s) a la galerie.")).toBeVisible();
      const imageUrlsField = sellerPage.getByLabel("URLs des images");
      const currentImageUrls = await imageUrlsField.inputValue();
      await imageUrlsField.fill(`${currentImageUrls}\n/listing-overview.svg`);
      await sellerPage.getByTestId("listing-image-promote-1").click();
      await expect(sellerPage.getByTestId("listing-image-promote-0")).toBeDisabled();
      await sellerPage.getByTestId("listing-image-remove-1").click();
      await expect(sellerPage.getByTestId("listing-image-item-1")).toHaveCount(0);
      await expect(imageUrlsField).toHaveValue("/listing-overview.svg");
      await sellerPage.getByTestId("listing-submit").click();
      await expect(sellerPage.getByText("Annonce creee avec succes.")).toBeVisible();

      await sellerPage.goto("/");
      await expect(sellerPage.getByRole("heading", { name: listingTitle })).toBeVisible();
      await expect(sellerPage.getByAltText(`Apercu visuel de ${listingTitle}`)).toBeVisible();
      await logoutViaUi(sellerPage);
      await expect(sellerPage.getByRole("link", { name: "Connexion" })).toBeVisible();

      await registerViaUi(buyerPage, {
        name: "Buyer UI Test",
        email: buyerEmail,
        password,
        role: "BUYER",
      });
      await expect(buyerPage).toHaveURL(/\/dashboard/);

      await buyerPage.goto("/");
      await buyerPage.getByRole("heading", { name: listingTitle }).scrollIntoViewIfNeeded();
      await buyerPage.getByLabel(`Voir le detail de ${listingTitle}`).click();
      await expect(buyerPage.getByRole("heading", { name: listingTitle })).toBeVisible();

      await buyerPage.getByLabel("Montant de l'offre").fill("145000");
      await buyerPage.getByLabel("Note privee").fill("Je peux avancer rapidement apres revue de la retention.");
      await buyerPage.getByTestId("submit-offer").click();
      await expect(buyerPage.getByText("Offre envoyee avec succes.")).toBeVisible();

      await buyerPage.getByTestId("contact-seller").click();
      await expect(buyerPage).toHaveURL(/\/messages\?conversation=/);
      await buyerPage.getByLabel("Ecrire un message").fill("Bonjour, je souhaite recevoir le dossier de due diligence.");
      await buyerPage.getByTestId("send-message").click();
      await expect(buyerPage.getByText("Bonjour, je souhaite recevoir le dossier de due diligence.")).toBeVisible();
      await logoutViaUi(buyerPage);

      await loginViaUi(sellerPage, { email: sellerEmail, password });
      await expect(sellerPage).toHaveURL(/\/dashboard/);
      await expect(sellerPage.getByRole("link", { name: listingTitle }).first()).toBeVisible();
      await sellerPage.getByRole("button", { name: "Accepter" }).click();
      await expect(sellerPage.getByText("Acceptee")).toBeVisible();
      await logoutViaUi(sellerPage);

      await loginViaUi(buyerPage, { email: buyerEmail, password });
      await expect(buyerPage).toHaveURL(/\/dashboard/);
      await buyerPage.getByRole("button", { name: "Financer le sequestre" }).click();
      await expect(buyerPage.getByText("Sequestre Finance")).toBeVisible();
      await logoutViaUi(buyerPage);

      await loginViaUi(sellerPage, { email: sellerEmail, password });
      await expect(sellerPage).toHaveURL(/\/dashboard/);
      await sellerPage.getByRole("button", { name: "Liberer le sequestre" }).click();
      await expect(sellerPage.getByText("Vendue")).toBeVisible();
    } finally {
      await cleanupData({ sellerEmail, buyerEmail, listingTitle });
      await sellerContext.close();
      await buyerContext.close();
    }
  });
});